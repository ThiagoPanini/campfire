"""identity oauth and confirmation

Revision ID: 0003_identity_oauth_confirm
Revises: 0003_repertoire_initial
Create Date: 2026-04-30
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0003_identity_oauth_confirm"
down_revision: str | None = "0003_repertoire_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("email_confirmed_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.execute("UPDATE users SET email_confirmed_at = created_at WHERE email_confirmed_at IS NULL")

    op.create_table(
        "provider_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("subject", sa.Text(), nullable=False),
        sa.Column("email_at_link", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.CheckConstraint("provider IN ('google')", name="ck_provider_links_provider"),
        sa.CheckConstraint("length(subject) BETWEEN 1 AND 255", name="ck_provider_links_subject"),
        sa.CheckConstraint(
            "email_at_link = lower(email_at_link)", name="ck_provider_links_email_lc"
        ),
    )
    op.create_index(
        "ux_provider_links_provider_subject", "provider_links", ["provider", "subject"], unique=True
    )
    op.create_index(
        "ux_provider_links_user_provider", "provider_links", ["user_id", "provider"], unique=True
    )
    op.create_index("ix_provider_links_user_id", "provider_links", ["user_id"])

    op.create_table(
        "email_confirmations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("code_hash", postgresql.BYTEA(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempt_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("resend_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("last_resent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.Text(), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("invalidated_reason", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.CheckConstraint("email = lower(email)", name="ck_email_confirmations_email_lc"),
        sa.CheckConstraint("attempt_count >= 0", name="ck_email_confirmations_attempt_count"),
        sa.CheckConstraint("resend_count >= 0", name="ck_email_confirmations_resend_count"),
        sa.CheckConstraint(
            "status IN ('pending','verified','expired','invalidated')",
            name="ck_email_confirmations_status",
        ),
        sa.CheckConstraint(
            "invalidated_reason IS NULL OR invalidated_reason IN "
            "('attempts_exceeded','resent','upgraded_by_google','admin')",
            name="ck_email_confirmations_invalidated_reason",
        ),
    )
    op.create_index("ix_email_confirmations_user_id", "email_confirmations", ["user_id"])
    op.create_index(
        "ux_email_confirmations_user_pending",
        "email_confirmations",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )
    op.create_index("ix_email_confirmations_expires_at", "email_confirmations", ["expires_at"])

    op.create_table(
        "oauth_flow_states",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("state_token_hash", postgresql.BYTEA(), nullable=False),
        sa.Column("pkce_verifier", sa.Text(), nullable=False),
        sa.Column("nonce_hash", postgresql.BYTEA(), nullable=False),
        sa.Column("intent", sa.Text(), nullable=False),
        sa.Column("return_to", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("consumed_reason", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint(
            "length(pkce_verifier) BETWEEN 43 AND 128",
            name="ck_oauth_flow_states_pkce_verifier",
        ),
        sa.CheckConstraint("intent IN ('sign-in','sign-up')", name="ck_oauth_flow_states_intent"),
        sa.CheckConstraint(
            "consumed_reason IS NULL OR consumed_reason IN "
            "('completed','invalid','expired','user_cancelled','google_error')",
            name="ck_oauth_flow_states_consumed_reason",
        ),
    )
    op.create_index(
        "ux_oauth_flow_states_state_token_hash",
        "oauth_flow_states",
        ["state_token_hash"],
        unique=True,
    )
    op.create_index("ix_oauth_flow_states_expires_at", "oauth_flow_states", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_oauth_flow_states_expires_at", table_name="oauth_flow_states")
    op.drop_index("ux_oauth_flow_states_state_token_hash", table_name="oauth_flow_states")
    op.drop_table("oauth_flow_states")
    op.drop_index("ix_email_confirmations_expires_at", table_name="email_confirmations")
    op.drop_index("ux_email_confirmations_user_pending", table_name="email_confirmations")
    op.drop_index("ix_email_confirmations_user_id", table_name="email_confirmations")
    op.drop_table("email_confirmations")
    op.drop_index("ix_provider_links_user_id", table_name="provider_links")
    op.drop_index("ux_provider_links_user_provider", table_name="provider_links")
    op.drop_index("ux_provider_links_provider_subject", table_name="provider_links")
    op.drop_table("provider_links")
    op.drop_column("users", "email_confirmed_at")
