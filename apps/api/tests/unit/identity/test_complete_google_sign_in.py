from datetime import timedelta

import pytest

from campfire_api.contexts.identity.application.errors import GoogleSignInFailed
from campfire_api.contexts.identity.application.use_cases.complete_google_sign_in import (
    CompleteGoogleSignIn,
)
from campfire_api.contexts.identity.application.use_cases.start_google_sign_in import (
    StartGoogleSignIn,
)
from campfire_api.contexts.identity.domain.entities import GoogleIdentity
from campfire_api.contexts.identity.domain.value_objects import DisplayName, Email, ProviderSubject
from campfire_api.settings import EnvSettings, EnvSettingsProvider
from tests.unit.identity.fakes import (
    FakeEmailConfirmationRepository,
    FakeGoogleIdentityProvider,
    FakeOAuthFlowStateRepository,
    FakeProviderLinkRepository,
    FakeRefreshTokens,
    FakeSessions,
    FakeTokenIssuer,
    FakeUsers,
    FrozenClock,
)

pytestmark = pytest.mark.unit


def settings() -> EnvSettingsProvider:
    return EnvSettingsProvider(
        EnvSettings(
            google_oauth_enabled_value=True,
            google_oauth_client_id_value="client",
            google_oauth_client_secret_value="secret",
            google_oauth_redirect_uri_value="http://api/auth/google/callback",
            oauth_flow_hmac_key_value="pepper",
        )
    )


async def prepare_flow():
    clock = FrozenClock()
    flows = FakeOAuthFlowStateRepository(clock)
    started = await StartGoogleSignIn(flows, settings(), clock)(intent="sign-in", next_path="/home")
    flow = next(iter(flows.rows.values()))
    nonce = flow.nonce_hash
    return clock, flows, started, flow, nonce


async def test_complete_google_sign_in_success_creates_user_and_session() -> None:
    clock, flows, started, flow, _nonce_hash = await prepare_flow()
    nonce = flow.nonce_hash
    # Reuse start helper internals indirectly: valid nonce is encoded in authorize URL, so here
    # use impossible direct match by copying the original nonce hash into identity via patched hmac.
    from campfire_api.contexts.identity.application.use_cases import start_google_sign_in as start

    identity = GoogleIdentity(
        subject=ProviderSubject("google-sub"),
        email=Email("ada@campfire.test"),
        display_name=DisplayName("Ada"),
        nonce="nonce",
        email_verified=True,
    )
    _flow_id, state_secret = started.state_cookie_value.split(".", 1)
    flow.state_token_hash = start._hmac("pepper", state_secret)
    flow.nonce_hash = start._hmac("pepper", "nonce")
    users = FakeUsers()
    sessions, refresh = FakeSessions(), FakeRefreshTokens()
    completed = await CompleteGoogleSignIn(
        flows,
        FakeProviderLinkRepository(),
        FakeEmailConfirmationRepository(clock),
        users,
        FakeGoogleIdentityProvider(identity),
        sessions,
        refresh,
        FakeTokenIssuer(clock),
        settings(),
        clock,
    )(code="abc", query_state=str(flow.id.value), state_cookie=started.state_cookie_value)
    assert completed.return_to == "/home"
    assert completed.session.access_token.startswith("access-")
    assert await users.get_by_email(Email("ada@campfire.test"))
    assert len(sessions.rows) == 1
    assert nonce is not None


async def test_complete_google_sign_in_rejects_state_mismatch() -> None:
    clock, flows, started, _flow, _nonce_hash = await prepare_flow()
    with pytest.raises(GoogleSignInFailed):
        await CompleteGoogleSignIn(
            flows,
            FakeProviderLinkRepository(),
            FakeEmailConfirmationRepository(clock),
            FakeUsers(),
            FakeGoogleIdentityProvider(),
            FakeSessions(),
            FakeRefreshTokens(),
            FakeTokenIssuer(clock),
            settings(),
            clock,
        )(code="abc", query_state="wrong", state_cookie=started.state_cookie_value)


async def test_complete_google_sign_in_rejects_expired_flow() -> None:
    clock, flows, started, flow, _nonce_hash = await prepare_flow()
    flow.expires_at = clock.now() - timedelta(seconds=1)
    with pytest.raises(GoogleSignInFailed):
        await CompleteGoogleSignIn(
            flows,
            FakeProviderLinkRepository(),
            FakeEmailConfirmationRepository(clock),
            FakeUsers(),
            FakeGoogleIdentityProvider(),
            FakeSessions(),
            FakeRefreshTokens(),
            FakeTokenIssuer(clock),
            settings(),
            clock,
        )(code="abc", query_state=str(flow.id.value), state_cookie=started.state_cookie_value)
