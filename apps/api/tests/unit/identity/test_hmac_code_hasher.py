import pytest

from campfire_api.contexts.identity.adapters.security.hmac_code_hasher import (
    HmacConfirmationCodeHasher,
)
from campfire_api.contexts.identity.domain.value_objects import ConfirmationCode

pytestmark = pytest.mark.unit


def test_hmac_confirmation_code_hasher_round_trip() -> None:
    hasher = HmacConfirmationCodeHasher("secret")
    digest = hasher.hash(ConfirmationCode("123456"))
    assert hasher.verify(ConfirmationCode("123456"), digest)
    assert not hasher.verify(ConfirmationCode("654321"), digest)
