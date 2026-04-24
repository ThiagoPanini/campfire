from __future__ import annotations

from datetime import UTC, datetime

from application.preferences.service import UpdateOnboardingState
from domain.user.models import AuthenticationIdentityLink, LocalUser, OnboardingStatus
from helpers.auth_claims import auth_claims


# ---------------------------------------------------------------------------
# Minimal in-memory user repository for testing onboarding transitions
# ---------------------------------------------------------------------------


class InMemoryUserRepository:
    def __init__(self) -> None:
        self.users: dict[str, LocalUser] = {}

    def get_by_provider_identity(self, provider_name: str, provider_subject: str) -> LocalUser | None:
        return None

    def get_by_email(self, email_normalized: str) -> LocalUser | None:
        return next((u for u in self.users.values() if u.email_normalized == email_normalized), None)

    def create(self, user: LocalUser) -> LocalUser:
        self.users[user.user_id] = user
        return user

    def create_identity_link(self, link: AuthenticationIdentityLink) -> None:
        pass

    def update(self, user: LocalUser) -> LocalUser:
        self.users[user.user_id] = user
        return user

    def update_onboarding_state(self, user_id: str, status: OnboardingStatus) -> LocalUser:
        user = self.users[user_id]
        updated = user.complete_onboarding() if status == OnboardingStatus.COMPLETED else user.defer_onboarding()
        self.users[user_id] = updated
        return updated


def _make_user() -> tuple[LocalUser, InMemoryUserRepository]:
    repo = InMemoryUserRepository()
    user = LocalUser.bootstrap(auth_claims())
    repo.create(user)
    return user, repo


# ---------------------------------------------------------------------------
# Onboarding transitions
# ---------------------------------------------------------------------------


def test_new_user_starts_with_required_onboarding() -> None:
    user, _ = _make_user()
    assert user.onboarding_status is OnboardingStatus.REQUIRED


def test_complete_onboarding_sets_completed_status() -> None:
    user, repo = _make_user()
    service = UpdateOnboardingState(repository=repo)

    updated = service.complete(user.user_id)

    assert updated.onboarding_status is OnboardingStatus.COMPLETED
    assert updated.onboarding_completed_at is not None
    assert updated.onboarding_deferred_at is None


def test_defer_onboarding_sets_deferred_status() -> None:
    user, repo = _make_user()
    service = UpdateOnboardingState(repository=repo)

    updated = service.defer(user.user_id)

    assert updated.onboarding_status is OnboardingStatus.DEFERRED
    assert updated.onboarding_deferred_at is not None
    assert updated.onboarding_completed_at is None


def test_complete_after_defer_sets_completed() -> None:
    user, repo = _make_user()
    service = UpdateOnboardingState(repository=repo)

    service.defer(user.user_id)
    updated = service.complete(user.user_id)

    assert updated.onboarding_status is OnboardingStatus.COMPLETED
    assert updated.onboarding_completed_at is not None


def test_complete_onboarding_records_timestamp() -> None:
    user, repo = _make_user()
    before = datetime.now(UTC)
    service = UpdateOnboardingState(repository=repo)

    updated = service.complete(user.user_id)
    after = datetime.now(UTC)

    assert before <= updated.onboarding_completed_at <= after


def test_onboarding_status_values_match_contract() -> None:
    assert OnboardingStatus.REQUIRED.value == "required"
    assert OnboardingStatus.COMPLETED.value == "completed"
    assert OnboardingStatus.DEFERRED.value == "deferred"
