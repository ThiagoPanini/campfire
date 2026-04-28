from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from campfire_api.contexts.identity.domain import catalogs
from campfire_api.contexts.identity.domain.value_objects import (
    DisplayName,
    Email,
    HashedPassword,
    RefreshTokenId,
    SessionFamilyId,
    SessionId,
    UserId,
)


def display_name_from_email(email: Email) -> DisplayName:
    local = email.value.split("@", 1)[0] or "Member"
    pieces = local.replace(".", " ").replace("_", " ").replace("-", " ").split()
    return DisplayName(" ".join(piece.capitalize() for piece in pieces) or "Member")


@dataclass
class User:
    id: UserId
    email: Email
    display_name: DisplayName
    first_login: bool
    created_at: datetime
    updated_at: datetime


@dataclass
class Credentials:
    user_id: UserId
    password_hash: HashedPassword
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_plaintext(
        cls, user_id: UserId, plaintext: str, password_hash: HashedPassword, now: datetime
    ) -> Credentials:
        if len(plaintext) < 8:
            raise ValueError("password must be at least 8 characters")
        return cls(user_id=user_id, password_hash=password_hash, created_at=now, updated_at=now)


@dataclass
class PreferencesProfile:
    user_id: UserId
    instruments: list[str] = field(default_factory=list)
    genres: list[str] = field(default_factory=list)
    context: str | None = None
    goals: list[str] = field(default_factory=list)
    experience: str | None = None
    updated_at: datetime | None = None

    def validate_catalogs(self) -> None:
        unknown = (
            set(self.instruments) - catalogs.INSTRUMENTS
            or set(self.genres) - catalogs.GENRES
            or ({self.context} - catalogs.CONTEXTS if self.context else set())
            or set(self.goals) - catalogs.GOALS
            or ({self.experience} - catalogs.EXPERIENCE if self.experience else set())
        )
        if unknown:
            raise ValueError(next(iter(unknown)))


@dataclass
class Session:
    id: SessionId
    user_id: UserId
    family_id: SessionFamilyId
    access_token_fingerprint: bytes
    access_token_expires_at: datetime
    created_at: datetime
    last_seen_at: datetime
    revoked_at: datetime | None = None
    revoked_reason: str | None = None

    @property
    def active(self) -> bool:
        return self.revoked_at is None


@dataclass
class RefreshToken:
    id: RefreshTokenId
    session_id: SessionId
    family_id: SessionFamilyId
    user_id: UserId
    token_fingerprint: bytes
    issued_at: datetime
    expires_at: datetime
    consumed_at: datetime | None = None
    revoked_at: datetime | None = None
    revoked_reason: str | None = None

    @property
    def active(self) -> bool:
        return self.revoked_at is None and self.consumed_at is None
