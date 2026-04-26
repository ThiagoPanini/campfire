import pytest

from tests.integration.identity.helpers import login

pytestmark = pytest.mark.integration


async def test_preferences_happy_path(client) -> None:
    _response, headers = await login(client)
    payload = {
        "instruments": ["Guitar"],
        "genres": ["Rock"],
        "context": "friends",
        "goals": ["Track my full repertoire"],
        "experience": "intermediate",
    }
    response = await client.patch("/me/preferences", headers=headers, json=payload)
    assert response.status_code == 200
    assert response.json()["firstLogin"] is False


async def test_preferences_unknown_id_zero_change(client) -> None:
    _response, headers = await login(client)
    response = await client.patch(
        "/me/preferences", headers=headers, json={"instruments": ["Nope"]}
    )
    assert response.status_code == 422
    me = await client.get("/me", headers=headers)
    assert me.json()["preferences"]["instruments"] == ["Guitar", "Vocals"]


async def test_preferences_nullable_shapes(client) -> None:
    _response, headers = await login(client)
    response = await client.patch(
        "/me/preferences",
        headers=headers,
        json={"instruments": [], "genres": [], "context": None, "goals": [], "experience": None},
    )
    assert response.status_code == 200
    assert response.json()["preferences"]["context"] is None
