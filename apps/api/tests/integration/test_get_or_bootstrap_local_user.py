from __future__ import annotations

from application.user_context.service import GetOrBootstrapLocalUser
from domain.user.models import AuthenticationIdentityLink, LocalUser, OnboardingStatus, VerifiedIdentityClaims


class InMemoryRepository:
    def __init__(self) -> None:
        self.users: dict[tuple[str, str], LocalUser] = {}
        self.users_by_email: dict[str, LocalUser] = {}
        self.links: dict[tuple[str, str], str] = {}

    def get_by_provider_identity(self, provider_name: str, provider_subject: str) -> LocalUser | None:
        user_id = self.links.get((provider_name, provider_subject))
        if user_id is None:
            return None
        return next((user for user in self.users_by_email.values() if user.user_id == user_id), None)

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
        user = next(user for user in self.users_by_email.values() if user.user_id == user_id)
        updated = user.complete_onboarding() if status == OnboardingStatus.COMPLETED else user.defer_onboarding()
        return self.update(updated)


def test_bootstraps_then_reuses_local_user() -> None:
    repository = InMemoryRepository()
    service = GetOrBootstrapLocalUser(repository=repository)
    claims = VerifiedIdentityClaims(
        provider_name="cognito",
        provider_subject="subject-1",
        email="ash@example.com",
        email_verified=True,
        display_name="Ash Rivera",
    )

    first_result = service.execute(claims)
    second_result = service.execute(claims)

    assert first_result.first_login is True
    assert second_result.first_login is False
    assert first_result.user.user_id == second_result.user.user_id


def test_google_to_email_linking_reuses_user_id() -> None:
    """Google sign-in with a verified email matching an existing email/password account links and reuses the account."""
    repository = InMemoryRepository()
    service = GetOrBootstrapLocalUser(repository=repository)

    cognito_claims = VerifiedIdentityClaims(
        provider_name="cognito",
        provider_subject="cognito-sub-linking",
        email="linking@example.com",
        email_verified=True,
        display_name="Link User",
    )
    google_claims = VerifiedIdentityClaims(
        provider_name="google",
        provider_subject="google-sub-linking",
        email="linking@example.com",
        email_verified=True,
        display_name="Link User",
    )

    cognito_result = service.execute(cognito_claims)
    google_result = service.execute(google_claims)

    assert cognito_result.user.user_id == google_result.user.user_id
    assert google_result.first_login is False


def test_first_login_dto_has_required_onboarding_status() -> None:
    repository = InMemoryRepository()
    service = GetOrBootstrapLocalUser(repository=repository)
    claims = VerifiedIdentityClaims(
        provider_name="cognito",
        provider_subject="sub-onboarding",
        email="onboarding@example.com",
        email_verified=True,
        display_name="Onboard User",
    )

    result = service.execute(claims)

    assert result.first_login is True
    assert result.user.onboarding_status.value == "required"


def test_returning_user_retains_onboarding_status() -> None:
    repository = InMemoryRepository()
    service = GetOrBootstrapLocalUser(repository=repository)
    claims = VerifiedIdentityClaims(
        provider_name="cognito",
        provider_subject="sub-returning",
        email="returning@example.com",
        email_verified=True,
        display_name="Returning User",
    )

    service.execute(claims)
    returning_result = service.execute(claims)

    assert returning_result.first_login is False
    assert returning_result.user.onboarding_status.value == "required"
