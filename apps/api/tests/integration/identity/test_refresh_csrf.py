import pytest

from tests.integration.identity.helpers import login

pytestmark = pytest.mark.integration


async def test_cross_origin_refresh_rejected_without_rotation(client) -> None:
    _response, headers = await login(client)
    old_cookie = client.cookies.get("campfire_refresh")

    rejected = await client.post("/auth/refresh", headers={"Origin": "https://evil.example"})
    assert rejected.status_code == 403

    client.cookies.set("campfire_refresh", old_cookie, path="/auth/refresh")
    allowed = await client.post("/auth/refresh", headers={"Origin": "http://localhost:5173"})
    assert allowed.status_code == 200


async def test_cross_origin_logout_rejected_without_revocation(client) -> None:
    _response, headers = await login(client)

    rejected = await client.post(
        "/auth/logout", headers={**headers, "Origin": "https://evil.example"}
    )
    assert rejected.status_code == 403
    assert (await client.get("/me", headers=headers)).status_code == 200


async def test_allowed_origin_refresh_and_logout_still_work(client) -> None:
    _response, headers = await login(client)

    refresh = await client.post("/auth/refresh", headers={"Origin": "http://localhost:5173"})
    assert refresh.status_code == 200
    logout = await client.post(
        "/auth/logout",
        headers={"Authorization": f"Bearer {refresh.json()['accessToken']}", "Origin": "http://localhost:5173"},
    )
    assert logout.status_code == 204
