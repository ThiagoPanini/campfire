from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from campfire_api.contexts.identity.adapters.persistence.engine import dispose_engine
from campfire_api.main import create_app
from campfire_api.settings import get_settings_provider


@pytest.fixture
async def app_client(
    monkeypatch: pytest.MonkeyPatch, migrated_test_database, reset_db, database_url: str
) -> AsyncIterator[tuple]:
    """Yields (app, client) so tests can override dependencies."""
    await dispose_engine()
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")
    get_settings_provider.cache_clear()
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        yield app, ac
    await dispose_engine()
    get_settings_provider.cache_clear()
