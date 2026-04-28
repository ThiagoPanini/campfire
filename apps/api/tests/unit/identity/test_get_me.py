import pytest

from campfire_api.contexts.identity.application.errors import InvalidCredentials
from campfire_api.contexts.identity.application.use_cases.get_me import GetCurrentUser
from campfire_api.contexts.identity.application.use_cases.register_user import RegisterUser
from campfire_api.contexts.identity.domain.value_objects import UserId
from tests.unit.identity.fakes import FakeCredentials, FakeHasher, FakeUsers, FrozenClock

pytestmark = pytest.mark.unit


async def test_get_me_returns_user() -> None:
    users, credentials, clock = (FakeUsers(), FakeCredentials(), FrozenClock())
    user = await RegisterUser(users, credentials, FakeHasher(), clock)("ada@campfire.test", "campfire123")
    current = await GetCurrentUser(users)(user.id)
    assert current.email.value == "ada@campfire.test"


async def test_get_me_missing_user_raises() -> None:
    with pytest.raises(InvalidCredentials):
        await GetCurrentUser(FakeUsers())(UserId.new())
