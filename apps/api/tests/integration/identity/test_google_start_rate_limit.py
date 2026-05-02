import pytest
from httpx import ASGITransport, AsyncClient

from campfire_api.main import create_app
from campfire_api.settings import get_settings_provider
from campfire_api.shared.persistence.engine import dispose_engine

pytestmark = pytest.mark.integration


async def google_enabled_client(monkeypatch, database_url: str) -> AsyncClient:
    await dispose_engine()
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")
    monkeypatch.setenv("GOOGLE_OAUTH_ENABLED", "true")
    monkeypatch.setenv("GOOGLE_OAUTH_CLIENT_ID", "client")
    monkeypatch.setenv("GOOGLE_OAUTH_CLIENT_SECRET", "secret")
    monkeypatch.setenv("GOOGLE_OAUTH_REDIRECT_URI", "http://testserver/auth/google/callback")
    monkeypatch.setenv("OAUTH_FLOW_HMAC_KEY", "oauth-test-key")
    get_settings_provider.cache_clear()
    return AsyncClient(transport=ASGITransport(app=create_app()), base_url="http://testserver")


async def test_google_start_rate_limit(
    monkeypatch, migrated_test_database, reset_db, database_url
) -> None:
    async with await google_enabled_client(monkeypatch, database_url) as client:
        last = None
        for _ in range(11):
            last = await client.post("/auth/google/start", json={"intent": "sign-in"})

        assert last is not None
        assert last.status_code == 429
        assert last.headers["retry-after"]
