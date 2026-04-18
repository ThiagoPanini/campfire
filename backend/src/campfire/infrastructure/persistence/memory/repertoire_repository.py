from __future__ import annotations

from collections.abc import Iterable
from uuid import UUID

from campfire.domain.models.repertoire_entry import RepertoireEntry


class InMemoryRepertoireRepository:
    def __init__(self) -> None:
        self._entries: list[RepertoireEntry] = []

    def add(self, entry: RepertoireEntry) -> None:
        self._entries.append(entry)

    def exists(self, user_id: UUID, song_id: UUID, instrument_name: str) -> bool:
        return any(
            e.user_id == user_id and e.song_id == song_id and e.instrument.name == instrument_name
            for e in self._entries
        )

    def list_for_user(self, user_id: UUID) -> list[RepertoireEntry]:
        return [e for e in self._entries if e.user_id == user_id]

    def list_for_users(self, user_ids: Iterable[UUID]) -> list[RepertoireEntry]:
        wanted = set(user_ids)
        return [e for e in self._entries if e.user_id in wanted]
