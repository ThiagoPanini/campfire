from __future__ import annotations

from uuid import UUID

from campfire_api.contexts.repertoire.domain.entities import SearchResult
from campfire_api.contexts.repertoire.domain.errors import SearchQueryTooShort
from campfire_api.contexts.repertoire.domain.ports import (
    SearchCachePort,
    SearchRateLimiter,
    SongCatalogPort,
)


class SearchSongs:
    def __init__(
        self,
        catalog: SongCatalogPort,
        cache: SearchCachePort,
        rate_limiter: SearchRateLimiter,
    ) -> None:
        self._catalog = catalog
        self._cache = cache
        self._rate_limiter = rate_limiter

    async def execute(
        self, user_id: UUID, query: str, page: int = 1
    ) -> tuple[list[SearchResult], int, bool]:
        if len(query.strip()) < 2:
            raise SearchQueryTooShort("search query must be at least 2 characters")

        await self._rate_limiter.check(user_id)

        cache_key = (user_id, query, page)
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return cached, page, False

        results, has_more = await self._catalog.search(query, page)
        await self._cache.set(cache_key, results)
        return results, page, has_more
