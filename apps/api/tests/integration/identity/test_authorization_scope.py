import pytest

from tests.integration.identity.helpers import login

pytestmark = pytest.mark.integration


async def test_removed_preferences_endpoint_returns_404(client) -> None:
    _response, headers = await login(client)
    response = await client.patch(
        "/me/preferences",
        headers=headers,
        json={"instruments": ["Acoustic Guitar"], "genres": [], "goals": []},
    )
    assert response.status_code == 404
