import pytest

from tests.integration.identity.helpers import login

pytestmark = pytest.mark.integration


async def test_documented_endpoints_do_not_leak_secrets(client, caplog) -> None:
    login_response, headers = await login(client)
    access = login_response.json()["accessToken"]
    refresh = client.cookies.get("campfire_refresh") or ""
    token_responses = [
        login_response,
        await client.post("/auth/refresh", headers=headers),
        await client.post("/auth/google-stub", json={"intent": "sign-in"}),
    ]
    non_token_responses = [
        await client.post(
            "/auth/register", json={"email": "new@campfire.test", "password": "campfire123"}
        ),
        await client.get("/me", headers={"Authorization": f"Bearer {access}"}),
        await client.patch(
            "/me/preferences", headers=headers, json={"instruments": [], "genres": [], "goals": []}
        ),
        await client.get("/healthz"),
        await client.get("/readyz"),
        await client.post("/auth/logout", headers=headers),
    ]
    all_responses = token_responses + non_token_responses
    all_response_bodies = "\n".join(response.text for response in all_responses)
    non_token_haystack = "\n".join(response.text for response in non_token_responses) + "\n".join(
        record.getMessage() for record in caplog.records
    )
    assert "campfire123" not in all_response_bodies
    assert "$argon2id$" not in all_response_bodies
    assert access not in non_token_haystack
    if refresh:
        assert refresh not in non_token_haystack
