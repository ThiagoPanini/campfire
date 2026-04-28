from __future__ import annotations

from campfire_api.contexts.repertoire.domain.entities import SearchResult
from campfire_api.contexts.repertoire.domain.errors import (
    SongCatalogRateLimited,
    SongCatalogUnavailable,
)

SAMPLE_SEARCH_RESULTS: list[SearchResult] = [
    SearchResult(
        external_id="1109731",
        title="Wonderwall",
        artist="Oasis",
        album="(What's the Story) Morning Glory?",
        release_year=1995,
        cover_art_url="https://cdn.deezer.com/images/cover/wonderwall.jpg",
    ),
    SearchResult(
        external_id="673021",
        title="Hey Jude",
        artist="The Beatles",
        album="Hey Jude",
        release_year=1968,
        cover_art_url="https://cdn.deezer.com/images/cover/heyjude.jpg",
    ),
    SearchResult(
        external_id="1234567",
        title="Trem Bala",
        artist="Ana Vilela",
        album="Trem Bala",
        release_year=2017,
        cover_art_url="https://cdn.deezer.com/images/cover/trembala.jpg",
    ),
]

PAGE_SIZE = 10


class FakeSongCatalog:
    def __init__(self, results: list[SearchResult] | None = None) -> None:
        self._results = results if results is not None else list(SAMPLE_SEARCH_RESULTS)
        self._unavailable = False
        self._rate_limited = False
        self.call_count = 0

    def set_unavailable(self, value: bool) -> None:
        self._unavailable = value

    def set_rate_limited(self, value: bool) -> None:
        self._rate_limited = value

    async def search(self, query: str, page: int) -> tuple[list[SearchResult], bool]:
        if self._unavailable:
            raise SongCatalogUnavailable("fake catalog unavailable")
        if self._rate_limited:
            raise SongCatalogRateLimited("fake catalog rate limited")
        self.call_count += 1
        start = (page - 1) * PAGE_SIZE
        end = start + PAGE_SIZE
        page_results = self._results[start:end]
        has_more = len(self._results) > end
        return page_results, has_more
