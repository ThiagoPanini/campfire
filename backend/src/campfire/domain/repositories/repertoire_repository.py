"""Contract for persisting repertoire entries."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from campfire.domain.models.repertoire_entry import RepertoireEntry


class RepertoireRepository(Protocol):
    def add(self, entry: RepertoireEntry) -> None: ...

    def exists(self, user_id: UUID, song_id: UUID, instrument_name: str) -> bool: ...

    def list_for_user(self, user_id: UUID) -> list[RepertoireEntry]: ...
