import pytest

from tests.integration.identity.helpers import login

pytestmark = pytest.mark.integration


async def test_logout_revokes_session_and_is_idempotent(client) -> None:
    _response, headers = await login(client)
    first = await client.post("/auth/logout", headers=headers)
    assert first.status_code == 204
    assert (await client.get("/me", headers=headers)).status_code == 401
    assert (await client.post("/auth/refresh", headers=headers)).status_code == 401
    second = await client.post("/auth/logout", headers=headers)
    assert second.status_code == 204
