import pytest

from campfire_api.contexts.identity.domain.value_objects import Email, Password

pytestmark = pytest.mark.unit


@pytest.mark.parametrize("value", ["ada@campfire.test", "ADA@Campfire.test"])
def test_email_accepts_valid_values(value: str) -> None:
    assert Email(value).value == value.lower()


@pytest.mark.parametrize("value", [" ada@campfire.test", "ada", "a@b", "ada campfire.test"])
def test_email_rejects_invalid_values(value: str) -> None:
    with pytest.raises(ValueError):
        Email(value)


@pytest.mark.parametrize("value", ["Campfire123!", "Longer-Pass-1", "MUSIC-room-99"])
def test_password_accepts_strong_values(value: str) -> None:
    assert Password(value).value == value


@pytest.mark.parametrize("value", ["short", "longbutlower", "password123", "1234567890"])
def test_password_rejects_weak_values(value: str) -> None:
    with pytest.raises(ValueError):
        Password(value)
