from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from campfire_api.settings import SettingsProvider
from campfire_api.shared.persistence.engine import get_engine


async def sessionmaker_for(settings: SettingsProvider) -> async_sessionmaker[AsyncSession]:
    engine = await get_engine(settings)
    return async_sessionmaker(engine, expire_on_commit=False)


async def session_scope(settings: SettingsProvider) -> AsyncIterator[AsyncSession]:
    maker = await sessionmaker_for(settings)
    async with maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
