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


def test_normalize_database_url_accepts_postgres_shorthand() -> None:
    assert (
        normalize_database_url("postgres://user:password@host:5432/campfire")
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


async def test_refresh_cookie_defaults_secure_only_in_prod() -> None:
    dev_provider = EnvSettingsProvider(EnvSettings(ENV="dev", REFRESH_COOKIE_SECURE=None))
    prod_provider = EnvSettingsProvider(EnvSettings(ENV="prod", REFRESH_COOKIE_SECURE=None))

    assert await dev_provider.refresh_cookie_secure() is False
    assert await prod_provider.refresh_cookie_secure() is True
    assert await dev_provider.refresh_cookie_samesite() == "lax"


async def test_refresh_cookie_policy_can_be_configured_for_cross_origin_hosts() -> None:
    provider = EnvSettingsProvider(
        EnvSettings(REFRESH_COOKIE_SECURE=True, REFRESH_COOKIE_SAMESITE="None")
    )

    assert await provider.refresh_cookie_secure() is True
    assert await provider.refresh_cookie_samesite() == "none"


def test_refresh_cookie_samesite_rejects_invalid_values() -> None:
    with pytest.raises(ValueError, match="REFRESH_COOKIE_SAMESITE"):
        EnvSettings(REFRESH_COOKIE_SAMESITE="wide-open")


async def test_trusted_proxies_defaults_empty() -> None:
    provider = EnvSettingsProvider(EnvSettings())

    assert await provider.trusted_proxies() == ()


async def test_trusted_proxies_parse_comma_separated_ipv4_ipv6_and_cidr() -> None:
    provider = EnvSettingsProvider(
        EnvSettings(TRUSTED_PROXIES="127.0.0.1, 10.0.0.0/8, 2001:db8::/32")
    )

    assert [str(network) for network in await provider.trusted_proxies()] == [
        "127.0.0.1/32",
        "10.0.0.0/8",
        "2001:db8::/32",
    ]


def test_trusted_proxies_rejects_invalid_value() -> None:
    with pytest.raises(ValueError, match="TRUSTED_PROXIES"):
        EnvSettings(TRUSTED_PROXIES="not-a-network")
