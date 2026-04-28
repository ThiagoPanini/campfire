import pytest

from campfire_api.contexts.identity.application.errors import EmailAlreadyRegistered
from campfire_api.contexts.identity.application.use_cases.register_user import RegisterUser
from tests.unit.identity.fakes import (
    FakeCredentials,
    FakeHasher,
    FakePreferences,
    FakeUsers,
    FrozenClock,
)

pytestmark = pytest.mark.unit


async def test_register_user_happy_path() -> None:
    users, credentials, preferences, clock = (
        FakeUsers(),
        FakeCredentials(),
        FakePreferences(),
        FrozenClock(),
    )
    user = await RegisterUser(users, credentials, preferences, FakeHasher(), clock)(
        "NEW@Campfire.test", "campfire123"
    )
    assert user.email.value == "new@campfire.test"
    assert user.first_login is True
    assert await credentials.get_by_user_id(user.id)


async def test_register_user_duplicate_email() -> None:
    users, credentials, preferences, clock = (
        FakeUsers(),
        FakeCredentials(),
        FakePreferences(),
        FrozenClock(),
    )
    use_case = RegisterUser(users, credentials, preferences, FakeHasher(), clock)
    await use_case("ada@campfire.test", "campfire123")
    with pytest.raises(EmailAlreadyRegistered):
        await use_case("ADA@campfire.test", "campfire123")


async def test_register_user_short_password() -> None:
    with pytest.raises(ValueError):
        await RegisterUser(
            FakeUsers(), FakeCredentials(), FakePreferences(), FakeHasher(), FrozenClock()
        )("ada@campfire.test", "short")
