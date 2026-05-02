from urllib.parse import parse_qs, urlparse

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from campfire_api.contexts.identity.adapters.http.routers import google_oauth as google_router
from campfire_api.contexts.identity.domain.entities import GoogleIdentity
from campfire_api.contexts.identity.domain.value_objects import DisplayName, Email, ProviderSubject
from campfire_api.main import create_app
from campfire_api.settings import get_settings_provider
from campfire_api.shared.persistence.engine import dispose_engine

pytestmark = pytest.mark.integration


class FakePromotingGoogleProvider:
    nonce = ""

    def __init__(self, client_id: str, client_secret: str) -> None:
        self.client_id = client_id
        self.client_secret = client_secret

    async def exchange_code(self, *, code: str, code_verifier: str, redirect_uri: str):
        return GoogleIdentity(
            subject=ProviderSubject("google-promoted-sub"),
            email=Email("promote@campfire.test"),
            display_name=DisplayName("Promoted User"),
            nonce=FakePromotingGoogleProvider.nonce,
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
    monkeypatch.setattr(google_router, "GoogleOAuthIdentityProvider", FakePromotingGoogleProvider)
    get_settings_provider.cache_clear()
    app = create_app()
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver")


async def test_account_takeover_after_google_promotion(
    monkeypatch, migrated_test_database, reset_db, database_url
) -> None:
    async with await google_client(monkeypatch, database_url) as client:
        registered = await client.post(
            "/auth/register",
            json={"email": "promote@campfire.test", "password": "Campfire123!"},
        )
        assert registered.status_code == 202
        start = await client.post("/auth/google/start", json={"intent": "sign-in"})
        query = parse_qs(urlparse(start.json()["authorizeUrl"]).query)
        FakePromotingGoogleProvider.nonce = query["nonce"][0]
        callback = await client.get(
            "/auth/google/callback",
            params={"code": "fake-code", "state": query["state"][0]},
            follow_redirects=False,
        )
        assert callback.status_code == 302
        login = await client.post(
            "/auth/login",
            json={"email": "promote@campfire.test", "password": "Campfire123!"},
        )

    engine = create_async_engine(database_url)
    async with engine.connect() as conn:
        credential_count = (
            await conn.execute(
                text(
                    """
                    SELECT count(*)
                    FROM credentials c
                    JOIN users u ON u.id = c.user_id
                    WHERE u.email = 'promote@campfire.test'
                    """
                )
            )
        ).scalar_one()
    await engine.dispose()
    assert login.status_code == 401
    assert credential_count == 0
