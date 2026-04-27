from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from campfire_api.contexts.identity.adapters.persistence.models import Base


class RepertoireEntryRow(Base):
    __tablename__ = "repertoire_entries"
    __table_args__ = (
        CheckConstraint(
            "length(song_external_id) BETWEEN 1 AND 128",
            name="ck_repertoire_entries_song_external_id_length",
        ),
        CheckConstraint(
            "length(song_title) BETWEEN 1 AND 256",
            name="ck_repertoire_entries_song_title_length",
        ),
        CheckConstraint(
            "length(song_artist) BETWEEN 1 AND 256",
            name="ck_repertoire_entries_song_artist_length",
        ),
        CheckConstraint(
            "song_album IS NULL OR length(song_album) BETWEEN 1 AND 256",
            name="ck_repertoire_entries_song_album_length",
        ),
        CheckConstraint(
            "song_release_year IS NULL OR song_release_year BETWEEN 1900 AND 2100",
            name="ck_repertoire_entries_song_release_year",
        ),
        CheckConstraint(
            "song_cover_art_url IS NULL OR length(song_cover_art_url) BETWEEN 1 AND 2048",
            name="ck_repertoire_entries_song_cover_art_url_length",
        ),
        CheckConstraint(
            "proficiency IN ('learning','practicing','ready')",
            name="ck_repertoire_entries_proficiency",
        ),
        UniqueConstraint(
            "user_id",
            "song_external_id",
            "instrument",
            name="ux_repertoire_entries_user_song_instrument",
        ),
        Index("ix_repertoire_entries_user_recent", "user_id", "created_at"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    song_external_id: Mapped[str] = mapped_column(nullable=False)
    song_title: Mapped[str] = mapped_column(nullable=False)
    song_artist: Mapped[str] = mapped_column(nullable=False)
    song_album: Mapped[str | None] = mapped_column(nullable=True)
    song_release_year: Mapped[int | None] = mapped_column(nullable=True)
    song_cover_art_url: Mapped[str | None] = mapped_column(nullable=True)
    instrument: Mapped[str] = mapped_column(nullable=False)
    proficiency: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
