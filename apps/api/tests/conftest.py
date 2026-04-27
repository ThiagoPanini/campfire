import os
import subprocess
from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from testcontainers.postgres import PostgresContainer

from campfire_api.contexts.identity.adapters.persistence.engine import dispose_engine
from campfire_api.main import create_app
from campfire_api.settings import get_settings_provider

COMPOSE_TEST_DATABASE_URL = "postgresql+asyncpg://campfire:campfire@localhost:5432/campfire_test"
ADA_ID = "018f0000-0000-7000-8000-000000000001"
ADA_HASH = (
    "$argon2id$v=19$m=19456,t=2,p=1$WO8c3zdKufpGYC/woOXNPg"
    "$+MEKvl/kFcr1xURYss4uqLegvP9LWwfeUP0KZw0XMaM"
)


@pytest.fixture(scope="session")
def database_url() -> str:
    if os.getenv("SKIP_DB_TESTS") == "1":
        pytest.skip("SKIP_DB_TESTS=1")
    if os.getenv("TEST_BACKEND") == "compose":
        yield os.getenv("TEST_DATABASE_URL", COMPOSE_TEST_DATABASE_URL)
        return
    try:
        with PostgresContainer("postgres:16-alpine") as postgres:
            yield postgres.get_connection_url().replace(
                "postgresql+psycopg2://", "postgresql+asyncpg://"
            )
    except Exception as exc:
        pytest.skip(f"Postgres test container unavailable: {exc}")


@pytest.fixture(scope="session")
def migrated_test_database(database_url: str) -> None:
    env = {**os.environ, "DATABASE_URL": database_url}
    result = subprocess.run(
        ["uv", "run", "alembic", "upgrade", "head"],
        cwd=os.getcwd(),
        env=env,
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        pytest.skip(f"Postgres test database unavailable: {result.stderr or result.stdout}")


@pytest.fixture
async def reset_db(database_url: str) -> AsyncIterator[None]:
    engine = create_async_engine(database_url)
    async with engine.begin() as conn:
        await conn.execute(
            text(
                "TRUNCATE refresh_tokens, sessions, preferences, credentials, users "
                "RESTART IDENTITY CASCADE"
            )
        )
        await conn.execute(
            text(
                """
                INSERT INTO users (id, email, display_name, first_login)
                VALUES (:id, 'ada@campfire.test', 'Ada', false)
                """
            ),
            {"id": ADA_ID},
        )
        await conn.execute(
            text("INSERT INTO credentials (user_id, password_hash) VALUES (:id, :password_hash)"),
            {"id": ADA_ID, "password_hash": ADA_HASH},
        )
        await conn.execute(
            text(
                """
                INSERT INTO preferences (user_id, instruments, genres, context, goals, experience)
                VALUES (
                  :id,
                  '["Guitar","Vocals"]'::jsonb,
                  '["Rock","MPB","Bossa Nova"]'::jsonb,
                  'friends',
                  '["Track my full repertoire","Share my set with the group"]'::jsonb,
                  'intermediate'
                )
                """
            ),
            {"id": ADA_ID},
        )
    await engine.dispose()
    yield


@pytest.fixture
async def client(
    monkeypatch: pytest.MonkeyPatch, migrated_test_database, reset_db, database_url: str
) -> AsyncIterator[AsyncClient]:
    await dispose_engine()
    monkeypatch.setenv("DATABASE_URL", database_url)
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")
    get_settings_provider.cache_clear()
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        yield ac
    await dispose_engine()
    get_settings_provider.cache_clear()
