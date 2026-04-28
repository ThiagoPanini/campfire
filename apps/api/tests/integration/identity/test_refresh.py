import pytest

from tests.integration.identity.helpers import login

pytestmark = pytest.mark.integration


async def test_refresh_rotation(client) -> None:
    response, headers = await login(client)
    access = response.json()["accessToken"]
    rotated = await client.post("/auth/refresh", headers=headers)
    assert rotated.status_code == 200
    assert rotated.json()["accessToken"] != access


async def test_refresh_missing_cookie(client) -> None:
    other_client = client
    response = await other_client.post("/auth/refresh")
    assert response.status_code == 401


async def test_refresh_reused_cookie_revokes_family(client) -> None:
    _response, headers = await login(client)
    old_cookie = client.cookies.get("campfire_refresh")
    first = await client.post("/auth/refresh", headers=headers)
    assert first.status_code == 200
    client.cookies.set("campfire_refresh", old_cookie, path="/auth/refresh")
    reused = await client.post("/auth/refresh", headers=headers)
    assert reused.status_code == 401
    assert (await client.get("/me", headers=headers)).status_code == 401
