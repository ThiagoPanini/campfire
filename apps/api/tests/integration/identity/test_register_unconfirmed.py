import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

pytestmark = pytest.mark.integration


async def test_register_returns_confirmation_required_without_session(client, database_url) -> None:
    response = await client.post(
        "/auth/register",
        json={"email": "new@campfire.test", "password": "Campfire123!"},
    )
    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "confirmation_required"
    assert isinstance(body.get("expiresInSeconds"), int)
    assert "set-cookie" not in response.headers
    assert "accessToken" not in response.text

    engine = create_async_engine(database_url)
    async with engine.connect() as conn:
        row = (
            await conn.execute(
                text(
                    """
                    SELECT u.email_confirmed_at, c.status
                    FROM users u
                    JOIN email_confirmations c ON c.user_id = u.id
                    WHERE u.email = 'new@campfire.test'
                    """
                )
            )
        ).one()
    await engine.dispose()
    assert row.email_confirmed_at is None
    assert row.status == "pending"
