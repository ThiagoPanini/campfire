from __future__ import annotations

from fastapi.testclient import TestClient

from campfire.infrastructure.bootstrap import Container


def test_register_and_list_possible_repertoire(
    client: TestClient, container: Container
) -> None:
    users = container.users.list_all()
    alice, bob = users[0], users[1]

    # Unauthenticated call is rejected.
    assert (
        client.post(
            "/api/v1/repertoire",
            json={"song_title": "Black", "song_artist": "Pearl Jam", "instrument": "guitar"},
        ).status_code
        == 401
    )

    # Alice declares 'Black' on guitar.
    r = client.post(
        "/api/v1/repertoire",
        headers={"X-User-Id": str(alice.id)},
        json={"song_title": "Black", "song_artist": "Pearl Jam", "instrument": "guitar"},
    )
    assert r.status_code == 201, r.text

    # Bob declares the same song on vocals.
    r = client.post(
        "/api/v1/repertoire",
        headers={"X-User-Id": str(bob.id)},
        json={"song_title": "Black", "song_artist": "Pearl Jam", "instrument": "vocals"},
    )
    assert r.status_code == 201

    # Duplicate declaration is rejected.
    r = client.post(
        "/api/v1/repertoire",
        headers={"X-User-Id": str(alice.id)},
        json={"song_title": "Black", "song_artist": "Pearl Jam", "instrument": "guitar"},
    )
    assert r.status_code == 409

    # Alice alone present → one possible song with one supporter.
    r = client.post(
        "/api/v1/repertoire/possible",
        headers={"X-User-Id": str(alice.id)},
        json={"present_user_ids": [str(alice.id)]},
    )
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["song_title"] == "Black"
    assert list(data[0]["supporters"].keys()) == [str(alice.id)]

    # Both present → two supporters for the same song.
    r = client.post(
        "/api/v1/repertoire/possible",
        headers={"X-User-Id": str(alice.id)},
        json={"present_user_ids": [str(alice.id), str(bob.id)]},
    )
    data = r.json()
    assert len(data) == 1
    assert set(data[0]["supporters"].keys()) == {str(alice.id), str(bob.id)}
