from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError


class Argon2PasswordHasher:
    def __init__(self) -> None:
        self._hasher = PasswordHasher(time_cost=2, memory_cost=19_456, parallelism=1)

    async def hash(self, plaintext: str) -> str:
        return self._hasher.hash(plaintext)

    async def verify(self, plaintext: str, password_hash: str) -> bool:
        try:
            return self._hasher.verify(password_hash, plaintext)
        except (VerifyMismatchError, VerificationError):
            return False
