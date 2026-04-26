import pytest

from campfire_api.contexts.identity.application.errors import InvalidCredentials
from campfire_api.contexts.identity.application.use_cases.get_me import GetCurrentUser
from campfire_api.contexts.identity.application.use_cases.register_user import RegisterUser
from campfire_api.contexts.identity.domain.value_objects import UserId
from tests.unit.identity.fakes import (
    FakeCredentials,
    FakeHasher,
    FakePreferences,
    FakeUsers,
    FrozenClock,
)

pytestmark = pytest.mark.unit


async def test_get_me_returns_user_and_preferences() -> None:
    users, credentials, preferences, clock = (
        FakeUsers(),
        FakeCredentials(),
        FakePreferences(),
        FrozenClock(),
    )
    user = await RegisterUser(users, credentials, preferences, FakeHasher(), clock)(
        "ada@campfire.test", "campfire123"
    )
    current = await GetCurrentUser(users, preferences)(user.id)
    assert current.user.email.value == "ada@campfire.test"


async def test_get_me_missing_user_raises() -> None:
    with pytest.raises(InvalidCredentials):
        await GetCurrentUser(FakeUsers(), FakePreferences())(UserId.new())
