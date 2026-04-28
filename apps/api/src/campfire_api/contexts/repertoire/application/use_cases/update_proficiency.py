from __future__ import annotations

from uuid import UUID

from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry
from campfire_api.contexts.repertoire.domain.errors import EntryNotFound, ProficiencyUnknown
from campfire_api.contexts.repertoire.domain.ports import Clock, RepertoireEntryRepository
from campfire_api.contexts.repertoire.domain.value_objects import PROFICIENCY_LEVELS


class UpdateProficiency:
    def __init__(self, repository: RepertoireEntryRepository, clock: Clock) -> None:
        self._repository = repository
        self._clock = clock

    async def execute(
        self, user_id: UUID, entry_id: UUID, proficiency: str
    ) -> RepertoireEntry:
        if proficiency not in PROFICIENCY_LEVELS:
            raise ProficiencyUnknown(proficiency)

        entry = await self._repository.get_by_id(entry_id)
        if entry is None or entry.user_id != user_id:
            raise EntryNotFound(f"entry {entry_id} not found")

        entry.proficiency = proficiency
        entry.updated_at = self._clock.now()
        await self._repository.update(entry)
        return entry
