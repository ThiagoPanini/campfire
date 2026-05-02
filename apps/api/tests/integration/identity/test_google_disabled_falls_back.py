import pytest

pytestmark = pytest.mark.integration


async def test_google_disabled_reports_config_and_password_login_still_works(client) -> None:
    config = await client.get("/auth/config")
    assert config.status_code == 200
    assert config.json()["google"]["enabled"] is False

    start = await client.post("/auth/google/start", json={"intent": "sign-in"})
    assert start.status_code == 503

    login = await client.post(
        "/auth/login",
        json={"email": "ada@campfire.test", "password": "campfire123"},
    )
    assert login.status_code == 200
    assert login.json()["accessToken"]
