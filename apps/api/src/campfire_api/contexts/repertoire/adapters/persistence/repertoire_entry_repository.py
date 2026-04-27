from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.repertoire.adapters.persistence.mappers import (
    entry_to_row_kwargs,
    row_to_entry,
)
from campfire_api.contexts.repertoire.adapters.persistence.models import RepertoireEntryRow
from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry


class SqlAlchemyRepertoireEntryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, entry_id: UUID) -> RepertoireEntry | None:
        row = await self._session.get(RepertoireEntryRow, entry_id)
        return row_to_entry(row) if row else None

    async def get_by_user_song_instrument(
        self, user_id: UUID, song_external_id: str, instrument: str
    ) -> RepertoireEntry | None:
        result = await self._session.execute(
            select(RepertoireEntryRow).where(
                RepertoireEntryRow.user_id == user_id,
                RepertoireEntryRow.song_external_id == song_external_id,
                RepertoireEntryRow.instrument == instrument,
            )
        )
        row = result.scalar_one_or_none()
        return row_to_entry(row) if row else None

    async def list_by_user(self, user_id: UUID) -> list[RepertoireEntry]:
        result = await self._session.execute(
            select(RepertoireEntryRow)
            .where(RepertoireEntryRow.user_id == user_id)
            .order_by(RepertoireEntryRow.created_at.desc())
        )
        return [row_to_entry(row) for row in result.scalars().all()]

    async def add(self, entry: RepertoireEntry) -> None:
        row = RepertoireEntryRow(**entry_to_row_kwargs(entry))
        self._session.add(row)

    async def update(self, entry: RepertoireEntry) -> None:
        row = await self._session.get(RepertoireEntryRow, entry.id)
        if row is None:
            return
        for key, value in entry_to_row_kwargs(entry).items():
            setattr(row, key, value)

    async def delete(self, entry: RepertoireEntry) -> None:
        await self._session.execute(
            delete(RepertoireEntryRow).where(RepertoireEntryRow.id == entry.id)
        )
