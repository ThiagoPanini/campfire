from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient

from campfire_api.contexts.repertoire.adapters.catalog.fake_song_catalog import FakeSongCatalog
from campfire_api.contexts.repertoire.adapters.http.deps import get_song_catalog
from tests.integration.repertoire.helpers import WONDERWALL_PAYLOAD, login

pytestmark = pytest.mark.integration


class TestRemoveRoute:
    @pytest.mark.asyncio
    async def test_401_without_bearer(self, client: AsyncClient) -> None:
        response = await client.delete(f"/repertoire/entries/{uuid4()}")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_204_owner_delete(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, headers = await login(client)
        r = await client.post("/repertoire/entries", json=WONDERWALL_PAYLOAD, headers=headers)
        entry_id = r.json()["id"]
        response = await client.delete(f"/repertoire/entries/{entry_id}", headers=headers)
        assert response.status_code == 204

        list_response = await client.get("/repertoire/entries", headers=headers)
        assert list_response.json()["entries"] == []

    @pytest.mark.asyncio
    async def test_404_second_delete(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, headers = await login(client)
        r = await client.post("/repertoire/entries", json=WONDERWALL_PAYLOAD, headers=headers)
        entry_id = r.json()["id"]
        await client.delete(f"/repertoire/entries/{entry_id}", headers=headers)
        response = await client.delete(f"/repertoire/entries/{entry_id}", headers=headers)
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_readd_after_delete(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, headers = await login(client)
        r1 = await client.post("/repertoire/entries", json=WONDERWALL_PAYLOAD, headers=headers)
        entry_id = r1.json()["id"]
        await client.delete(f"/repertoire/entries/{entry_id}", headers=headers)
        r2 = await client.post("/repertoire/entries", json=WONDERWALL_PAYLOAD, headers=headers)
        assert r2.status_code == 201
        assert r2.json()["id"] != entry_id
