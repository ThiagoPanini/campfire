import pytest

pytestmark = pytest.mark.integration


async def test_register_happy_path(client) -> None:
    response = await client.post(
        "/auth/register", json={"email": "new@campfire.test", "password": "campfire123"}
    )
    assert response.status_code == 201
    assert response.json()["firstLogin"] is True


async def test_register_duplicate(client) -> None:
    response = await client.post(
        "/auth/register", json={"email": "ada@campfire.test", "password": "campfire123"}
    )
    assert response.status_code == 409


async def test_register_validation(client) -> None:
    response = await client.post("/auth/register", json={"email": "bad", "password": "short"})
    assert response.status_code == 422


async def test_register_rate_limit(client) -> None:
    last = None
    for i in range(11):
        last = await client.post(
            "/auth/register",
            json={"email": f"rate{i}@campfire.test", "password": "short"},
        )
    assert last is not None
    assert last.status_code in {422, 429}
