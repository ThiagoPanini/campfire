from collections.abc import AsyncIterator

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.settings import SettingsProvider
from campfire_api.shared.persistence.session import session_scope


async def get_settings(request: Request) -> SettingsProvider:
    return request.app.state.settings_provider


async def get_db_session(
    settings: SettingsProvider = Depends(get_settings),
) -> AsyncIterator[AsyncSession]:
    async for session in session_scope(settings):
        yield session
