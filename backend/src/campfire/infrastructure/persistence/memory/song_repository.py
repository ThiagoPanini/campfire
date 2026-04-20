from __future__ import annotations

from uuid import UUID

from campfire.domain.models.song import Song


class InMemorySongRepository:
    def __init__(self) -> None:
        self._by_id: dict[UUID, Song] = {}

    def get(self, song_id: UUID) -> Song | None:
        return self._by_id.get(song_id)

    def find_by_title_and_artist(self, title: str, artist: str) -> Song | None:
        t, a = title.strip().lower(), artist.strip().lower()
        return next(
            (s for s in self._by_id.values() if s.title.lower() == t and s.artist.lower() == a),
            None,
        )

    def list_all(self) -> list[Song]:
        return list(self._by_id.values())

    def add(self, song: Song) -> None:
        self._by_id[song.id] = song
