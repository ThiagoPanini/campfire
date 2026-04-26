import pytest

from tests.integration.identity.helpers import login

pytestmark = pytest.mark.integration


async def test_preferences_ignores_body_user_id(client) -> None:
    _response, headers = await login(client)
    response = await client.patch(
        "/me/preferences",
        headers=headers,
        json={"userId": "someone-else", "instruments": ["Guitar"], "genres": [], "goals": []},
    )
    assert response.status_code == 200
    assert "someone-else" not in response.text
