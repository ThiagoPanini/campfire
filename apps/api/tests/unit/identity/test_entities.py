import pytest

from campfire_api.contexts.identity.domain.entities import (
    Credentials,
    PreferencesProfile,
    display_name_from_email,
)
from campfire_api.contexts.identity.domain.value_objects import Email, HashedPassword, UserId
from tests.unit.identity.fakes import FrozenClock

pytestmark = pytest.mark.unit


def test_email_normalization_and_format() -> None:
    assert Email(" ADA@Campfire.TEST ").value == "ada@campfire.test"
    with pytest.raises(ValueError):
        Email("nope")


def test_password_length_floor() -> None:
    with pytest.raises(ValueError):
        Credentials.from_plaintext(
            UserId.new(), "short", HashedPassword("hash"), FrozenClock().now()
        )


def test_preferences_catalog_membership() -> None:
    profile = PreferencesProfile(
        UserId.new(), instruments=["Guitar"], genres=["Rock"], context="friends"
    )
    profile.validate_catalogs()
    bad = PreferencesProfile(UserId.new(), instruments=["Theremin"])
    with pytest.raises(ValueError):
        bad.validate_catalogs()


def test_display_name_from_email() -> None:
    assert display_name_from_email(Email("ada-lovelace@campfire.test")).value == "Ada Lovelace"
