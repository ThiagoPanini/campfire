from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

import pytest

from campfire_api.contexts.repertoire.adapters.catalog.fake_song_catalog import FakeSongCatalog
from campfire_api.contexts.repertoire.application.use_cases.search_songs import SearchSongs
from campfire_api.contexts.repertoire.domain.entities import SearchResult
from campfire_api.contexts.repertoire.domain.errors import (
    SearchQueryTooShort,
    SearchRateLimited,
    SongCatalogUnavailable,
)

pytestmark = pytest.mark.unit


class NullCache:
    async def get(self, key: tuple[Any, ...]) -> None:
        return None

    async def set(self, key: tuple[Any, ...], value: list[SearchResult]) -> None:
        pass


class NullLimiter:
    async def check(self, user_id: object) -> None:
        pass


class AlwaysRateLimitedLimiter:
    async def check(self, user_id: object) -> None:
        raise SearchRateLimited(60)


class HitCache:
    def __init__(self, results: list[SearchResult]) -> None:
        self._results = results
        self.set_calls = 0

    async def get(self, key: tuple[Any, ...]) -> list[SearchResult]:
        return self._results

    async def set(self, key: tuple[Any, ...], value: list[SearchResult]) -> None:
        self.set_calls += 1


class TestSearchSongs:
    @pytest.mark.asyncio
    async def test_cache_miss_calls_catalog(self) -> None:
        catalog = FakeSongCatalog()
        use_case = SearchSongs(catalog, NullCache(), NullLimiter())
        results, page, _ = await use_case.execute(uuid4(), "wonderwall")
        assert len(results) > 0
        assert catalog.call_count == 1

    @pytest.mark.asyncio
    async def test_cache_hit_short_circuits_catalog(self) -> None:
        cached_results = [
            SearchResult("1", "Cached Song", "Artist", None, None, None)
        ]
        cache = HitCache(cached_results)
        catalog = FakeSongCatalog()
        use_case = SearchSongs(catalog, cache, NullLimiter())
        results, _, _ = await use_case.execute(uuid4(), "wonderwall")
        assert results == cached_results
        assert catalog.call_count == 0

    @pytest.mark.asyncio
    async def test_rate_limit_raises(self) -> None:
        use_case = SearchSongs(FakeSongCatalog(), NullCache(), AlwaysRateLimitedLimiter())
        with pytest.raises(SearchRateLimited):
            await use_case.execute(uuid4(), "wonderwall")

    @pytest.mark.asyncio
    async def test_catalog_unavailable_propagates(self) -> None:
        catalog = FakeSongCatalog()
        catalog.set_unavailable(True)
        use_case = SearchSongs(catalog, NullCache(), NullLimiter())
        with pytest.raises(SongCatalogUnavailable):
            await use_case.execute(uuid4(), "wonderwall")

    @pytest.mark.asyncio
    async def test_query_too_short_raises(self) -> None:
        use_case = SearchSongs(FakeSongCatalog(), NullCache(), NullLimiter())
        with pytest.raises(SearchQueryTooShort):
            await use_case.execute(uuid4(), "w")

    @pytest.mark.asyncio
    async def test_query_empty_raises(self) -> None:
        use_case = SearchSongs(FakeSongCatalog(), NullCache(), NullLimiter())
        with pytest.raises(SearchQueryTooShort):
            await use_case.execute(uuid4(), "")
