import pytest

from campfire_api.contexts.identity.application.errors import EmailAlreadyRegistered
from campfire_api.contexts.identity.application.use_cases.register_user import RegisterUser
from tests.unit.identity.fakes import FakeCredentials, FakeHasher, FakeUsers, FrozenClock

pytestmark = pytest.mark.unit


async def test_register_user_happy_path() -> None:
    users, credentials, clock = (FakeUsers(), FakeCredentials(), FrozenClock())
    user = await RegisterUser(users, credentials, FakeHasher(), clock)(
        "NEW@Campfire.test", "campfire123"
    )
    assert user.email.value == "new@campfire.test"
    assert await credentials.get_by_user_id(user.id)


async def test_register_user_duplicate_email() -> None:
    users, credentials, clock = (FakeUsers(), FakeCredentials(), FrozenClock())
    use_case = RegisterUser(users, credentials, FakeHasher(), clock)
    await use_case("ada@campfire.test", "campfire123")
    with pytest.raises(EmailAlreadyRegistered):
        await use_case("ADA@campfire.test", "campfire123")


async def test_register_user_short_password() -> None:
    with pytest.raises(ValueError):
        await RegisterUser(FakeUsers(), FakeCredentials(), FakeHasher(), FrozenClock())(
            "ada@campfire.test", "short"
        )
