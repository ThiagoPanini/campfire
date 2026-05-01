from urllib.parse import parse_qs, urlparse

import pytest
from httpx import ASGITransport, AsyncClient

from campfire_api.contexts.identity.adapters.http.routers import google_oauth as google_router
from campfire_api.contexts.identity.domain.entities import GoogleIdentity
from campfire_api.contexts.identity.domain.value_objects import DisplayName, Email, ProviderSubject
from campfire_api.main import create_app
from campfire_api.settings import get_settings_provider
from campfire_api.shared.persistence.engine import dispose_engine

pytestmark = pytest.mark.integration


class FakeGoogleProvider:
    def __init__(self, client_id: str, client_secret: str) -> None:
        self.client_id = client_id
        self.client_secret = client_secret

    async def exchange_code(self, *, code: str, code_verifier: str, redirect_uri: str):
        return GoogleIdentity(
            subject=ProviderSubject("google-sub"),
            email=Email("google@campfire.test"),
            display_name=DisplayName("Google User"),
            nonce=FakeGoogleProvider.nonce,
            email_verified=True,
        )


async def google_client(monkeypatch, database_url):
    await dispose_engine()
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")
    monkeypatch.setenv("GOOGLE_OAUTH_ENABLED", "true")
    monkeypatch.setenv("GOOGLE_OAUTH_CLIENT_ID", "client")
    monkeypatch.setenv("GOOGLE_OAUTH_CLIENT_SECRET", "secret")
    monkeypatch.setenv("GOOGLE_OAUTH_REDIRECT_URI", "http://testserver/auth/google/callback")
    monkeypatch.setenv("OAUTH_FLOW_HMAC_KEY", "oauth-test-key")
    monkeypatch.setenv("WEB_BASE_URL", "http://localhost:5173")
    monkeypatch.setattr(google_router, "GoogleOAuthIdentityProvider", FakeGoogleProvider)
    get_settings_provider.cache_clear()
    app = create_app()
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver")


async def test_google_oauth_happy_path_sets_refresh_cookie(
    monkeypatch, migrated_test_database, reset_db, database_url
) -> None:
    async with await google_client(monkeypatch, database_url) as client:
        start = await client.post(
            "/auth/google/start",
            json={"intent": "sign-in", "next": "/repertoire"},
        )
        assert start.status_code == 200
        parsed = urlparse(start.json()["authorizeUrl"])
        query = parse_qs(parsed.query)
        FakeGoogleProvider.nonce = query["nonce"][0]
        callback = await client.get(
            "/auth/google/callback",
            params={"code": "fake-code", "state": query["state"][0]},
            follow_redirects=False,
        )
    assert callback.status_code == 302
    assert callback.headers["location"] == "http://localhost:5173/repertoire?auth=ok"
    cookie = callback.headers["set-cookie"]
    assert "campfire_refresh=" in cookie
    assert "Path=/auth/refresh" in cookie
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie


async def test_google_next_param_drops_unsafe_values(
    monkeypatch, migrated_test_database, reset_db, database_url
) -> None:
    async with await google_client(monkeypatch, database_url) as client:
        start = await client.post(
            "/auth/google/start",
            json={"intent": "sign-in", "next": "//evil.com"},
        )
        query = parse_qs(urlparse(start.json()["authorizeUrl"]).query)
        FakeGoogleProvider.nonce = query["nonce"][0]
        callback = await client.get(
            "/auth/google/callback",
            params={"code": "fake-code", "state": query["state"][0]},
            follow_redirects=False,
        )
    assert callback.headers["location"] == "http://localhost:5173/home?auth=ok"
