from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from campfire_api.contexts.repertoire.adapters.catalog.fake_song_catalog import FakeSongCatalog
from campfire_api.contexts.repertoire.adapters.http.deps import get_song_catalog
from tests.integration.repertoire.helpers import WONDERWALL_PAYLOAD, login

pytestmark = pytest.mark.integration


class TestAddEntryRoute:
    @pytest.mark.asyncio
    async def test_401_without_bearer(self, client: AsyncClient) -> None:
        response = await client.post("/repertoire/entries", json=WONDERWALL_PAYLOAD)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_201_created_happy_path(
        self, app_client: tuple, database_url: str
    ) -> None:
        app, client = app_client
        fake = FakeSongCatalog()
        app.dependency_overrides[get_song_catalog] = lambda: fake

        _, headers = await login(client)
        response = await client.post(
            "/repertoire/entries", json=WONDERWALL_PAYLOAD, headers=headers
        )
        assert response.status_code == 201
        assert response.headers.get("x-repertoire-action") == "created"
        data = response.json()
        assert data["songTitle"] == "Wonderwall"

        engine = create_async_engine(database_url)
        async with engine.begin() as conn:
            result = await conn.execute(
                text("SELECT count(*) FROM repertoire_entries")
            )
            count = result.scalar()
        await engine.dispose()
        assert count == 1

    @pytest.mark.asyncio
    async def test_second_post_returns_200_updated(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, headers = await login(client)
        await client.post("/repertoire/entries", json=WONDERWALL_PAYLOAD, headers=headers)
        payload2 = {**WONDERWALL_PAYLOAD, "proficiency": "ready"}
        response = await client.post("/repertoire/entries", json=payload2, headers=headers)
        assert response.status_code == 200
        assert response.headers.get("x-repertoire-action") == "updated"
        assert response.json()["proficiency"] == "ready"

    @pytest.mark.asyncio
    async def test_422_on_unknown_instrument(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, headers = await login(client)
        payload = {**WONDERWALL_PAYLOAD, "instrument": "Theremin"}
        response = await client.post("/repertoire/entries", json=payload, headers=headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_422_on_unknown_proficiency(self, app_client: tuple) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, headers = await login(client)
        payload = {**WONDERWALL_PAYLOAD, "proficiency": "expert"}
        response = await client.post("/repertoire/entries", json=payload, headers=headers)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_two_instruments_same_song_coexist(
        self, app_client: tuple, database_url: str
    ) -> None:
        app, client = app_client
        app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog()

        _, headers = await login(client)
        await client.post(
            "/repertoire/entries",
            json={**WONDERWALL_PAYLOAD, "instrument": "Acoustic Guitar"},
            headers=headers,
        )
        await client.post(
            "/repertoire/entries",
            json={**WONDERWALL_PAYLOAD, "instrument": "Electric Guitar"},
            headers=headers,
        )
        engine = create_async_engine(database_url)
        async with engine.begin() as conn:
            result = await conn.execute(
                text("SELECT count(*) FROM repertoire_entries")
            )
            count = result.scalar()
        await engine.dispose()
        assert count == 2
