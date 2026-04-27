from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient

from campfire_api.contexts.repertoire.adapters.catalog.fake_song_catalog import FakeSongCatalog
from campfire_api.contexts.repertoire.adapters.http.deps import get_song_catalog
from tests.integration.repertoire.helpers import WONDERWALL_PAYLOAD, login

pytestmark = pytest.mark.integration


class TestUpdateRoute:
    @pytest.mark.asyncio
    async def test_401_without_bearer(self, client: AsyncClient) -> None:
        response = await client.patch(
            f"/repertoire/entries/{uuid4()}", json={"proficiency": "ready"}
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_200_happy_update(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, headers = await login(client)
        r = await client.post("/repertoire/entries", json=WONDERWALL_PAYLOAD, headers=headers)
        entry = r.json()
        entry_id = entry["id"]
        original_created_at = entry["createdAt"]

        response = await client.patch(
            f"/repertoire/entries/{entry_id}",
            json={"proficiency": "ready"},
            headers=headers,
        )
        assert response.status_code == 200
        updated = response.json()
        assert updated["proficiency"] == "ready"
        assert updated["createdAt"] == original_created_at

    @pytest.mark.asyncio
    async def test_422_on_unknown_proficiency(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, headers = await login(client)
        r = await client.post("/repertoire/entries", json=WONDERWALL_PAYLOAD, headers=headers)
        entry_id = r.json()["id"]
        response = await client.patch(
            f"/repertoire/entries/{entry_id}",
            json={"proficiency": "expert"},
            headers=headers,
        )
        assert response.status_code == 422
