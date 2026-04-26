import pytest

from tests.integration.identity.helpers import login

pytestmark = pytest.mark.integration


async def test_me_with_seeded_preferences(client) -> None:
    _response, headers = await login(client)
    me = await client.get("/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["preferences"]["instruments"] == ["Guitar", "Vocals"]


async def test_me_without_or_malformed_bearer(client) -> None:
    assert (await client.get("/me")).status_code == 401
    assert (await client.get("/me", headers={"Authorization": "Bearer nope"})).status_code == 401
