from campfire_api.contexts.identity.application.use_cases.complete_google_sign_in import (
    CompleteGoogleSignIn,
)
from campfire_api.contexts.identity.application.use_cases.start_google_sign_in import (
    StartGoogleSignIn,
)
from campfire_api.contexts.identity.domain.entities import GoogleIdentity, ProviderLink, User
from campfire_api.contexts.identity.domain.value_objects import (
    DisplayName,
    Email,
    ProviderSubject,
    UserId,
)
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


async def complete(identity: GoogleIdentity, users: FakeUsers, links: FakeProviderLinkRepository):
    from campfire_api.contexts.identity.application.use_cases import start_google_sign_in as start

    clock = FrozenClock()
    flows = FakeOAuthFlowStateRepository(clock)
    started = await StartGoogleSignIn(flows, settings(), clock)(intent="sign-in", next_path=None)
    flow = next(iter(flows.rows.values()))
    _flow_id, state_secret = started.state_cookie_value.split(".", 1)
    flow.state_token_hash = start._hmac("pepper", state_secret)
    flow.nonce_hash = start._hmac("pepper", identity.nonce)
    confirmations = FakeEmailConfirmationRepository(clock)
    result = await CompleteGoogleSignIn(
        flows,
        links,
        confirmations,
        users,
        FakeGoogleIdentityProvider(identity),
        FakeSessions(),
        FakeRefreshTokens(),
        FakeTokenIssuer(clock),
        settings(),
        clock,
    )(code="abc", query_state=str(flow.id.value), state_cookie=started.state_cookie_value)
    return result, confirmations


def identity(subject: str = "sub", email: str = "ada@campfire.test") -> GoogleIdentity:
    return GoogleIdentity(
        subject=ProviderSubject(subject),
        email=Email(email),
        display_name=DisplayName("Ada"),
        nonce="nonce",
        email_verified=True,
    )


async def test_hit_by_subject_uses_linked_user() -> None:
    clock = FrozenClock()
    users, links = FakeUsers(), FakeProviderLinkRepository()
    user = User(
        UserId.new(),
        Email("linked@campfire.test"),
        DisplayName("Ada"),
        clock.now(),
        clock.now(),
        clock.now(),
    )
    await users.add(user)
    await links.add(
        ProviderLink(
            UserId.new(),
            user.id,
            "google",
            ProviderSubject("sub"),
            user.email,
            clock.now(),
            clock.now(),
        )
    )
    await complete(identity(subject="sub", email="other@campfire.test"), users, links)
    assert len(links.rows) == 1


async def test_miss_subject_hit_confirmed_email_adds_link() -> None:
    clock = FrozenClock()
    users, links = FakeUsers(), FakeProviderLinkRepository()
    user = User(
        UserId.new(),
        Email("ada@campfire.test"),
        DisplayName("Ada"),
        clock.now(),
        clock.now(),
        clock.now(),
    )
    await users.add(user)
    await complete(identity(subject="new-sub"), users, links)
    assert links.rows[0].user_id == user.id


async def test_miss_subject_hit_unconfirmed_email_confirms_user() -> None:
    clock = FrozenClock()
    users, links = FakeUsers(), FakeProviderLinkRepository()
    user = User(
        UserId.new(),
        Email("ada@campfire.test"),
        DisplayName("Ada"),
        clock.now(),
        clock.now(),
        None,
    )
    await users.add(user)
    _result, confirmations = await complete(identity(subject="new-sub"), users, links)
    assert user.email_confirmed_at is not None
    assert links.rows[0].user_id == user.id
    assert confirmations.rows == []


async def test_miss_subject_miss_email_creates_user_and_link() -> None:
    users, links = FakeUsers(), FakeProviderLinkRepository()
    await complete(identity(subject="new-sub", email="new@campfire.test"), users, links)
    assert await users.get_by_email(Email("new@campfire.test"))
    assert len(links.rows) == 1
