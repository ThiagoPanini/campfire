from __future__ import annotations

from application.user_context.service import GetOrBootstrapLocalUser
from domain.user.models import LocalUser, VerifiedIdentityClaims


class InMemoryRepository:
    def __init__(self) -> None:
        self.users: dict[tuple[str, str], LocalUser] = {}

    def get_by_provider_identity(self, provider_name: str, provider_subject: str) -> LocalUser | None:
        return self.users.get((provider_name, provider_subject))

    def create(self, user: LocalUser) -> LocalUser:
        self.users[(user.provider_name, user.provider_subject)] = user
        return user

    def update(self, user: LocalUser) -> LocalUser:
        self.users[(user.provider_name, user.provider_subject)] = user
        return user


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
