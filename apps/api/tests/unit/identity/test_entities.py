import pytest

from campfire_api.contexts.identity.domain.entities import display_name_from_email
from campfire_api.contexts.identity.domain.value_objects import Email, Password

pytestmark = pytest.mark.unit


def test_email_normalization_and_format() -> None:
    assert Email("ADA@Campfire.TEST").value == "ada@campfire.test"
    with pytest.raises(ValueError):
        Email("nope")
    with pytest.raises(ValueError):
        Email(" ada@campfire.test ")


def test_password_length_floor() -> None:
    with pytest.raises(ValueError):
        Password("short")


def test_display_name_from_email() -> None:
    assert display_name_from_email(Email("ada-lovelace@campfire.test")).value == "Ada Lovelace"
