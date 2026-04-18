"""Contract for persisting repertoire entries."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Protocol
from uuid import UUID

from campfire.domain.models.repertoire_entry import RepertoireEntry


class RepertoireRepository(Protocol):
    def add(self, entry: RepertoireEntry) -> None: ...

    def exists(self, user_id: UUID, song_id: UUID, instrument_name: str) -> bool: ...

    def list_for_user(self, user_id: UUID) -> list[RepertoireEntry]: ...

    def list_for_users(self, user_ids: Iterable[UUID]) -> list[RepertoireEntry]: ...
