import hmac
from hashlib import sha256

from campfire_api.contexts.identity.domain.value_objects import ConfirmationCode


class HmacConfirmationCodeHasher:
    def __init__(self, key: str) -> None:
        if not key:
            raise ValueError("EMAIL_CONFIRMATION_HMAC_KEY is required")
        self._key = key.encode()

    def hash(self, code: ConfirmationCode) -> bytes:
        return hmac.new(self._key, code.value.encode(), sha256).digest()

    def verify(self, code: ConfirmationCode, digest: bytes) -> bool:
        return hmac.compare_digest(self.hash(code), digest)
