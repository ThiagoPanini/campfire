from __future__ import annotations

from collections.abc import AsyncIterator

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.clock.system_clock import SystemClock
from campfire_api.contexts.identity.adapters.persistence.unit_of_work import session_scope
from campfire_api.contexts.repertoire.adapters.catalog.deezer_song_catalog import DeezerSongCatalog
from campfire_api.contexts.repertoire.adapters.catalog.fake_song_catalog import FakeSongCatalog
from campfire_api.contexts.repertoire.adapters.caching.ttl_search_cache import TtlSearchCache
from campfire_api.contexts.repertoire.adapters.persistence.repertoire_entry_repository import (
    SqlAlchemyRepertoireEntryRepository,
)
from campfire_api.contexts.repertoire.adapters.rate_limiting.in_memory_search_limiter import (
    InMemorySearchLimiter,
)
from campfire_api.settings import SettingsProvider


async def get_settings(request: Request) -> SettingsProvider:
    return request.app.state.settings_provider


async def get_db_session(
    settings: SettingsProvider = Depends(get_settings),
) -> AsyncIterator[AsyncSession]:
    async for session in session_scope(settings):
        yield session


async def get_repertoire_repository(
    session: AsyncSession = Depends(get_db_session),
) -> SqlAlchemyRepertoireEntryRepository:
    return SqlAlchemyRepertoireEntryRepository(session)


async def get_song_catalog(
    request: Request,
    settings: SettingsProvider = Depends(get_settings),
) -> DeezerSongCatalog:
    if not hasattr(request.app.state, "deezer_catalog"):
        request.app.state.deezer_catalog = DeezerSongCatalog(
            base_url=await settings.deezer_base_url()
        )
    return request.app.state.deezer_catalog


async def get_search_cache(
    request: Request,
    settings: SettingsProvider = Depends(get_settings),
) -> TtlSearchCache:
    if not hasattr(request.app.state, "search_cache"):
        request.app.state.search_cache = TtlSearchCache(
            ttl_seconds=await settings.search_cache_ttl_seconds(),
            max_entries=await settings.search_cache_max_entries(),
        )
    return request.app.state.search_cache


async def get_search_rate_limiter(
    request: Request,
    settings: SettingsProvider = Depends(get_settings),
) -> InMemorySearchLimiter:
    if not hasattr(request.app.state, "search_rate_limiter"):
        request.app.state.search_rate_limiter = InMemorySearchLimiter(
            clock=SystemClock(),
            limit=await settings.search_rate_limit_per_window(),
            window_seconds=await settings.search_rate_limit_window_seconds(),
        )
    return request.app.state.search_rate_limiter
