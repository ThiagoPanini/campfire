from __future__ import annotations

from fastapi.testclient import TestClient

from campfire.infrastructure.bootstrap import Container


def test_register_and_list_my_repertoire(client: TestClient, container: Container) -> None:
    users = container.users.list_all()
    alice, bob = users[0], users[1]

    # Unauthenticated call is rejected.
    assert (
        client.post(
            "/api/v1/repertoire",
            json={
                "song_title": "Black",
                "song_artist": "Pearl Jam",
                "instrument": "guitar",
                "proficiency": 8,
            },
        ).status_code
        == 401
    )

    # Alice declares 'Black' on guitar at proficiency 8.
    r = client.post(
        "/api/v1/repertoire",
        headers={"X-User-Id": str(alice.id)},
        json={
            "song_title": "Black",
            "song_artist": "Pearl Jam",
            "instrument": "guitar",
            "proficiency": 8,
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["proficiency"] == 8
    assert body["proficiency_label"] == "advanced"
    assert body["instrument"] == "guitar"

    # Same song, different instrument is allowed.
    r = client.post(
        "/api/v1/repertoire",
        headers={"X-User-Id": str(alice.id)},
        json={
            "song_title": "Black",
            "song_artist": "Pearl Jam",
            "instrument": "vocals",
            "proficiency": 5,
        },
    )
    assert r.status_code == 201

    # Duplicate (same song + instrument) is rejected.
    r = client.post(
        "/api/v1/repertoire",
        headers={"X-User-Id": str(alice.id)},
        json={
            "song_title": "Black",
            "song_artist": "Pearl Jam",
            "instrument": "guitar",
            "proficiency": 9,
        },
    )
    assert r.status_code == 409

    # Out-of-range proficiency rejected at the schema boundary.
    r = client.post(
        "/api/v1/repertoire",
        headers={"X-User-Id": str(alice.id)},
        json={
            "song_title": "Creep",
            "song_artist": "Radiohead",
            "instrument": "guitar",
            "proficiency": 42,
        },
    )
    assert r.status_code == 422

    # Custom instrument accepted without prior catalog entry.
    r = client.post(
        "/api/v1/repertoire",
        headers={"X-User-Id": str(bob.id)},
        json={
            "song_title": "Imagine",
            "song_artist": "John Lennon",
            "instrument": "theremin",
            "proficiency": 2,
        },
    )
    assert r.status_code == 201
    assert r.json()["proficiency_label"] == "beginner"

    # Alice retrieves her repertoire.
    r = client.get("/api/v1/repertoire/me", headers={"X-User-Id": str(alice.id)})
    assert r.status_code == 200
    mine = r.json()
    assert len(mine) == 2
    labels = {(m["instrument"], m["proficiency_label"]) for m in mine}
    assert labels == {("guitar", "advanced"), ("vocals", "intermediate")}


def test_possible_repertoire_endpoint_removed(client: TestClient, container: Container) -> None:
    alice = container.users.list_all()[0]
    r = client.post(
        "/api/v1/repertoire/possible",
        headers={"X-User-Id": str(alice.id)},
        json={"present_user_ids": [str(alice.id)]},
    )
    assert r.status_code == 404
