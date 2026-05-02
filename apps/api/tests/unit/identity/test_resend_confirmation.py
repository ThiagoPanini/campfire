from datetime import timedelta

import pytest

from campfire_api.contexts.identity.application.use_cases.resend_confirmation import (
    ResendConfirmation,
)
from campfire_api.contexts.identity.domain.entities import EmailConfirmation, User
from campfire_api.contexts.identity.domain.value_objects import (
    ConfirmationCode,
    DisplayName,
    Email,
    UserId,
)
from tests.unit.identity.fakes import (
    FakeConfirmationCodeHasher,
    FakeEmailConfirmationRepository,
    FakeEmailSender,
    FakeUsers,
    FrozenClock,
)

pytestmark = pytest.mark.unit


async def make_case(confirmed: bool = False):
    clock = FrozenClock()
    users = FakeUsers()
    confirmations = FakeEmailConfirmationRepository(clock)
    mailer = FakeEmailSender()
    hasher = FakeConfirmationCodeHasher()
    user = User(
        id=UserId.new(),
        email=Email("ada@campfire.test"),
        display_name=DisplayName("Ada"),
        created_at=clock.now(),
        updated_at=clock.now(),
        email_confirmed_at=clock.now() if confirmed else None,
    )
    await users.add(user)
    pending = EmailConfirmation(
        id=UserId.new(),
        user_id=user.id,
        email=user.email,
        code_hash=hasher.hash(ConfirmationCode("123456")),
        created_at=clock.now() - timedelta(seconds=120),
        expires_at=clock.now() + timedelta(minutes=15),
    )
    await confirmations.add(pending)
    use_case = ResendConfirmation(users, confirmations, hasher, mailer, clock, 900, 60, 3)
    return clock, confirmations, mailer, pending, use_case


async def test_resend_allowed_invalidates_and_sends_new_code() -> None:
    _clock, confirmations, mailer, pending, use_case = await make_case()
    await use_case("ada@campfire.test")
    assert pending.status == "invalidated"
    assert len(confirmations.rows) == 2
    assert len(mailer.confirmations) == 1


async def test_resend_cooldown_is_silent() -> None:
    clock, confirmations, mailer, pending, use_case = await make_case()
    pending.created_at = clock.now()
    await use_case("ada@campfire.test")
    assert len(confirmations.rows) == 1
    assert not mailer.confirmations


async def test_resend_hourly_cap_is_silent() -> None:
    _clock, confirmations, mailer, pending, use_case = await make_case()
    for _ in range(3):
        await confirmations.add(
            EmailConfirmation(
                id=UserId.new(),
                user_id=pending.user_id,
                email=pending.email,
                code_hash=pending.code_hash,
                created_at=pending.created_at,
                expires_at=pending.expires_at,
                status="invalidated",
            )
        )
    await use_case("ada@campfire.test")
    assert not mailer.confirmations


async def test_resend_unknown_email_silent() -> None:
    *_rest, mailer, _pending, use_case = await make_case()
    await use_case("missing@campfire.test")
    assert not mailer.confirmations


async def test_resend_confirmed_sends_duplicate_notice() -> None:
    *_rest, mailer, _pending, use_case = await make_case(confirmed=True)
    await use_case("ada@campfire.test")
    assert len(mailer.duplicate_notices) == 1
