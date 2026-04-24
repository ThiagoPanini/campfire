from __future__ import annotations

import pytest

from application.user_context.service import GetOrBootstrapLocalUser, InvalidIdentityClaimsError
from domain.user.models import (
    AuthenticationIdentityLink,
    LocalUser,
    OnboardingStatus,
    VerifiedIdentityClaims,
    normalize_email,
)
from helpers.auth_claims import auth_claims


# ---------------------------------------------------------------------------
# In-memory repository (minimal, covers what service needs)
# ---------------------------------------------------------------------------


class InMemoryRepository:
    def __init__(self) -> None:
        self.users_by_email: dict[str, LocalUser] = {}
        self.links: dict[tuple[str, str], str] = {}

    def get_by_provider_identity(self, provider_name: str, provider_subject: str) -> LocalUser | None:
        user_id = self.links.get((provider_name, provider_subject))
        if user_id is None:
            return None
        return next((u for u in self.users_by_email.values() if u.user_id == user_id), None)

    def get_by_email(self, email_normalized: str) -> LocalUser | None:
        return self.users_by_email.get(email_normalized)

    def create(self, user: LocalUser) -> LocalUser:
        self.users_by_email[user.email_normalized] = user
        return user

    def create_identity_link(self, link: AuthenticationIdentityLink) -> None:
        self.links[(link.provider_name, link.provider_subject)] = link.user_id

    def update(self, user: LocalUser) -> LocalUser:
        self.users_by_email[user.email_normalized] = user
        return user

    def update_onboarding_state(self, user_id: str, status: OnboardingStatus) -> LocalUser:
        user = next(u for u in self.users_by_email.values() if u.user_id == user_id)
        updated = user.complete_onboarding() if status == OnboardingStatus.COMPLETED else user.defer_onboarding()
        return self.update(updated)


# ---------------------------------------------------------------------------
# normalize_email
# ---------------------------------------------------------------------------


def test_normalize_email_lowercases_and_strips() -> None:
    assert normalize_email("  ASH@Example.COM  ") == "ash@example.com"


def test_normalize_email_already_normalized() -> None:
    assert normalize_email("ash@example.com") == "ash@example.com"


# ---------------------------------------------------------------------------
# LocalUser.bootstrap
# ---------------------------------------------------------------------------


def test_bootstrap_creates_user_with_required_onboarding() -> None:
    claims = auth_claims()
    user = LocalUser.bootstrap(claims)

    assert user.email == "ash@example.com"
    assert user.email_normalized == "ash@example.com"
    assert user.onboarding_status is OnboardingStatus.REQUIRED
    assert user.onboarding_completed_at is None
    assert user.onboarding_deferred_at is None


def test_bootstrap_normalizes_email() -> None:
    claims = auth_claims(email="ASH@EXAMPLE.COM")
    user = LocalUser.bootstrap(claims)

    assert user.email == "ASH@EXAMPLE.COM"
    assert user.email_normalized == "ash@example.com"


# ---------------------------------------------------------------------------
# GetOrBootstrapLocalUser - unverified email rejection
# ---------------------------------------------------------------------------


def test_unverified_email_is_rejected() -> None:
    claims = auth_claims(email_verified=False)
    service = GetOrBootstrapLocalUser(repository=InMemoryRepository())

    with pytest.raises(InvalidIdentityClaimsError):
        service.execute(claims)


def test_missing_provider_subject_is_rejected() -> None:
    claims = auth_claims(provider_subject="")
    service = GetOrBootstrapLocalUser(repository=InMemoryRepository())

    with pytest.raises(InvalidIdentityClaimsError):
        service.execute(claims)


# ---------------------------------------------------------------------------
# GetOrBootstrapLocalUser - new user creation
# ---------------------------------------------------------------------------


def test_first_login_creates_user_and_identity_link() -> None:
    repo = InMemoryRepository()
    service = GetOrBootstrapLocalUser(repository=repo)
    claims = auth_claims()

    result = service.execute(claims)

    assert result.first_login is True
    assert result.user.email_normalized == "ash@example.com"
    assert repo.links[("cognito", "subject-1")] == result.user.user_id


# ---------------------------------------------------------------------------
# GetOrBootstrapLocalUser - returning user
# ---------------------------------------------------------------------------


def test_returning_user_same_provider_returns_false_first_login() -> None:
    repo = InMemoryRepository()
    service = GetOrBootstrapLocalUser(repository=repo)
    claims = auth_claims()

    first = service.execute(claims)
    second = service.execute(claims)

    assert first.first_login is True
    assert second.first_login is False
    assert first.user.user_id == second.user.user_id


# ---------------------------------------------------------------------------
# GetOrBootstrapLocalUser - duplicate-email prevention and identity linking
# ---------------------------------------------------------------------------


def test_google_links_to_existing_email_password_user() -> None:
    """Google sign-in for an existing email-password user links identities and reuses user_id."""
    repo = InMemoryRepository()
    service = GetOrBootstrapLocalUser(repository=repo)

    # First login via email/password
    cognito_claims = auth_claims(provider_name="cognito", provider_subject="cognito-sub-1")
    first_result = service.execute(cognito_claims)
    original_user_id = first_result.user.user_id

    # Same email, different provider (Google)
    google_claims = auth_claims(provider_name="google", provider_subject="google-sub-1")
    google_result = service.execute(google_claims)

    assert google_result.user.user_id == original_user_id
    assert google_result.first_login is False
    assert repo.links[("google", "google-sub-1")] == original_user_id


def test_different_email_creates_separate_user() -> None:
    repo = InMemoryRepository()
    service = GetOrBootstrapLocalUser(repository=repo)

    result_a = service.execute(auth_claims(email="a@example.com", provider_subject="sub-a"))
    result_b = service.execute(auth_claims(email="b@example.com", provider_subject="sub-b"))

    assert result_a.user.user_id != result_b.user.user_id
