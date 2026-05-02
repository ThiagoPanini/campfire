from __future__ import annotations

import re
from dataclasses import dataclass
from uuid import UUID, uuid4

try:
    from uuid_utils import uuid7
except ImportError:  # pragma: no cover
    uuid7 = None

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
COMMON_PASSWORDS = {
    "password",
    "password1",
    "password123",
    "1234567890",
    "qwerty123",
    "letmein123",
    "admin123",
    "campfire123",
}


def new_uuid() -> UUID:
    return uuid7() if uuid7 else uuid4()


@dataclass(frozen=True)
class Email:
    value: str

    def __post_init__(self) -> None:
        cleaned = self.value.strip()
        if cleaned != self.value:
            raise ValueError("invalid email")
        normalized = cleaned.lower()
        if not 3 <= len(normalized) <= 320 or not EMAIL_RE.match(normalized):
            raise ValueError("invalid email")
        object.__setattr__(self, "value", normalized)


@dataclass(frozen=True)
class HashedPassword:
    value: str


@dataclass(frozen=True)
class Password:
    value: str

    def __post_init__(self) -> None:
        if len(self.value) < 10:
            raise ValueError("password must be at least 10 characters")
        classes = sum(
            (
                any(c.islower() for c in self.value),
                any(c.isupper() for c in self.value),
                any(c.isdigit() for c in self.value),
                any(not c.isalnum() for c in self.value),
            )
        )
        if classes < 3:
            raise ValueError("password must use at least 3 character classes")
        if self.value.strip().lower() in COMMON_PASSWORDS:
            raise ValueError("password is too common")


@dataclass(frozen=True)
class DisplayName:
    value: str

    def __post_init__(self) -> None:
        cleaned = self.value.strip()
        if not 1 <= len(cleaned) <= 80:
            raise ValueError("invalid display name")
        object.__setattr__(self, "value", cleaned)


@dataclass(frozen=True)
class UserId:
    value: UUID

    @classmethod
    def new(cls) -> UserId:
        return cls(new_uuid())


@dataclass(frozen=True)
class SessionId:
    value: UUID

    @classmethod
    def new(cls) -> SessionId:
        return cls(new_uuid())


@dataclass(frozen=True)
class RefreshTokenId:
    value: UUID

    @classmethod
    def new(cls) -> RefreshTokenId:
        return cls(new_uuid())


@dataclass(frozen=True)
class SessionFamilyId:
    value: UUID

    @classmethod
    def new(cls) -> SessionFamilyId:
        return cls(new_uuid())


@dataclass(frozen=True)
class AccessTokenValue:
    value: str


@dataclass(frozen=True)
class RefreshTokenValue:
    value: str


@dataclass(frozen=True)
class AccentPresetId:
    value: str


@dataclass(frozen=True)
class Language:
    value: str


@dataclass(frozen=True)
class ConfirmationCode:
    value: str

    def __post_init__(self) -> None:
        if not re.fullmatch(r"[0-9]{6}", self.value):
            raise ValueError("invalid confirmation code")


@dataclass(frozen=True)
class ProviderSubject:
    value: str

    def __post_init__(self) -> None:
        if not 1 <= len(self.value) <= 255 or not self.value.isascii():
            raise ValueError("invalid provider subject")


@dataclass(frozen=True)
class OAuthState:
    value: str

    def __post_init__(self) -> None:
        if not self.value:
            raise ValueError("invalid oauth state")
