import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from tests.integration.identity.helpers import login

pytestmark = pytest.mark.integration


async def test_preferences_happy_path(client) -> None:
    _response, headers = await login(client)
    payload = {
        "instruments": ["Guitar"],
        "genres": ["Rock"],
        "context": "friends",
        "goals": ["Track my full repertoire"],
        "experience": "intermediate",
    }
    response = await client.patch("/me/preferences", headers=headers, json=payload)
    assert response.status_code == 200
    assert response.json()["firstLogin"] is False


async def test_preferences_patch_persists_to_database(client, database_url: str) -> None:
    _response, headers = await login(client)
    payload = {
        "instruments": ["Bass"],
        "genres": ["Jazz"],
        "context": "sessions",
        "goals": ["Prepare for jam sessions"],
        "experience": "advanced",
    }

    response = await client.patch("/me/preferences", headers=headers, json=payload)
    assert response.status_code == 200

    engine = create_async_engine(database_url)
    try:
        async with engine.connect() as conn:
            row = (
                await conn.execute(
                    text(
                        """
                        SELECT p.instruments, p.genres, p.context, p.goals, p.experience
                        FROM users u
                        JOIN preferences p ON p.user_id = u.id
                        WHERE u.email = 'ada@campfire.test'
                        """
                    )
                )
            ).mappings().one()
    finally:
        await engine.dispose()

    assert dict(row) == payload


async def test_preferences_unknown_id_zero_change(client) -> None:
    _response, headers = await login(client)
    response = await client.patch(
        "/me/preferences", headers=headers, json={"instruments": ["Nope"]}
    )
    assert response.status_code == 422
    me = await client.get("/me", headers=headers)
    assert me.json()["preferences"]["instruments"] == ["Guitar", "Vocals"]


async def test_preferences_nullable_shapes(client) -> None:
    _response, headers = await login(client)
    response = await client.patch(
        "/me/preferences",
        headers=headers,
        json={"instruments": [], "genres": [], "context": None, "goals": [], "experience": None},
    )
    assert response.status_code == 200
    assert response.json()["preferences"]["context"] is None
