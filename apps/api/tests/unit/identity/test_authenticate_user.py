import pytest

from campfire_api.contexts.identity.application.errors import InvalidCredentials
from campfire_api.contexts.identity.application.use_cases.authenticate_user import AuthenticateUser
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


async def setup_auth():
    clock = FrozenClock()
    users, credentials, preferences = FakeUsers(), FakeCredentials(), FakePreferences()
    await RegisterUser(users, credentials, preferences, FakeHasher(), clock)(
        "ada@campfire.test", "campfire123"
    )
    sessions, refresh = FakeSessions(), FakeRefreshTokens()
    return AuthenticateUser(
        users, credentials, sessions, refresh, FakeHasher(), FakeTokenIssuer(clock), clock, 900
    )


async def test_authenticate_user_happy_path() -> None:
    issued = await (await setup_auth())("ada@campfire.test", "campfire123")
    assert issued.access_token.startswith("access-")
    assert issued.refresh_token.startswith("refresh-")


async def test_authenticate_user_wrong_password_generic() -> None:
    with pytest.raises(InvalidCredentials):
        await (await setup_auth())("ada@campfire.test", "wrong")


async def test_authenticate_user_unknown_email_generic() -> None:
    with pytest.raises(InvalidCredentials):
        await (await setup_auth())("missing@campfire.test", "campfire123")
