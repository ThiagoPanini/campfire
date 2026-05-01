from dataclasses import dataclass

from campfire_api.contexts.identity.application.errors import (
    ConfirmationAttemptsExceeded,
    ConfirmationCodeExpired,
    ConfirmationCodeInvalid,
)
from campfire_api.contexts.identity.application.use_cases.issue_session import IssueSession
from campfire_api.contexts.identity.application.use_cases.session_tokens import IssuedSession
from campfire_api.contexts.identity.domain.ports import (
    Clock,
    ConfirmationCodeHasher,
    CredentialsRepository,
    EmailConfirmationRepository,
    RefreshTokenRepository,
    SessionRepository,
    TokenIssuer,
    UserRepository,
)
from campfire_api.contexts.identity.domain.value_objects import ConfirmationCode, Email


@dataclass
class ConfirmEmail:
    users: UserRepository
    credentials: CredentialsRepository
    confirmations: EmailConfirmationRepository
    sessions: SessionRepository
    refresh_tokens: RefreshTokenRepository
    hasher: ConfirmationCodeHasher
    token_issuer: TokenIssuer
    clock: Clock
    access_ttl_seconds: int
    max_attempts: int

    async def __call__(self, email: str, code: str) -> IssuedSession:
        user = await self.users.get_by_email(Email(email))
        if user is None:
            raise ConfirmationCodeInvalid()
        confirmation = await self.confirmations.get_pending_for_user(user.id)
        if confirmation is None:
            raise ConfirmationCodeInvalid()

        now = self.clock.now()
        if confirmation.expires_at <= now:
            confirmation.expire()
            await self.confirmations.update(confirmation)
            raise ConfirmationCodeExpired()

        parsed = ConfirmationCode(code)
        if not self.hasher.verify(parsed, confirmation.code_hash):
            confirmation.increment_attempts(self.max_attempts)
            await self.confirmations.update(confirmation)
            if confirmation.status == "invalidated":
                raise ConfirmationAttemptsExceeded()
            raise ConfirmationCodeInvalid()

        confirmation.verify(now)
        await self.confirmations.update(confirmation)
        user.email_confirmed_at = now
        user.updated_at = now
        await self.users.update(user)
        return await IssueSession(
            sessions=self.sessions,
            refresh_tokens=self.refresh_tokens,
            token_issuer=self.token_issuer,
            clock=self.clock,
            access_ttl_seconds=self.access_ttl_seconds,
        )(user.id)
