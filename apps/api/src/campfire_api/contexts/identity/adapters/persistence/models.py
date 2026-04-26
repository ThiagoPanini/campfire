from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, Index, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import BYTEA, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


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
    first_login: Mapped[bool] = mapped_column(nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())


class CredentialsRow(Base):
    __tablename__ = "credentials"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    password_hash: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())


class PreferencesRow(Base):
    __tablename__ = "preferences"
    __table_args__ = (
        CheckConstraint(
            "jsonb_typeof(instruments) = 'array'", name="ck_preferences_instruments_array"
        ),
        CheckConstraint("jsonb_typeof(genres) = 'array'", name="ck_preferences_genres_array"),
        CheckConstraint("jsonb_typeof(goals) = 'array'", name="ck_preferences_goals_array"),
        CheckConstraint(
            "experience IS NULL OR experience IN ('beginner','learning','intermediate','advanced')",
            name="ck_preferences_experience",
        ),
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    instruments: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    genres: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    context: Mapped[str | None] = mapped_column(nullable=True)
    goals: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb")
    )
    experience: Mapped[str | None] = mapped_column(nullable=True)
    updated_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())


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
    access_token_expires_at: Mapped[datetime] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    revoked_at: Mapped[datetime | None] = mapped_column(nullable=True)
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
    issued_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(nullable=True)
    revoked_reason: Mapped[str | None] = mapped_column(nullable=True)
