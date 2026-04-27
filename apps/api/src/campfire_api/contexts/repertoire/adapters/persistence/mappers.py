from __future__ import annotations

from campfire_api.contexts.repertoire.adapters.persistence.models import RepertoireEntryRow
from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry


def row_to_entry(row: RepertoireEntryRow) -> RepertoireEntry:
    return RepertoireEntry(
        id=row.id,
        user_id=row.user_id,
        song_external_id=row.song_external_id,
        song_title=row.song_title,
        song_artist=row.song_artist,
        song_album=row.song_album,
        song_release_year=row.song_release_year,
        song_cover_art_url=row.song_cover_art_url,
        instrument=row.instrument,
        proficiency=row.proficiency,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def entry_to_row_kwargs(entry: RepertoireEntry) -> dict:
    return {
        "id": entry.id,
        "user_id": entry.user_id,
        "song_external_id": entry.song_external_id,
        "song_title": entry.song_title,
        "song_artist": entry.song_artist,
        "song_album": entry.song_album,
        "song_release_year": entry.song_release_year,
        "song_cover_art_url": entry.song_cover_art_url,
        "instrument": entry.instrument,
        "proficiency": entry.proficiency,
        "created_at": entry.created_at,
        "updated_at": entry.updated_at,
    }
