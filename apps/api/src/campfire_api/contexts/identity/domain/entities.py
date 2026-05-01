from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from campfire_api.contexts.identity.domain.value_objects import (
    DisplayName,
    Email,
    HashedPassword,
    ProviderSubject,
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
    created_at: datetime
    updated_at: datetime
    email_confirmed_at: datetime | None = None


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
        return cls(user_id=user_id, password_hash=password_hash, created_at=now, updated_at=now)


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


@dataclass(frozen=True)
class GoogleIdentity:
    subject: ProviderSubject
    email: Email
    display_name: DisplayName
    nonce: str
    email_verified: bool


@dataclass
class ProviderLink:
    id: UserId
    user_id: UserId
    provider: str
    subject: ProviderSubject
    email_at_link: Email
    created_at: datetime
    updated_at: datetime


@dataclass
class EmailConfirmation:
    id: UserId
    user_id: UserId
    email: Email
    code_hash: bytes
    created_at: datetime
    expires_at: datetime
    attempt_count: int = 0
    resend_count: int = 0
    last_resent_at: datetime | None = None
    status: str = "pending"
    invalidated_reason: str | None = None

    def verify(self, now: datetime) -> None:
        self.status = "verified"
        self.updated(now)

    def expire(self) -> None:
        self.status = "expired"

    def invalidate(self, reason: str) -> None:
        self.status = "invalidated"
        self.invalidated_reason = reason

    def increment_attempts(self, max_attempts: int) -> None:
        self.attempt_count += 1
        if self.attempt_count >= max_attempts:
            self.invalidate("attempts_exceeded")

    def updated(self, now: datetime) -> None:
        if self.expires_at <= now and self.status == "pending":
            self.expire()


@dataclass
class OAuthFlowState:
    id: UserId
    state_token_hash: bytes
    pkce_verifier: str
    nonce_hash: bytes
    intent: str
    return_to: str | None
    created_at: datetime
    expires_at: datetime
    consumed_at: datetime | None = None
    consumed_reason: str | None = None

    @classmethod
    def issue(
        cls,
        *,
        state_token_hash: bytes,
        pkce_verifier: str,
        nonce_hash: bytes,
        intent: str,
        return_to: str | None,
        now: datetime,
        expires_at: datetime,
    ) -> OAuthFlowState:
        if intent not in {"sign-in", "sign-up"}:
            raise ValueError("invalid oauth intent")
        if not 43 <= len(pkce_verifier) <= 128:
            raise ValueError("invalid pkce verifier")
        return cls(
            id=UserId.new(),
            state_token_hash=state_token_hash,
            pkce_verifier=pkce_verifier,
            nonce_hash=nonce_hash,
            intent=intent,
            return_to=return_to,
            created_at=now,
            expires_at=expires_at,
        )
