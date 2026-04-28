from dataclasses import dataclass

from campfire_api.contexts.identity.application.errors import InvalidCredentials
from campfire_api.contexts.identity.application.use_cases.session_tokens import IssuedSession
from campfire_api.contexts.identity.domain.entities import RefreshToken, Session
from campfire_api.contexts.identity.domain.ports import (
    Clock,
    CredentialsRepository,
    PasswordHasher,
    RefreshTokenRepository,
    SessionRepository,
    TokenIssuer,
    UserRepository,
)
from campfire_api.contexts.identity.domain.value_objects import (
    Email,
    RefreshTokenId,
    SessionFamilyId,
    SessionId,
)


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

    async def __call__(self, email: str, password: str) -> IssuedSession:
        user = await self.users.get_by_email(Email(email))
        if not user:
            raise InvalidCredentials()
        credentials = await self.credentials.get_by_user_id(user.id)
        if not credentials or not await self.hasher.verify(
            password, credentials.password_hash.value
        ):
            raise InvalidCredentials()
        return await self._open_session(user.id)

    async def _open_session(self, user_id) -> IssuedSession:
        now = self.clock.now()
        access, access_fingerprint, access_expires = await self.token_issuer.issue_access_token()
        (
            refresh,
            refresh_fingerprint,
            refresh_expires,
        ) = await self.token_issuer.issue_refresh_token()
        session_id = SessionId.new()
        family_id = SessionFamilyId(session_id.value)
        await self.sessions.add(
            Session(
                id=session_id,
                user_id=user_id,
                family_id=family_id,
                access_token_fingerprint=access_fingerprint,
                access_token_expires_at=access_expires,
                created_at=now,
                last_seen_at=now,
            )
        )
        await self.refresh_tokens.add(
            RefreshToken(
                id=RefreshTokenId.new(),
                session_id=session_id,
                family_id=family_id,
                user_id=user_id,
                token_fingerprint=refresh_fingerprint,
                issued_at=now,
                expires_at=refresh_expires,
            )
        )
        return IssuedSession(access, refresh, self.access_ttl_seconds)
