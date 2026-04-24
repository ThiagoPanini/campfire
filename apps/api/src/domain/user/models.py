from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4


class LocalUserStatus(StrEnum):
    ACTIVE = "active"


class OnboardingStatus(StrEnum):
    REQUIRED = "required"
    COMPLETED = "completed"
    DEFERRED = "deferred"


def normalize_email(email: str) -> str:
    """Return the canonical email value used for uniqueness checks."""

    return email.strip().lower()


@dataclass(frozen=True)
class VerifiedIdentityClaims:
    """Normalized identity claims trusted after API Gateway JWT validation."""

    provider_name: str
    provider_subject: str
    email: str
    email_verified: bool
    display_name: str

    @property
    def email_normalized(self) -> str:
        return normalize_email(self.email)


@dataclass(frozen=True)
class AuthenticationIdentityLink:
    """Campfire-owned link between a provider identity and local user."""

    user_id: str
    provider_name: str
    provider_subject: str
    email_normalized: str
    linked_at: datetime
    last_used_at: datetime


@dataclass(frozen=True)
class LocalUser:
    """Campfire-owned local user record."""

    user_id: str
    email: str
    email_normalized: str
    email_verified: bool
    display_name: str
    status: LocalUserStatus
    onboarding_status: OnboardingStatus
    onboarding_completed_at: datetime | None
    onboarding_deferred_at: datetime | None
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime

    @classmethod
    def bootstrap(cls, claims: VerifiedIdentityClaims, now: datetime | None = None) -> LocalUser:
        """Create the first local user record for a verified identity."""

        timestamp = now or datetime.now(UTC)
        return cls(
            user_id=f"user_{uuid4().hex}",
            email=claims.email,
            email_normalized=claims.email_normalized,
            email_verified=claims.email_verified,
            display_name=claims.display_name,
            status=LocalUserStatus.ACTIVE,
            onboarding_status=OnboardingStatus.REQUIRED,
            onboarding_completed_at=None,
            onboarding_deferred_at=None,
            created_at=timestamp,
            updated_at=timestamp,
            last_login_at=timestamp,
        )

    def register_login(self, now: datetime | None = None) -> LocalUser:
        """Return a copy with refreshed login metadata."""

        timestamp = now or datetime.now(UTC)
        return LocalUser(
            user_id=self.user_id,
            email=self.email,
            email_normalized=self.email_normalized,
            email_verified=self.email_verified,
            display_name=self.display_name,
            status=self.status,
            onboarding_status=self.onboarding_status,
            onboarding_completed_at=self.onboarding_completed_at,
            onboarding_deferred_at=self.onboarding_deferred_at,
            created_at=self.created_at,
            updated_at=timestamp,
            last_login_at=timestamp,
        )

    def complete_onboarding(self, now: datetime | None = None) -> LocalUser:
        timestamp = now or datetime.now(UTC)
        return LocalUser(
            user_id=self.user_id,
            email=self.email,
            email_normalized=self.email_normalized,
            email_verified=self.email_verified,
            display_name=self.display_name,
            status=self.status,
            onboarding_status=OnboardingStatus.COMPLETED,
            onboarding_completed_at=timestamp,
            onboarding_deferred_at=self.onboarding_deferred_at,
            created_at=self.created_at,
            updated_at=timestamp,
            last_login_at=self.last_login_at,
        )

    def defer_onboarding(self, now: datetime | None = None) -> LocalUser:
        timestamp = now or datetime.now(UTC)
        return LocalUser(
            user_id=self.user_id,
            email=self.email,
            email_normalized=self.email_normalized,
            email_verified=self.email_verified,
            display_name=self.display_name,
            status=self.status,
            onboarding_status=OnboardingStatus.DEFERRED,
            onboarding_completed_at=self.onboarding_completed_at,
            onboarding_deferred_at=timestamp,
            created_at=self.created_at,
            updated_at=timestamp,
            last_login_at=self.last_login_at,
        )
