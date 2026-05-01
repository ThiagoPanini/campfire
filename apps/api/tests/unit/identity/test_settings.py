import pytest

from campfire_api.settings import EnvSettings, EnvSettingsProvider

pytestmark = pytest.mark.unit


async def test_google_enabled_requires_flag_and_all_credentials() -> None:
    disabled = EnvSettingsProvider(
        EnvSettings(
            google_oauth_enabled_value=True,
            google_oauth_client_id_value=None,
            google_oauth_client_secret_value=None,
            google_oauth_redirect_uri_value=None,
            oauth_flow_hmac_key_value=None,
        )
    )
    assert await disabled.google_enabled() is False

    enabled = EnvSettingsProvider(
        EnvSettings(
            google_oauth_enabled_value=True,
            google_oauth_client_id_value="client",
            google_oauth_client_secret_value="secret",
            google_oauth_redirect_uri_value="http://api/auth/google/callback",
            oauth_flow_hmac_key_value="pepper",
        )
    )
    assert await enabled.google_enabled() is True
