import pytest

from campfire_api.contexts.identity.application.errors import GoogleStubDisabled
from campfire_api.contexts.identity.application.use_cases.authenticate_user import AuthenticateUser
from campfire_api.contexts.identity.application.use_cases.google_stub_sign_in import ContinueWithGoogleStub
from campfire_api.contexts.identity.application.use_cases.register_user import RegisterUser
from campfire_api.contexts.identity.domain.value_objects import Email
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


async def setup_google(enabled=True):
    clock = FrozenClock()
    users, credentials = FakeUsers(), FakeCredentials()
    await RegisterUser(users, credentials, FakeHasher(), clock)("ada@campfire.test", "campfire123")
    sessions, refresh_tokens, issuer = FakeSessions(), FakeRefreshTokens(), FakeTokenIssuer(clock)
    auth = AuthenticateUser(users, credentials, sessions, refresh_tokens, FakeHasher(), issuer, clock, 900)
    return ContinueWithGoogleStub(users, auth, clock, enabled), users


async def test_google_stub_disabled_raises() -> None:
    use_case, _users = await setup_google(enabled=False)
    with pytest.raises(GoogleStubDisabled):
        await use_case("sign-in")


async def test_google_stub_sign_up_creates_fixture_once() -> None:
    use_case, users = await setup_google()
    first = await use_case("sign-up")
    second = await use_case("sign-up")
    assert first.access_token != second.access_token
    assert await users.get_by_email(Email("google.member@campfire.test"))


async def test_google_stub_sign_in_returns_seeded_user_session() -> None:
    use_case, _users = await setup_google()
    issued = await use_case("sign-in")
    assert issued.access_token.startswith("access-")
