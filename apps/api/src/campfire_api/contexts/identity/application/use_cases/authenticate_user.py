from dataclasses import dataclass

from campfire_api.contexts.identity.application.errors import InvalidCredentials
from campfire_api.contexts.identity.application.use_cases.issue_session import IssueSession
from campfire_api.contexts.identity.application.use_cases.session_tokens import IssuedSession
from campfire_api.contexts.identity.domain.ports import (
    Clock,
    CredentialsRepository,
    PasswordHasher,
    RefreshTokenRepository,
    SessionRepository,
    TokenIssuer,
    UserRepository,
)
from campfire_api.contexts.identity.domain.value_objects import Email


@dataclass(frozen=True)
class UnconfirmedAccount:
    user_id: object


@dataclass
class AuthenticateUser:
    users: UserRepository
    credentials: CredentialsRepository
    sessions: SessionRepository
    refresh_tokens: RefreshTokenRepository
    hasher: PasswordHasher
    token_issuer: TokenIssuer
    clock: Clock
    access_ttl_seconds: int

    async def __call__(self, email: str, password: str) -> IssuedSession | UnconfirmedAccount:
        user = await self.users.get_by_email(Email(email))
        if not user:
            raise InvalidCredentials()
        credentials = await self.credentials.get_by_user_id(user.id)
        if not credentials or not await self.hasher.verify(
            password, credentials.password_hash.value
        ):
            raise InvalidCredentials()
        if user.email_confirmed_at is None:
            return UnconfirmedAccount(user.id)
        return await IssueSession(
            sessions=self.sessions,
            refresh_tokens=self.refresh_tokens,
            token_issuer=self.token_issuer,
            clock=self.clock,
            access_ttl_seconds=self.access_ttl_seconds,
        )(user.id)
