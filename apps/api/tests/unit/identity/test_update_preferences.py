import pytest

from campfire_api.contexts.identity.application.errors import UnknownCatalogId
from campfire_api.contexts.identity.application.use_cases.register_user import RegisterUser
from campfire_api.contexts.identity.application.use_cases.update_preferences import (
    UpdatePreferences,
)
from tests.unit.identity.fakes import (
    FakeCredentials,
    FakeHasher,
    FakePreferences,
    FakeUsers,
    FrozenClock,
)

pytestmark = pytest.mark.unit


async def setup_user():
    users, credentials, preferences, clock = (
        FakeUsers(),
        FakeCredentials(),
        FakePreferences(),
        FrozenClock(),
    )
    user = await RegisterUser(users, credentials, preferences, FakeHasher(), clock)(
        "ada@campfire.test", "campfire123"
    )
    return users, preferences, clock, user


async def test_update_preferences_happy_path_flips_first_login() -> None:
    users, preferences, clock, user = await setup_user()
    profile = await UpdatePreferences(users, preferences, clock)(
        user.id, ["Guitar"], ["Rock"], "friends", ["Track my full repertoire"], "intermediate"
    )
    assert profile.instruments == ["Guitar"]
    assert (await users.get_by_id(user.id)).first_login is False


async def test_update_preferences_unknown_id_rejected() -> None:
    users, preferences, clock, user = await setup_user()
    with pytest.raises(UnknownCatalogId):
        await UpdatePreferences(users, preferences, clock)(user.id, ["Unknown"], [], None, [], None)


async def test_update_preferences_nullable_shapes_accepted() -> None:
    users, preferences, clock, user = await setup_user()
    profile = await UpdatePreferences(users, preferences, clock)(user.id, [], [], None, [], None)
    assert profile.context is None
