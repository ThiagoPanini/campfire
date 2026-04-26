import pytest

from campfire_api.contexts.identity.application.errors import RefreshTokenReused
from campfire_api.contexts.identity.application.use_cases.authenticate_user import AuthenticateUser
from campfire_api.contexts.identity.application.use_cases.refresh_session import RefreshSession
from campfire_api.contexts.identity.application.use_cases.register_user import RegisterUser
from tests.unit.identity.fakes import (
    FakeCredentials,
    FakeHasher,
    FakePreferences,
    FakeRefreshTokens,
    FakeSessions,
    FakeTokenIssuer,
    FakeUsers,
    FrozenClock,
)

pytestmark = pytest.mark.unit


async def setup_refresh():
    clock = FrozenClock()
    users, credentials, preferences = FakeUsers(), FakeCredentials(), FakePreferences()
    await RegisterUser(users, credentials, preferences, FakeHasher(), clock)(
        "ada@campfire.test", "campfire123"
    )
    sessions, refresh_tokens, issuer = FakeSessions(), FakeRefreshTokens(), FakeTokenIssuer(clock)
    auth = AuthenticateUser(
        users, credentials, sessions, refresh_tokens, FakeHasher(), issuer, clock, 900
    )
    issued = await auth("ada@campfire.test", "campfire123")
    return RefreshSession(sessions, refresh_tokens, issuer, clock, 900), issued, sessions


async def test_refresh_session_rotates() -> None:
    use_case, issued, sessions = await setup_refresh()
    rotated = await use_case(issued.refresh_token)
    assert rotated.access_token != issued.access_token
    assert len(sessions.rows) == 2


async def test_refresh_token_single_use() -> None:
    use_case, issued, _sessions = await setup_refresh()
    await use_case(issued.refresh_token)
    with pytest.raises(RefreshTokenReused):
        await use_case(issued.refresh_token)


async def test_refresh_reuse_revokes_family() -> None:
    use_case, issued, sessions = await setup_refresh()
    await use_case(issued.refresh_token)
    with pytest.raises(RefreshTokenReused):
        await use_case(issued.refresh_token)
    assert all(row.revoked_at is not None for row in sessions.rows.values())
