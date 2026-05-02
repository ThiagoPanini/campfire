import pytest

pytestmark = pytest.mark.integration


async def test_seeded_existing_user_weak_password_and_refresh_still_work(client) -> None:
    login = await client.post(
        "/auth/login",
        json={"email": "ada@campfire.test", "password": "campfire123"},
    )
    assert login.status_code == 200
    assert login.json()["accessToken"]
    assert "campfire_refresh" in login.headers["set-cookie"]

    refresh = await client.post("/auth/refresh")
    assert refresh.status_code == 200
    assert refresh.json()["accessToken"]
    assert refresh.json()["accessToken"] != login.json()["accessToken"]

    me = await client.get(
        "/me",
        headers={"Authorization": f"Bearer {refresh.json()['accessToken']}"},
    )
    assert me.status_code == 200
    assert me.json()["email"] == "ada@campfire.test"
