from dataclasses import dataclass
from datetime import timedelta

from campfire_api.contexts.identity.application.errors import (
    EmailAlreadyRegistered,
    InvalidRegistration,
)
from campfire_api.contexts.identity.application.use_cases.confirmation_codes import (
    generate_confirmation_code,
)
from campfire_api.contexts.identity.domain.entities import (
    Credentials,
    EmailConfirmation,
    User,
    display_name_from_email,
)
from campfire_api.contexts.identity.domain.ports import (
    Clock,
    ConfirmationCodeHasher,
    CredentialsRepository,
    EmailConfirmationRepository,
    EmailSender,
    PasswordHasher,
    UserRepository,
)
from campfire_api.contexts.identity.domain.value_objects import (
    Email,
    HashedPassword,
    Password,
    UserId,
)


@dataclass(frozen=True)
class RegistrationResult:
    user_id: UserId
    confirmation_id: UserId | None
    status: str = "confirmation_required"


@dataclass
class RegisterUser:
    users: UserRepository
    credentials: CredentialsRepository
    hasher: PasswordHasher
    clock: Clock
    confirmations: EmailConfirmationRepository | None = None
    code_hasher: ConfirmationCodeHasher | None = None
    email_sender: EmailSender | None = None
    confirmation_ttl_seconds: int = 900
    confirmation_required: bool = True

    async def __call__(
        self, email: str, password: str, locale: str = "en"
    ) -> RegistrationResult | User:
        normalized = Email(email)
        try:
            Password(password)
        except ValueError as exc:
            raise InvalidRegistration() from exc
        existing = await self.users.get_by_email(normalized)
        if self.confirmations is None or self.code_hasher is None or self.email_sender is None:
            if existing:
                raise EmailAlreadyRegistered()
            now = self.clock.now()
            user = User(
                id=UserId.new(),
                email=normalized,
                display_name=display_name_from_email(normalized),
                created_at=now,
                updated_at=now,
                email_confirmed_at=now,
            )
            password_hash = HashedPassword(await self.hasher.hash(password))
            await self.users.add(user)
            await self.credentials.add(
                Credentials.from_plaintext(user.id, password, password_hash, now)
            )
            return user

        if existing and existing.email_confirmed_at is not None:
            await self.email_sender.send_duplicate_signup_notice(normalized, locale)
            return RegistrationResult(user_id=existing.id, confirmation_id=None)
        now = self.clock.now()
        if existing and existing.email_confirmed_at is None:
            await self.confirmations.invalidate_pending_for(existing.id, reason="resent", now=now)
            code = generate_confirmation_code()
            confirmation = EmailConfirmation(
                id=UserId.new(),
                user_id=existing.id,
                email=existing.email,
                code_hash=self.code_hasher.hash(code),
                created_at=now,
                expires_at=now + timedelta(seconds=self.confirmation_ttl_seconds),
            )
            await self.confirmations.add(confirmation)
            await self.email_sender.send_confirmation_code(
                existing.email, code, locale, confirmation.expires_at
            )
            return RegistrationResult(user_id=existing.id, confirmation_id=confirmation.id)

        user = User(
            id=UserId.new(),
            email=normalized,
            display_name=display_name_from_email(normalized),
            created_at=now,
            updated_at=now,
            email_confirmed_at=None if self.confirmation_required else now,
        )
        password_hash = HashedPassword(await self.hasher.hash(password))
        await self.users.add(user)
        await self.credentials.add(
            Credentials.from_plaintext(user.id, password, password_hash, now)
        )
        if not self.confirmation_required:
            return RegistrationResult(user_id=user.id, confirmation_id=None, status="registered")
        code = generate_confirmation_code()
        confirmation = EmailConfirmation(
            id=UserId.new(),
            user_id=user.id,
            email=user.email,
            code_hash=self.code_hasher.hash(code),
            created_at=now,
            expires_at=now + timedelta(seconds=self.confirmation_ttl_seconds),
        )
        await self.confirmations.add(confirmation)
        await self.email_sender.send_confirmation_code(
            user.email, code, locale, confirmation.expires_at
        )
        return RegistrationResult(user_id=user.id, confirmation_id=confirmation.id)
