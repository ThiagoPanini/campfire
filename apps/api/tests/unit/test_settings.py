import pytest

from campfire_api.settings import EnvSettings, EnvSettingsProvider, normalize_database_url

pytestmark = pytest.mark.unit


def test_normalize_database_url_accepts_render_postgres_scheme() -> None:
    assert (
        normalize_database_url("postgresql://user:password@host:5432/campfire")
        == "postgresql+asyncpg://user:password@host:5432/campfire"
    )


def test_normalize_database_url_preserves_asyncpg_scheme() -> None:
    assert (
        normalize_database_url("postgresql+asyncpg://user:password@host:5432/campfire")
        == "postgresql+asyncpg://user:password@host:5432/campfire"
    )


async def test_env_settings_provider_returns_normalized_database_url() -> None:
    provider = EnvSettingsProvider(
        EnvSettings(DATABASE_URL="postgresql://user:password@host:5432/campfire")
    )

    assert (
        await provider.database_url()
        == "postgresql+asyncpg://user:password@host:5432/campfire"
    )
