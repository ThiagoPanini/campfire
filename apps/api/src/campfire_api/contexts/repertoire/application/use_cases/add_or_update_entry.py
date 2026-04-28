from __future__ import annotations

from uuid import UUID

from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry, SearchResult
from campfire_api.contexts.repertoire.domain.errors import InstrumentUnknown, ProficiencyUnknown
from campfire_api.contexts.repertoire.domain.ports import Clock, RepertoireEntryRepository
from campfire_api.contexts.repertoire.domain.value_objects import (
    PROFICIENCY_LEVELS,
    RepertoireEntryId,
)
from campfire_api.shared.catalogs import INSTRUMENTS


class AddOrUpdateEntry:
    def __init__(self, repository: RepertoireEntryRepository, clock: Clock) -> None:
        self._repository = repository
        self._clock = clock

    async def execute(
        self,
        user_id: UUID,
        song_external_id: str,
        song_title: str,
        song_artist: str,
        song_album: str | None,
        song_release_year: int | None,
        song_cover_art_url: str | None,
        instrument: str,
        proficiency: str,
    ) -> tuple[RepertoireEntry, str]:
        if instrument not in INSTRUMENTS:
            raise InstrumentUnknown(instrument)
        if proficiency not in PROFICIENCY_LEVELS:
            raise ProficiencyUnknown(proficiency)

        now = self._clock.now()
        existing = await self._repository.get_by_user_song_instrument(
            user_id, song_external_id, instrument
        )

        if existing is None:
            entry = RepertoireEntry(
                id=RepertoireEntryId.new().value,
                user_id=user_id,
                song_external_id=song_external_id,
                song_title=song_title,
                song_artist=song_artist,
                song_album=song_album,
                song_release_year=song_release_year,
                song_cover_art_url=song_cover_art_url,
                instrument=instrument,
                proficiency=proficiency,
                created_at=now,
                updated_at=now,
            )
            await self._repository.add(entry)
            return entry, "created"
        else:
            existing.proficiency = proficiency
            existing.updated_at = now
            await self._repository.update(existing)
            return existing, "updated"

    @classmethod
    def from_search_result(
        cls,
        result: SearchResult,
        *,
        user_id: UUID,
        instrument: str,
        proficiency: str,
        repository: RepertoireEntryRepository,
        clock: Clock,
    ) -> AddOrUpdateEntry:
        return cls(repository, clock)
