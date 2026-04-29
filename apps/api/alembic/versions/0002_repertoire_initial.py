"""repertoire initial

Revision ID: 0002_repertoire_initial
Revises: 0001_identity_initial
Create Date: 2026-04-27
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002_repertoire_initial"
down_revision: str | None = "0001_identity_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "repertoire_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("song_external_id", sa.Text(), nullable=False),
        sa.Column("song_title", sa.Text(), nullable=False),
        sa.Column("song_artist", sa.Text(), nullable=False),
        sa.Column("song_album", sa.Text(), nullable=True),
        sa.Column("song_release_year", sa.Integer(), nullable=True),
        sa.Column("song_cover_art_url", sa.Text(), nullable=True),
        sa.Column("instrument", sa.Text(), nullable=False),
        sa.Column("proficiency", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_repertoire_entries_user_id", ondelete="CASCADE"
        ),
        sa.CheckConstraint(
            "length(song_external_id) BETWEEN 1 AND 128",
            name="ck_repertoire_entries_song_external_id_length",
        ),
        sa.CheckConstraint(
            "length(song_title) BETWEEN 1 AND 256",
            name="ck_repertoire_entries_song_title_length",
        ),
        sa.CheckConstraint(
            "length(song_artist) BETWEEN 1 AND 256",
            name="ck_repertoire_entries_song_artist_length",
        ),
        sa.CheckConstraint(
            "song_album IS NULL OR length(song_album) BETWEEN 1 AND 256",
            name="ck_repertoire_entries_song_album_length",
        ),
        sa.CheckConstraint(
            "song_release_year IS NULL OR song_release_year BETWEEN 1900 AND 2100",
            name="ck_repertoire_entries_song_release_year",
        ),
        sa.CheckConstraint(
            "song_cover_art_url IS NULL OR length(song_cover_art_url) BETWEEN 1 AND 2048",
            name="ck_repertoire_entries_song_cover_art_url_length",
        ),
        sa.CheckConstraint(
            "proficiency IN ('learning','practicing','ready')",
            name="ck_repertoire_entries_proficiency",
        ),
    )
    op.create_index(
        "ux_repertoire_entries_user_song_instrument",
        "repertoire_entries",
        ["user_id", "song_external_id", "instrument"],
        unique=True,
    )
    op.create_index(
        "ix_repertoire_entries_user_recent",
        "repertoire_entries",
        ["user_id", sa.text("created_at DESC")],
    )


def downgrade() -> None:
    op.drop_index("ix_repertoire_entries_user_recent", table_name="repertoire_entries")
    op.drop_index("ux_repertoire_entries_user_song_instrument", table_name="repertoire_entries")
    op.drop_table("repertoire_entries")
