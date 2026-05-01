import pytest

pytestmark = pytest.mark.integration


async def test_correct_password_for_unconfirmed_returns_confirmation_required(client) -> None:
    await client.post(
        "/auth/register",
        json={"email": "new@campfire.test", "password": "Campfire123!"},
    )
    response = await client.post(
        "/auth/login",
        json={"email": "new@campfire.test", "password": "Campfire123!"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "confirmation_required"
    assert isinstance(body.get("expiresInSeconds"), int)
    assert isinstance(body.get("resendCooldownSeconds"), int)
    assert "set-cookie" not in response.headers


async def test_wrong_password_for_unconfirmed_stays_generic(client) -> None:
    await client.post(
        "/auth/register",
        json={"email": "new@campfire.test", "password": "Campfire123!"},
    )
    wrong = await client.post(
        "/auth/login",
        json={"email": "new@campfire.test", "password": "wrong"},
    )
    missing = await client.post(
        "/auth/login",
        json={"email": "missing@campfire.test", "password": "wrong"},
    )
    assert wrong.status_code == missing.status_code == 401
    assert wrong.content == missing.content
