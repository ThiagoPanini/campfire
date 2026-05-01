import pytest

from campfire_api.contexts.identity.application.use_cases.register_user import RegisterUser
from tests.unit.identity.fakes import (
    FakeConfirmationCodeHasher,
    FakeCredentials,
    FakeEmailConfirmationRepository,
    FakeEmailSender,
    FakeHasher,
    FakeUsers,
    FrozenClock,
)

pytestmark = pytest.mark.unit


async def test_register_user_happy_path() -> None:
    users, credentials, clock = (FakeUsers(), FakeCredentials(), FrozenClock())
    confirmations = FakeEmailConfirmationRepository(clock)
    mailer = FakeEmailSender()
    result = await RegisterUser(
        users,
        credentials,
        FakeHasher(),
        clock,
        confirmations,
        FakeConfirmationCodeHasher(),
        mailer,
    )(
        "NEW@Campfire.test", "Campfire123!"
    )
    assert result.status == "confirmation_required"
    assert result.confirmation_id is not None
    assert len(confirmations.rows) == 1
    assert len(mailer.confirmations) == 1
    saved = await users.get_by_id(result.user_id)
    assert saved.email.value == "new@campfire.test"
    assert saved.email_confirmed_at is None
    assert await credentials.get_by_user_id(saved.id)


async def test_register_user_duplicate_email() -> None:
    users, credentials, clock = (FakeUsers(), FakeCredentials(), FrozenClock())
    confirmations = FakeEmailConfirmationRepository(clock)
    mailer = FakeEmailSender()
    use_case = RegisterUser(
        users,
        credentials,
        FakeHasher(),
        clock,
        confirmations,
        FakeConfirmationCodeHasher(),
        mailer,
    )
    await use_case("ada@campfire.test", "Campfire123!")
    again = await use_case("ADA@campfire.test", "Campfire123!")
    assert again.status == "confirmation_required"
    assert len(users.by_email) == 1
    assert len(confirmations.rows) == 2
    assert confirmations.rows[0].status == "invalidated"


async def test_register_user_short_password() -> None:
    with pytest.raises(ValueError):
        clock = FrozenClock()
        await RegisterUser(
            FakeUsers(),
            FakeCredentials(),
            FakeHasher(),
            clock,
            FakeEmailConfirmationRepository(clock),
            FakeConfirmationCodeHasher(),
            FakeEmailSender(),
        )(
            "ada@campfire.test", "short"
        )


async def test_register_existing_confirmed_sends_duplicate_notice() -> None:
    users, credentials, clock = (FakeUsers(), FakeCredentials(), FrozenClock())
    confirmations = FakeEmailConfirmationRepository(clock)
    mailer = FakeEmailSender()
    use_case = RegisterUser(
        users,
        credentials,
        FakeHasher(),
        clock,
        confirmations,
        FakeConfirmationCodeHasher(),
        mailer,
        confirmation_required=False,
    )
    await use_case("ada@campfire.test", "Campfire123!")
    result = await use_case("ada@campfire.test", "Campfire123!")
    assert result.status == "confirmation_required"
    assert len(mailer.duplicate_notices) == 1
    assert len(mailer.confirmations) == 0
