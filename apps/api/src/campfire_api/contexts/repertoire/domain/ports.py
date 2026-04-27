from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol
from uuid import UUID

from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry, SearchResult


class RepertoireEntryRepository(Protocol):
    async def get_by_id(self, entry_id: UUID) -> RepertoireEntry | None: ...
    async def get_by_user_song_instrument(
        self, user_id: UUID, song_external_id: str, instrument: str
    ) -> RepertoireEntry | None: ...
    async def list_by_user(self, user_id: UUID) -> list[RepertoireEntry]: ...
    async def add(self, entry: RepertoireEntry) -> None: ...
    async def update(self, entry: RepertoireEntry) -> None: ...
    async def delete(self, entry: RepertoireEntry) -> None: ...


class SongCatalogPort(Protocol):
    async def search(
        self, query: str, page: int
    ) -> tuple[list[SearchResult], bool]: ...


class SearchCachePort(Protocol):
    async def get(self, key: tuple[Any, ...]) -> list[SearchResult] | None: ...
    async def set(self, key: tuple[Any, ...], value: list[SearchResult]) -> None: ...


class SearchRateLimiter(Protocol):
    async def check(self, user_id: UUID) -> None: ...


class Clock(Protocol):
    def now(self) -> datetime: ...
