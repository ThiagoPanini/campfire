import pytest

pytestmark = pytest.mark.integration


async def test_google_stub_sign_in_returns_seeded_user(client) -> None:
    response = await client.post("/auth/google-stub", json={"intent": "sign-in"})
    assert response.status_code == 200
    me = await client.get(
        "/me", headers={"Authorization": f"Bearer {response.json()['accessToken']}"}
    )
    assert me.json()["email"] == "ada@campfire.test"


async def test_google_stub_sign_up_creates_managed_user_once(client) -> None:
    first = await client.post("/auth/google-stub", json={"intent": "sign-up"})
    second = await client.post("/auth/google-stub", json={"intent": "sign-up"})
    assert first.status_code == second.status_code == 200
    me = await client.get(
        "/me", headers={"Authorization": f"Bearer {second.json()['accessToken']}"}
    )
    assert me.json()["email"] == "google.member@campfire.test"
