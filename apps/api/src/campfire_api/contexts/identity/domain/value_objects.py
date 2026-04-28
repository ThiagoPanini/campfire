from __future__ import annotations

import re
from dataclasses import dataclass
from uuid import UUID, uuid4

try:
    from uuid_utils import uuid7
except ImportError:  # pragma: no cover
    uuid7 = None

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def new_uuid() -> UUID:
    return uuid7() if uuid7 else uuid4()


@dataclass(frozen=True)
class Email:
    value: str

    def __post_init__(self) -> None:
        normalized = self.value.strip().lower()
        if not 3 <= len(normalized) <= 320 or not EMAIL_RE.match(normalized):
            raise ValueError("invalid email")
        object.__setattr__(self, "value", normalized)


@dataclass(frozen=True)
class HashedPassword:
    value: str


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
