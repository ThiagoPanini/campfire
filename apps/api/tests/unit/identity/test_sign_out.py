import pytest

from campfire_api.contexts.identity.application.use_cases.authenticate_user import AuthenticateUser
from campfire_api.contexts.identity.application.use_cases.register_user import RegisterUser
from campfire_api.contexts.identity.application.use_cases.sign_out import RevokeSession
from tests.unit.identity.fakes import (
    FakeCredentials,
    FakeHasher,
    FakeRefreshTokens,
    FakeSessions,
    FakeTokenIssuer,
    FakeUsers,
    FrozenClock,
)

pytestmark = pytest.mark.unit


async def test_sign_out_revokes_session_and_refresh_family_idempotently() -> None:
    clock = FrozenClock()
    users, credentials = FakeUsers(), FakeCredentials()
    await RegisterUser(users, credentials, FakeHasher(), clock)(
        "ada@campfire.test", "campfire123"
    )
    sessions, refresh_tokens = FakeSessions(), FakeRefreshTokens()
    await AuthenticateUser(
        users,
        credentials,
        sessions,
        refresh_tokens,
        FakeHasher(),
        FakeTokenIssuer(clock),
        clock,
        900,
    )("ada@campfire.test", "campfire123")
    session = next(iter(sessions.rows.values()))
    use_case = RevokeSession(sessions, refresh_tokens, clock)
    await use_case(session.id, session.family_id)
    await use_case(session.id, session.family_id)
    assert session.revoked_reason == "signed_out"
    assert next(iter(refresh_tokens.rows.values())).revoked_reason == "signed_out"
