"""remove identity preferences

Revision ID: 0004_remove_identity_preferences
Revises: 0003_repertoire_initial
Create Date: 2026-04-28
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004_remove_identity_preferences"
down_revision: str | None = "0003_repertoire_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_table("preferences")
    op.drop_column("users", "first_login")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column("first_login", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.create_table(
        "preferences",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("instruments", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("genres", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("context", sa.Text(), nullable=True),
        sa.Column("goals", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("experience", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("jsonb_typeof(instruments) = 'array'", name="ck_preferences_instruments_array"),
        sa.CheckConstraint("jsonb_typeof(genres) = 'array'", name="ck_preferences_genres_array"),
        sa.CheckConstraint("jsonb_typeof(goals) = 'array'", name="ck_preferences_goals_array"),
        sa.CheckConstraint(
            "experience IS NULL OR experience IN ('beginner','learning','intermediate','advanced')",
            name="ck_preferences_experience",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_preferences_user_id_users", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", name="preferences_pkey"),
    )
