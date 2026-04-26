import pytest

pytestmark = pytest.mark.integration


async def test_login_happy_path(client) -> None:
    response = await client.post(
        "/auth/login", json={"email": "ada@campfire.test", "password": "campfire123"}
    )
    assert response.status_code == 200
    assert response.json()["accessToken"]
    assert "campfire_refresh" in response.headers["set-cookie"]


async def test_login_bad_password_and_unknown_email_same_body(client) -> None:
    bad = await client.post("/auth/login", json={"email": "ada@campfire.test", "password": "wrong"})
    missing = await client.post(
        "/auth/login", json={"email": "missing@campfire.test", "password": "wrong"}
    )
    assert bad.status_code == missing.status_code == 401
    assert bad.json() == missing.json()


async def test_login_malformed_payload(client) -> None:
    response = await client.post("/auth/login", json={"email": "not-email"})
    assert response.status_code == 422


async def test_login_rate_limit(client) -> None:
    last = None
    for _ in range(11):
        last = await client.post(
            "/auth/login", json={"email": "ada@campfire.test", "password": "wrong"}
        )
    assert last is not None
    assert last.status_code == 429
    assert last.headers["retry-after"]
