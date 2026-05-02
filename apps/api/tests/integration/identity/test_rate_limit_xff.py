import pytest
from httpx import ASGITransport, AsyncClient

from campfire_api.main import create_app
from campfire_api.settings import get_settings_provider
from campfire_api.shared.persistence.engine import dispose_engine

pytestmark = pytest.mark.integration


async def configured_client(monkeypatch, database_url: str, trusted_proxies: str) -> AsyncClient:
    await dispose_engine()
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")
    monkeypatch.setenv("GOOGLE_STUB_ENABLED", "true")
    monkeypatch.setenv("GOOGLE_OAUTH_ENABLED", "false")
    monkeypatch.setenv("TRUSTED_PROXIES", trusted_proxies)
    get_settings_provider.cache_clear()
    app = create_app()
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver")


async def test_trusted_proxy_rate_limit_separates_forwarded_clients(
    monkeypatch, migrated_test_database, reset_db, database_url
) -> None:
    monkeypatch.setenv("TRUSTED_PROXIES", "127.0.0.1/32,10.0.0.0/8")
    async with await configured_client(
        monkeypatch, database_url, "127.0.0.1/32,10.0.0.0/8"
    ) as client:

        for _ in range(10):
            response = await client.post(
                "/auth/login",
                headers={"X-Forwarded-For": "203.0.113.10, 10.0.0.5"},
                json={"email": "ada@campfire.test", "password": "wrong"},
            )
            assert response.status_code == 401

        separated = await client.post(
            "/auth/login",
            headers={"X-Forwarded-For": "203.0.113.11, 10.0.0.5"},
            json={"email": "ada@campfire.test", "password": "wrong"},
        )
        assert separated.status_code == 401


async def test_untrusted_peer_cannot_spoof_xff_rate_limit_key(
    monkeypatch, migrated_test_database, reset_db, database_url
) -> None:
    async with await configured_client(monkeypatch, database_url, "10.0.0.0/8") as client:
        last = None
        for index in range(11):
            last = await client.post(
                "/auth/login",
                headers={"X-Forwarded-For": f"203.0.113.{index}"},
                json={"email": "ada@campfire.test", "password": "wrong"},
            )

        assert last is not None
        assert last.status_code == 429
        assert last.headers["retry-after"]
