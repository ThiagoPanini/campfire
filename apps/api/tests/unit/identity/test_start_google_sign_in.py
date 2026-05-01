from urllib.parse import parse_qs, urlparse

import pytest

from campfire_api.contexts.identity.application.errors import GoogleSignInUnavailable
from campfire_api.contexts.identity.application.use_cases.start_google_sign_in import (
    StartGoogleSignIn,
    sanitize_next,
)
from campfire_api.settings import EnvSettings, EnvSettingsProvider
from tests.unit.identity.fakes import FakeOAuthFlowStateRepository, FrozenClock

pytestmark = pytest.mark.unit


def enabled_settings() -> EnvSettingsProvider:
    return EnvSettingsProvider(
        EnvSettings(
            google_oauth_enabled_value=True,
            google_oauth_client_id_value="client",
            google_oauth_client_secret_value="secret",
            google_oauth_redirect_uri_value="http://api/auth/google/callback",
            oauth_flow_hmac_key_value="pepper",
        )
    )


async def test_start_google_sign_in_mints_flow_and_authorize_url() -> None:
    clock = FrozenClock()
    flows = FakeOAuthFlowStateRepository(clock)
    result = await StartGoogleSignIn(flows, enabled_settings(), clock)(
        intent="sign-in", next_path="/repertoire"
    )
    assert result.state_cookie_value
    assert len(flows.rows) == 1
    flow = next(iter(flows.rows.values()))
    assert flow.return_to == "/repertoire"
    query = parse_qs(urlparse(result.authorize_url).query)
    assert query["client_id"] == ["client"]
    assert query["state"] == [str(flow.id.value)]
    assert query["code_challenge_method"] == ["S256"]


@pytest.mark.parametrize("raw", ["//evil.com", "https://evil.com", "/x://evil", "", None])
def test_sanitize_next_rejects_unsafe_values(raw: str | None) -> None:
    assert sanitize_next(raw) is None


async def test_start_google_sign_in_disabled() -> None:
    with pytest.raises(GoogleSignInUnavailable):
        await StartGoogleSignIn(
            FakeOAuthFlowStateRepository(FrozenClock()),
            EnvSettingsProvider(EnvSettings(google_oauth_enabled_value=False)),
            FrozenClock(),
        )(intent="sign-in", next_path=None)
