import pytest

from tests.integration.identity.helpers import login

pytestmark = pytest.mark.integration


async def test_me_returns_identity_fields(client) -> None:
    _response, headers = await login(client)
    me = await client.get("/me", headers=headers)
    assert me.status_code == 200
    body = me.json()
    assert body["email"] == "ada@campfire.test"
    assert body["displayName"] == "Ada"
    assert "preferences" not in body
    assert "firstLogin" not in body


async def test_me_without_or_malformed_bearer(client) -> None:
    assert (await client.get("/me")).status_code == 401
    assert (await client.get("/me", headers={"Authorization": "Bearer nope"})).status_code == 401
