import pytest

pytestmark = pytest.mark.integration


async def test_auth_config_returns_nested_password_signup(client) -> None:
    response = await client.get("/auth/config")

    assert response.status_code == 200
    assert response.json() == {
        "google": {"enabled": False},
        "passwordSignUp": {"enabled": True, "requiresEmailConfirmation": True},
    }
