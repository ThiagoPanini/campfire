from __future__ import annotations

from uuid import UUID

from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry
from campfire_api.contexts.repertoire.domain.ports import RepertoireEntryRepository


class ListMyEntries:
    def __init__(self, repository: RepertoireEntryRepository) -> None:
        self._repository = repository

    async def execute(self, user_id: UUID) -> list[RepertoireEntry]:
        return await self._repository.list_by_user(user_id)
