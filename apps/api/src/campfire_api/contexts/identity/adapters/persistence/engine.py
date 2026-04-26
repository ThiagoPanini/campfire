from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from campfire_api.settings import SettingsProvider

_engine: AsyncEngine | None = None
_engine_dsn: str | None = None


async def get_engine(settings: SettingsProvider) -> AsyncEngine:
    global _engine, _engine_dsn
    dsn = await settings.database_url()
    if _engine is None or _engine_dsn != dsn:
        if _engine is not None:
            await _engine.dispose()
        _engine = create_async_engine(dsn, pool_pre_ping=True)
        _engine_dsn = dsn
    return _engine


async def dispose_engine() -> None:
    global _engine, _engine_dsn
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _engine_dsn = None
