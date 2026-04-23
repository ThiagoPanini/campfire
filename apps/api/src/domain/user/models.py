from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4


class LocalUserStatus(StrEnum):
    ACTIVE = "active"


@dataclass(frozen=True)
class VerifiedIdentityClaims:
    """Normalized identity claims trusted after API Gateway JWT validation."""

    provider_name: str
    provider_subject: str
    email: str
    email_verified: bool
    display_name: str


@dataclass(frozen=True)
class LocalUser:
    """Campfire-owned local user record."""

    user_id: str
    provider_name: str
    provider_subject: str
    email: str
    email_verified: bool
    display_name: str
    status: LocalUserStatus
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime

    @classmethod
    def bootstrap(cls, claims: VerifiedIdentityClaims, now: datetime | None = None) -> LocalUser:
        """Create the first local user record for a verified identity."""

        timestamp = now or datetime.now(UTC)
        return cls(
            user_id=f"user_{uuid4().hex}",
            provider_name=claims.provider_name,
            provider_subject=claims.provider_subject,
            email=claims.email,
            email_verified=claims.email_verified,
            display_name=claims.display_name,
            status=LocalUserStatus.ACTIVE,
            created_at=timestamp,
            updated_at=timestamp,
            last_login_at=timestamp,
        )

    def register_login(self, now: datetime | None = None) -> LocalUser:
        """Return a copy with refreshed login metadata."""

        timestamp = now or datetime.now(UTC)
        return LocalUser(
            user_id=self.user_id,
            provider_name=self.provider_name,
            provider_subject=self.provider_subject,
            email=self.email,
            email_verified=self.email_verified,
            display_name=self.display_name,
            status=self.status,
            created_at=self.created_at,
            updated_at=timestamp,
            last_login_at=timestamp,
        )
