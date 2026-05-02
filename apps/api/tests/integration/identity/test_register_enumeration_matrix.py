import pytest

pytestmark = pytest.mark.integration


async def test_register_enumeration_matrix(client) -> None:
    await client.post(
        "/auth/register",
        json={"email": "unconfirmed@campfire.test", "password": "Campfire123!"},
    )
    payloads = [
        {"email": "ada@campfire.test", "password": "AAAAAAAAAA1"},
        {"email": "unconfirmed@campfire.test", "password": "AAAAAAAAAA1"},
        {"email": "unknown@campfire.test", "password": "AAAAAAAAAA1"},
    ]

    responses = [await client.post("/auth/register", json=payload) for payload in payloads]
    first = responses[0]

    assert all(response.status_code == 400 for response in responses)
    assert all(response.content == first.content for response in responses)
    assert first.json() == {
        "status": "confirmation_required",
        "expiresInSeconds": None,
        "resendCooldownSeconds": None,
    }
