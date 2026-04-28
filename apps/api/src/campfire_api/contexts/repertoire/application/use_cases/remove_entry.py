from __future__ import annotations

from uuid import UUID

from campfire_api.contexts.repertoire.domain.errors import EntryNotFound
from campfire_api.contexts.repertoire.domain.ports import RepertoireEntryRepository


class RemoveEntry:
    def __init__(self, repository: RepertoireEntryRepository) -> None:
        self._repository = repository

    async def execute(self, user_id: UUID, entry_id: UUID) -> None:
        entry = await self._repository.get_by_id(entry_id)
        if entry is None or entry.user_id != user_id:
            raise EntryNotFound(f"entry {entry_id} not found")
        await self._repository.delete(entry)
