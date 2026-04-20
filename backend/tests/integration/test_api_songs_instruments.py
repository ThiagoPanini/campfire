from __future__ import annotations

from fastapi.testclient import TestClient

from campfire.infrastructure.bootstrap import Container


def test_song_search_requires_auth(client: TestClient) -> None:
    assert client.get("/api/v1/songs/search?q=black").status_code == 401


def test_song_search_returns_matches(client: TestClient, container: Container) -> None:
    alice = container.users.list_all()[0]
    r = client.get(
        "/api/v1/songs/search",
        headers={"X-User-Id": str(alice.id)},
        params={"q": "beatles"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data
    assert all(item["artist"] == "The Beatles" for item in data)
    assert {"title", "artist", "source"} <= set(data[0].keys())


def test_song_search_empty_query_returns_empty(
    client: TestClient, container: Container
) -> None:
    alice = container.users.list_all()[0]
    r = client.get(
        "/api/v1/songs/search",
        headers={"X-User-Id": str(alice.id)},
        params={"q": ""},
    )
    assert r.status_code == 200
    assert r.json() == []


def test_instruments_endpoint_returns_catalog(
    client: TestClient, container: Container
) -> None:
    alice = container.users.list_all()[0]
    r = client.get("/api/v1/instruments", headers={"X-User-Id": str(alice.id)})
    assert r.status_code == 200
    data = r.json()
    assert "acoustic guitar" in data


def test_instruments_endpoint_filters(client: TestClient, container: Container) -> None:
    alice = container.users.list_all()[0]
    r = client.get(
        "/api/v1/instruments",
        headers={"X-User-Id": str(alice.id)},
        params={"query": "guitar"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data
    assert all("guitar" in i for i in data)
