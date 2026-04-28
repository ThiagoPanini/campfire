from __future__ import annotations

import asyncio
import time

import pytest

from campfire_api.contexts.repertoire.adapters.caching.ttl_search_cache import TtlSearchCache
from campfire_api.contexts.repertoire.domain.entities import SearchResult

pytestmark = pytest.mark.unit


def _result(title: str = "Song") -> SearchResult:
    return SearchResult(
        external_id="1",
        title=title,
        artist="Artist",
        album=None,
        release_year=None,
        cover_art_url=None,
    )


class TestTtlSearchCache:
    @pytest.mark.asyncio
    async def test_set_and_get(self) -> None:
        cache = TtlSearchCache(ttl_seconds=10, max_entries=100)
        key = ("user1", "wonderwall", 1)
        value = [_result("Wonderwall")]
        await cache.set(key, value)
        result = await cache.get(key)
        assert result == value

    @pytest.mark.asyncio
    async def test_returns_none_for_missing_key(self) -> None:
        cache = TtlSearchCache(ttl_seconds=10)
        assert await cache.get(("user1", "missing", 1)) is None

    @pytest.mark.asyncio
    async def test_ttl_expiry(self, monkeypatch) -> None:
        cache = TtlSearchCache(ttl_seconds=1, max_entries=100)
        key = ("user1", "query", 1)
        await cache.set(key, [_result()])
        # Fast-forward monotonic time past TTL
        original_monotonic = time.monotonic

        def fast_time():
            return original_monotonic() + 2.0

        monkeypatch.setattr(time, "monotonic", fast_time)
        assert await cache.get(key) is None

    @pytest.mark.asyncio
    async def test_lru_eviction(self) -> None:
        cache = TtlSearchCache(ttl_seconds=60, max_entries=2)
        await cache.set(("u", "a", 1), [_result("A")])
        await cache.set(("u", "b", 1), [_result("B")])
        await cache.set(("u", "c", 1), [_result("C")])
        # Oldest entry "a" should be evicted
        assert await cache.get(("u", "a", 1)) is None
        assert await cache.get(("u", "b", 1)) is not None
        assert await cache.get(("u", "c", 1)) is not None

    @pytest.mark.asyncio
    async def test_key_normalization_case_and_whitespace(self) -> None:
        cache = TtlSearchCache()
        key1 = ("user1", "  Wonderwall  ", 1)
        key2 = ("user1", "wonderwall", 1)
        await cache.set(key1, [_result("W")])
        assert await cache.get(key2) is not None

    @pytest.mark.asyncio
    async def test_user_isolation(self) -> None:
        cache = TtlSearchCache()
        await cache.set(("user1", "q", 1), [_result("A")])
        assert await cache.get(("user2", "q", 1)) is None
