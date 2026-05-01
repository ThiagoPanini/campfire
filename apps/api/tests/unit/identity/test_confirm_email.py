from datetime import timedelta

import pytest

from campfire_api.contexts.identity.application.errors import (
    ConfirmationAttemptsExceeded,
    ConfirmationCodeExpired,
    ConfirmationCodeInvalid,
)
from campfire_api.contexts.identity.application.use_cases.confirm_email import ConfirmEmail
from campfire_api.contexts.identity.domain.entities import Credentials, EmailConfirmation, User
from campfire_api.contexts.identity.domain.value_objects import (
    ConfirmationCode,
    DisplayName,
    Email,
    HashedPassword,
    UserId,
)
from tests.unit.identity.fakes import (
    FakeConfirmationCodeHasher,
    FakeCredentials,
    FakeEmailConfirmationRepository,
    FakeRefreshTokens,
    FakeSessions,
    FakeTokenIssuer,
    FakeUsers,
    FrozenClock,
)

pytestmark = pytest.mark.unit


async def make_case():
    clock = FrozenClock()
    users = FakeUsers()
    credentials = FakeCredentials()
    confirmations = FakeEmailConfirmationRepository(clock)
    hasher = FakeConfirmationCodeHasher()
    user = User(
        id=UserId.new(),
        email=Email("ada@campfire.test"),
        display_name=DisplayName("Ada"),
        created_at=clock.now(),
        updated_at=clock.now(),
        email_confirmed_at=None,
    )
    await users.add(user)
    await credentials.add(
        Credentials(user.id, HashedPassword("hash:Campfire123!"), clock.now(), clock.now())
    )
    confirmation = EmailConfirmation(
        id=UserId.new(),
        user_id=user.id,
        email=user.email,
        code_hash=hasher.hash(ConfirmationCode("123456")),
        created_at=clock.now(),
        expires_at=clock.now() + timedelta(minutes=15),
    )
    await confirmations.add(confirmation)
    use_case = ConfirmEmail(
        users,
        credentials,
        confirmations,
        FakeSessions(),
        FakeRefreshTokens(),
        hasher,
        FakeTokenIssuer(clock),
        clock,
        900,
        5,
    )
    return clock, users, confirmations, confirmation, use_case


async def test_confirm_email_success_sets_confirmed_and_issues_session() -> None:
    _clock, users, _confirmations, confirmation, use_case = await make_case()
    issued = await use_case("ada@campfire.test", "123456")
    user = await users.get_by_id(confirmation.user_id)
    assert issued.access_token.startswith("access-")
    assert user.email_confirmed_at is not None
    assert confirmation.status == "verified"


async def test_confirm_email_wrong_code_increments_attempts() -> None:
    _clock, _users, _confirmations, confirmation, use_case = await make_case()
    with pytest.raises(ConfirmationCodeInvalid):
        await use_case("ada@campfire.test", "000000")
    assert confirmation.attempt_count == 1


async def test_confirm_email_max_attempts_invalidates() -> None:
    _clock, _users, _confirmations, confirmation, use_case = await make_case()
    confirmation.attempt_count = 4
    with pytest.raises(ConfirmationAttemptsExceeded):
        await use_case("ada@campfire.test", "000000")
    assert confirmation.status == "invalidated"


async def test_confirm_email_expired_marks_expired() -> None:
    clock, _users, _confirmations, confirmation, use_case = await make_case()
    confirmation.expires_at = clock.now() - timedelta(seconds=1)
    with pytest.raises(ConfirmationCodeExpired):
        await use_case("ada@campfire.test", "123456")
    assert confirmation.status == "expired"


async def test_confirm_email_unknown_email_generic() -> None:
    *_rest, use_case = await make_case()
    with pytest.raises(ConfirmationCodeInvalid):
        await use_case("missing@campfire.test", "123456")
