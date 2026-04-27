from __future__ import annotations

import json

import httpx
import pytest

from campfire_api.contexts.repertoire.adapters.catalog.deezer_song_catalog import DeezerSongCatalog
from campfire_api.contexts.repertoire.domain.errors import (
    SongCatalogRateLimited,
    SongCatalogUnavailable,
)

pytestmark = pytest.mark.unit


def _make_track(
    track_id: int = 1,
    title: str = "Wonderwall",
    artist: str = "Oasis",
    album: str = "Morning Glory",
    release_date: str = "1995-10-02",
    cover: str | None = "https://cdn.deezer.com/cover.jpg",
) -> dict:
    return {
        "id": track_id,
        "title": title,
        "artist": {"name": artist},
        "album": {
            "title": album,
            "release_date": release_date,
            "cover_medium": cover,
        },
    }


class _MockTransport(httpx.MockTransport if hasattr(httpx, "MockTransport") else object):
    pass


def _mock_response(status: int, body: dict) -> httpx.Response:
    return httpx.Response(
        status_code=status,
        content=json.dumps(body).encode(),
        headers={"content-type": "application/json"},
    )


class _StaticTransport(httpx.BaseTransport):
    def __init__(self, response: httpx.Response) -> None:
        self._response = response

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        return self._response


class _RaisingTransport(httpx.BaseTransport):
    def handle_request(self, request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("network down")


def _catalog_with_transport(transport: httpx.BaseTransport) -> DeezerSongCatalog:
    catalog = DeezerSongCatalog.__new__(DeezerSongCatalog)
    catalog._base_url = "https://api.deezer.com"
    catalog._transport = transport
    return catalog


class TestDeezerSongCatalogUnit:
    @pytest.fixture
    def catalog(self, monkeypatch):
        transport = _StaticTransport(
            _mock_response(200, {"data": [_make_track()]})
        )

        async def fake_async_context(self_inner):
            return httpx.AsyncClient(transport=transport)

        return DeezerSongCatalog(base_url="https://api.deezer.com")

    @pytest.mark.asyncio
    async def test_happy_path(self) -> None:
        tracks = [_make_track(i) for i in range(1, 4)]
        response_body = {"data": tracks}

        class Transport(httpx.AsyncBaseTransport):
            async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
                return _mock_response(200, response_body)

        catalog = DeezerSongCatalog(base_url="https://api.deezer.com")
        # Patch AsyncClient to use our transport
        import httpx as _httpx

        original = _httpx.AsyncClient

        class PatchedClient(_httpx.AsyncClient):
            def __init__(self, **kwargs):
                kwargs["transport"] = Transport()
                super().__init__(**kwargs)

        import unittest.mock as mock

        with mock.patch("httpx.AsyncClient", PatchedClient):
            results, has_more = await catalog.search("wonderwall", 1)

        assert len(results) == 3
        assert results[0].title == "Wonderwall"
        assert results[0].release_year == 1995
        assert results[0].cover_art_url == "https://cdn.deezer.com/cover.jpg"
        assert not has_more

    @pytest.mark.asyncio
    async def test_missing_cover_art(self) -> None:
        tracks = [_make_track(cover=None)]
        import unittest.mock as mock

        class Transport(httpx.AsyncBaseTransport):
            async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
                return _mock_response(200, {"data": tracks})

        class PatchedClient(httpx.AsyncClient):
            def __init__(self, **kwargs):
                kwargs["transport"] = Transport()
                super().__init__(**kwargs)

        catalog = DeezerSongCatalog()
        with mock.patch("httpx.AsyncClient", PatchedClient):
            results, _ = await catalog.search("wonderwall", 1)

        assert results[0].cover_art_url is None

    @pytest.mark.asyncio
    async def test_missing_release_date(self) -> None:
        track = _make_track()
        track["album"]["release_date"] = None
        import unittest.mock as mock

        class Transport(httpx.AsyncBaseTransport):
            async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
                return _mock_response(200, {"data": [track]})

        class PatchedClient(httpx.AsyncClient):
            def __init__(self, **kwargs):
                kwargs["transport"] = Transport()
                super().__init__(**kwargs)

        catalog = DeezerSongCatalog()
        with mock.patch("httpx.AsyncClient", PatchedClient):
            results, _ = await catalog.search("wonderwall", 1)

        assert results[0].release_year is None

    @pytest.mark.asyncio
    async def test_5xx_raises_unavailable(self) -> None:
        import unittest.mock as mock

        class Transport(httpx.AsyncBaseTransport):
            async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
                return _mock_response(503, {})

        class PatchedClient(httpx.AsyncClient):
            def __init__(self, **kwargs):
                kwargs["transport"] = Transport()
                super().__init__(**kwargs)

        catalog = DeezerSongCatalog()
        with mock.patch("httpx.AsyncClient", PatchedClient):
            with pytest.raises(SongCatalogUnavailable):
                await catalog.search("wonderwall", 1)

    @pytest.mark.asyncio
    async def test_429_raises_rate_limited(self) -> None:
        import unittest.mock as mock

        class Transport(httpx.AsyncBaseTransport):
            async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
                return _mock_response(429, {})

        class PatchedClient(httpx.AsyncClient):
            def __init__(self, **kwargs):
                kwargs["transport"] = Transport()
                super().__init__(**kwargs)

        catalog = DeezerSongCatalog()
        with mock.patch("httpx.AsyncClient", PatchedClient):
            with pytest.raises(SongCatalogRateLimited):
                await catalog.search("wonderwall", 1)

    @pytest.mark.asyncio
    async def test_transport_error_raises_unavailable(self) -> None:
        import unittest.mock as mock

        class Transport(httpx.AsyncBaseTransport):
            async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
                raise httpx.ConnectError("network down")

        class PatchedClient(httpx.AsyncClient):
            def __init__(self, **kwargs):
                kwargs["transport"] = Transport()
                super().__init__(**kwargs)

        catalog = DeezerSongCatalog()
        with mock.patch("httpx.AsyncClient", PatchedClient):
            with pytest.raises(SongCatalogUnavailable):
                await catalog.search("wonderwall", 1)
