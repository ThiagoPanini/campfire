import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

pytestmark = pytest.mark.integration


async def test_wrong_confirmation_attempts_invalidate(client, database_url) -> None:
    await client.post(
        "/auth/register",
        json={"email": "new@campfire.test", "password": "Campfire123!"},
    )
    bodies = []
    for _ in range(5):
        response = await client.post(
            "/auth/confirm",
            json={"email": "new@campfire.test", "code": "000000"},
        )
        bodies.append(response.content)
    assert len(set(bodies)) == 1

    engine = create_async_engine(database_url)
    async with engine.connect() as conn:
        row = (
            await conn.execute(
                text(
                    """
                    SELECT status, invalidated_reason, attempt_count
                    FROM email_confirmations
                    WHERE email = 'new@campfire.test'
                    """
                )
            )
        ).one()
    await engine.dispose()
    assert row.status == "invalidated"
    assert row.invalidated_reason == "attempts_exceeded"
    assert row.attempt_count == 5


async def test_resend_caps_are_silent(client) -> None:
    await client.post(
        "/auth/register",
        json={"email": "new@campfire.test", "password": "Campfire123!"},
    )
    first = await client.post("/auth/confirm/resend", json={"email": "new@campfire.test"})
    second = await client.post("/auth/confirm/resend", json={"email": "new@campfire.test"})
    assert first.status_code == second.status_code == 202
    assert first.content == second.content
