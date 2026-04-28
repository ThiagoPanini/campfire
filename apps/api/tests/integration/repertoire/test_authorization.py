from __future__ import annotations

import pytest
from httpx import AsyncClient

from campfire_api.contexts.repertoire.adapters.catalog.fake_song_catalog import FakeSongCatalog
from campfire_api.contexts.repertoire.adapters.http.deps import get_song_catalog
from tests.integration.repertoire.helpers import WONDERWALL_PAYLOAD, login

pytestmark = pytest.mark.integration


async def _register_and_login(client: AsyncClient, email: str, password: str):
    await client.post(
        "/auth/register",
        json={"email": email, "password": password, "displayName": "Bob"},
    )
    _, headers = await login(client, email=email, password=password)
    return headers


class TestAuthorization:
    @pytest.mark.asyncio
    async def test_cross_user_delete_returns_404(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, ada_headers = await login(client)
        bob_headers = await _register_and_login(
            client, "bob2@campfire.test", "campfire123"
        )

        r = await client.post(
            "/repertoire/entries", json=WONDERWALL_PAYLOAD, headers=ada_headers
        )
        entry_id = r.json()["id"]

        response = await client.delete(
            f"/repertoire/entries/{entry_id}", headers=bob_headers
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_cross_user_update_returns_404(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, ada_headers = await login(client)
        bob_headers = await _register_and_login(
            client, "bob3@campfire.test", "campfire123"
        )

        r = await client.post(
            "/repertoire/entries", json=WONDERWALL_PAYLOAD, headers=ada_headers
        )
        entry_id = r.json()["id"]

        response = await client.patch(
            f"/repertoire/entries/{entry_id}",
            json={"proficiency": "ready"},
            headers=bob_headers,
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_list_scoped_to_calling_user(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, ada_headers = await login(client)
        bob_headers = await _register_and_login(
            client, "bob4@campfire.test", "campfire123"
        )

        await client.post(
            "/repertoire/entries", json=WONDERWALL_PAYLOAD, headers=ada_headers
        )

        response = await client.get("/repertoire/entries", headers=bob_headers)
        assert response.json()["entries"] == []
