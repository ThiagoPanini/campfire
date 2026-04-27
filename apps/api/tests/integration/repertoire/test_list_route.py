from __future__ import annotations

import pytest
from httpx import AsyncClient

from campfire_api.contexts.repertoire.adapters.catalog.fake_song_catalog import FakeSongCatalog
from campfire_api.contexts.repertoire.adapters.http.deps import get_song_catalog
from tests.integration.repertoire.helpers import WONDERWALL_PAYLOAD, login

pytestmark = pytest.mark.integration


class TestListRoute:
    @pytest.mark.asyncio
    async def test_401_without_bearer(self, client: AsyncClient) -> None:
        response = await client.get("/repertoire/entries")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_200_empty_list(self, client: AsyncClient) -> None:
        _, headers = await login(client)
        response = await client.get("/repertoire/entries", headers=headers)
        assert response.status_code == 200
        assert response.json()["entries"] == []

    @pytest.mark.asyncio
    async def test_200_with_multiple_entries(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, headers = await login(client)
        for instrument in ["Guitar", "Piano / Keys", "Bass"]:
            await client.post(
                "/repertoire/entries",
                json={**WONDERWALL_PAYLOAD, "instrument": instrument},
                headers=headers,
            )
        response = await client.get("/repertoire/entries", headers=headers)
        assert response.status_code == 200
        entries = response.json()["entries"]
        assert len(entries) == 3

    @pytest.mark.asyncio
    async def test_catalog_unavailable_does_not_break_list(self, app_client: tuple) -> None:
        app, client = app_client
        unavailable = FakeSongCatalog()
        unavailable.set_unavailable(True)
        app.dependency_overrides[get_song_catalog] = lambda: unavailable

        _, headers = await login(client)
        response = await client.get("/repertoire/entries", headers=headers)
        assert response.status_code == 200
