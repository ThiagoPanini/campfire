"""Use case: search songs for a typeahead UI."""

from __future__ import annotations

from dataclasses import dataclass

from campfire.application.dto import SongSearchItemView
from campfire.domain.repositories import SongSearchProvider


@dataclass(frozen=True, slots=True)
class SearchSongs:
    provider: SongSearchProvider

    def execute(self, query: str, limit: int = 20) -> list[SongSearchItemView]:
        if not query or not query.strip():
            return []
        hits = self.provider.search(query=query, limit=limit)
        return [
            SongSearchItemView(
                title=h.title,
                artist=h.artist,
                source=h.source,
                external_id=h.external_id,
            )
            for h in hits
        ]
