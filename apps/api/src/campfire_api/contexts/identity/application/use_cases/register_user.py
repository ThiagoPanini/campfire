from dataclasses import dataclass

from campfire_api.contexts.identity.application.errors import EmailAlreadyRegistered
from campfire_api.contexts.identity.domain.entities import (
    Credentials,
    PreferencesProfile,
    User,
    display_name_from_email,
)
from campfire_api.contexts.identity.domain.ports import (
    Clock,
    CredentialsRepository,
    PasswordHasher,
    PreferencesRepository,
    UserRepository,
)
from campfire_api.contexts.identity.domain.value_objects import Email, HashedPassword, UserId


@dataclass
class RegisterUser:
    users: UserRepository
    credentials: CredentialsRepository
    preferences: PreferencesRepository
    hasher: PasswordHasher
    clock: Clock

    async def __call__(self, email: str, password: str) -> User:
        normalized = Email(email)
        if await self.users.get_by_email(normalized):
            raise EmailAlreadyRegistered()
        if len(password) < 8:
            raise ValueError("password must be at least 8 characters")
        now = self.clock.now()
        user = User(
            id=UserId.new(),
            email=normalized,
            display_name=display_name_from_email(normalized),
            first_login=True,
            created_at=now,
            updated_at=now,
        )
        password_hash = HashedPassword(await self.hasher.hash(password))
        await self.users.add(user)
        await self.credentials.add(
            Credentials.from_plaintext(user.id, password, password_hash, now)
        )
        await self.preferences.add(PreferencesProfile(user_id=user.id, updated_at=now))
        return user
