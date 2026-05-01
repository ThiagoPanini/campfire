import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

pytestmark = pytest.mark.integration


async def test_invalid_login_cases_are_byte_identical(client, database_url) -> None:
    await client.post(
        "/auth/register",
        json={"email": "new@campfire.test", "password": "Campfire123!"},
    )
    engine = create_async_engine(database_url)
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                INSERT INTO users (id, email, display_name, email_confirmed_at)
                VALUES (
                    '018f0000-0000-7000-8000-000000000099',
                    'google-only@campfire.test',
                    'Google Only',
                    now()
                )
                """
            )
        )
    await engine.dispose()
    cases = [
        {"email": "ada@campfire.test", "password": "wrong"},
        {"email": "missing@campfire.test", "password": "wrong"},
        {"email": "google-only@campfire.test", "password": "wrong"},
        {"email": "new@campfire.test", "password": "wrong"},
    ]
    responses = [await client.post("/auth/login", json=payload) for payload in cases]
    first = responses[0]
    assert all(response.status_code == 401 for response in responses)
    assert all(response.content == first.content for response in responses)
    assert all(
        response.headers["content-type"] == first.headers["content-type"]
        for response in responses
    )
