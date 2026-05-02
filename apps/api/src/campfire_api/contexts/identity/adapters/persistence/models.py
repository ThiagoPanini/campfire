from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import BYTEA
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from campfire_api.shared.persistence.base import Base


class UserRow(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "email = lower(email) AND length(email) BETWEEN 3 AND 320",
            name="ck_users_email_normalized",
        ),
        CheckConstraint(
            "length(display_name) BETWEEN 1 AND 80", name="ck_users_display_name_length"
        ),
        UniqueConstraint("email", name="ux_users_email"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    email: Mapped[str] = mapped_column(nullable=False)
    display_name: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    email_confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class CredentialsRow(Base):
    __tablename__ = "credentials"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    password_hash: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class SessionRow(Base):
    __tablename__ = "sessions"
    __table_args__ = (
        CheckConstraint(
            "revoked_reason IS NULL OR revoked_reason IN "
            "('signed_out','refreshed','reuse_detected','expired')",
            name="ck_sessions_revoked_reason",
        ),
        UniqueConstraint("access_token_fingerprint", name="ux_sessions_access_token_fingerprint"),
        Index("ix_sessions_user_id", "user_id"),
        Index(
            "ix_sessions_family_id_active", "family_id", postgresql_where=text("revoked_at IS NULL")
        ),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    family_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    access_token_fingerprint: Mapped[bytes] = mapped_column(BYTEA, nullable=False)
    access_token_expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_reason: Mapped[str | None] = mapped_column(nullable=True)


class RefreshTokenRow(Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = (
        CheckConstraint(
            "revoked_reason IS NULL OR revoked_reason IN "
            "('signed_out','refreshed','reuse_detected','expired')",
            name="ck_refresh_tokens_revoked_reason",
        ),
        UniqueConstraint("token_fingerprint", name="ux_refresh_tokens_fingerprint"),
        Index(
            "ix_refresh_tokens_family_id_active",
            "family_id",
            postgresql_where=text("revoked_at IS NULL"),
        ),
        Index("ix_refresh_tokens_user_id", "user_id"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    session_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )
    family_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_fingerprint: Mapped[bytes] = mapped_column(BYTEA, nullable=False)
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_reason: Mapped[str | None] = mapped_column(nullable=True)


class ProviderLinkRow(Base):
    __tablename__ = "provider_links"
    __table_args__ = (
        CheckConstraint("provider IN ('google')", name="ck_provider_links_provider"),
        CheckConstraint("length(subject) BETWEEN 1 AND 255", name="ck_provider_links_subject"),
        CheckConstraint("email_at_link = lower(email_at_link)", name="ck_provider_links_email_lc"),
        Index("ux_provider_links_provider_subject", "provider", "subject", unique=True),
        Index("ux_provider_links_user_provider", "user_id", "provider", unique=True),
        Index("ix_provider_links_user_id", "user_id"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    provider: Mapped[str] = mapped_column(nullable=False)
    subject: Mapped[str] = mapped_column(nullable=False)
    email_at_link: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class EmailConfirmationRow(Base):
    __tablename__ = "email_confirmations"
    __table_args__ = (
        CheckConstraint("email = lower(email)", name="ck_email_confirmations_email_lc"),
        CheckConstraint("attempt_count >= 0", name="ck_email_confirmations_attempt_count"),
        CheckConstraint("resend_count >= 0", name="ck_email_confirmations_resend_count"),
        CheckConstraint(
            "status IN ('pending','verified','expired','invalidated')",
            name="ck_email_confirmations_status",
        ),
        CheckConstraint(
            "invalidated_reason IS NULL OR invalidated_reason IN "
            "('attempts_exceeded','resent','upgraded_by_google','admin')",
            name="ck_email_confirmations_invalidated_reason",
        ),
        Index("ix_email_confirmations_user_id", "user_id"),
        Index(
            "ux_email_confirmations_user_pending",
            "user_id",
            unique=True,
            postgresql_where=text("status = 'pending'"),
        ),
        Index("ix_email_confirmations_expires_at", "expires_at"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str] = mapped_column(nullable=False)
    code_hash: Mapped[bytes] = mapped_column(BYTEA, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attempt_count: Mapped[int] = mapped_column(nullable=False, server_default=text("0"))
    resend_count: Mapped[int] = mapped_column(nullable=False, server_default=text("0"))
    last_resent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(nullable=False, server_default=text("'pending'"))
    invalidated_reason: Mapped[str | None] = mapped_column(nullable=True)


class OAuthFlowStateRow(Base):
    __tablename__ = "oauth_flow_states"
    __table_args__ = (
        CheckConstraint(
            "length(pkce_verifier) BETWEEN 43 AND 128",
            name="ck_oauth_flow_states_pkce_verifier",
        ),
        CheckConstraint("intent IN ('sign-in','sign-up')", name="ck_oauth_flow_states_intent"),
        CheckConstraint(
            "consumed_reason IS NULL OR consumed_reason IN "
            "('completed','invalid','expired','user_cancelled','google_error')",
            name="ck_oauth_flow_states_consumed_reason",
        ),
        Index("ux_oauth_flow_states_state_token_hash", "state_token_hash", unique=True),
        Index("ix_oauth_flow_states_expires_at", "expires_at"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    state_token_hash: Mapped[bytes] = mapped_column(BYTEA, nullable=False)
    pkce_verifier: Mapped[str] = mapped_column(nullable=False)
    nonce_hash: Mapped[bytes] = mapped_column(BYTEA, nullable=False)
    intent: Mapped[str] = mapped_column(nullable=False)
    return_to: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    consumed_reason: Mapped[str | None] = mapped_column(nullable=True)
