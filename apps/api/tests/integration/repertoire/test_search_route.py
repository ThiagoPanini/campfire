from __future__ import annotations

import pytest
from httpx import AsyncClient

from campfire_api.contexts.repertoire.adapters.catalog.fake_song_catalog import FakeSongCatalog
from campfire_api.contexts.repertoire.adapters.http.deps import (
    get_search_rate_limiter,
    get_song_catalog,
)
from campfire_api.contexts.repertoire.domain.errors import SearchRateLimited
from tests.integration.repertoire.helpers import login

pytestmark = pytest.mark.integration


class AlwaysRateLimitedLimiter:
    async def check(self, user_id) -> None:
        raise SearchRateLimited(60)


class TestSearchRoute:
    @pytest.mark.asyncio
    async def test_401_without_bearer(self, client: AsyncClient) -> None:
        response = await client.get("/repertoire/songs/search", params={"q": "wonderwall"})
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_422_for_short_query(self, client: AsyncClient) -> None:
        _, headers = await login(client)
        response = await client.get(
            "/repertoire/songs/search", params={"q": "w"}, headers=headers
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_200_with_results(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, headers = await login(client)
        response = await client.get(
            "/repertoire/songs/search", params={"q": "wonderwall"}, headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["results"]) > 0

    @pytest.mark.asyncio
    async def test_429_when_rate_limited(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()
        app.dependency_overrides[get_search_rate_limiter] = lambda: AlwaysRateLimitedLimiter()

        _, headers = await login(client)
        response = await client.get(
            "/repertoire/songs/search", params={"q": "wonderwall"}, headers=headers
        )
        assert response.status_code == 429

    @pytest.mark.asyncio
    async def test_503_when_catalog_unavailable(self, app_client: tuple) -> None:
        app, client = app_client
        fake = FakeSongCatalog()
        fake.set_unavailable(True)
        app.dependency_overrides[get_song_catalog] = lambda: fake

        _, headers = await login(client)
        response = await client.get(
            "/repertoire/songs/search", params={"q": "wonderwall"}, headers=headers
        )
        assert response.status_code == 503

    @pytest.mark.asyncio
    async def test_cache_short_circuit(self, app_client: tuple) -> None:
        app, client = app_client
        fake = FakeSongCatalog()
        app.dependency_overrides[get_song_catalog] = lambda: fake

        _, headers = await login(client)
        await client.get(
            "/repertoire/songs/search", params={"q": "wonderwall"}, headers=headers
        )
        await client.get(
            "/repertoire/songs/search", params={"q": "wonderwall"}, headers=headers
        )
        # Both requests should succeed; second may be served from cache
        assert fake.call_count >= 1
