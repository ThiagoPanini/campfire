"""Contract for persisting and retrieving songs."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from campfire.domain.models.song import Song


class SongRepository(Protocol):
    def get(self, song_id: UUID) -> Song | None: ...

    def find_by_title_and_artist(self, title: str, artist: str) -> Song | None: ...

    def list_all(self) -> list[Song]: ...

    def add(self, song: Song) -> None: ...
