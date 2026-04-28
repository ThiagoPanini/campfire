from dataclasses import dataclass

from campfire_api.contexts.identity.application.errors import (
    RefreshTokenInvalid,
    RefreshTokenReused,
)
from campfire_api.contexts.identity.application.use_cases.session_tokens import IssuedSession
from campfire_api.contexts.identity.domain.entities import RefreshToken, Session
from campfire_api.contexts.identity.domain.ports import (
    Clock,
    RefreshTokenRepository,
    SessionRepository,
    TokenIssuer,
)
from campfire_api.contexts.identity.domain.value_objects import RefreshTokenId, SessionId


@dataclass
class RefreshSession:
    sessions: SessionRepository
    refresh_tokens: RefreshTokenRepository
    token_issuer: TokenIssuer
    clock: Clock
    access_ttl_seconds: int

    async def __call__(self, refresh_token: str) -> IssuedSession:
        now = self.clock.now()
        existing = await self.refresh_tokens.get_by_fingerprint(
            self.token_issuer.fingerprint(refresh_token)
        )
        if not existing:
            raise RefreshTokenInvalid()
        consumed = await self.refresh_tokens.consume_atomic(existing.id, now)
        if not consumed:
            await self.sessions.revoke_family(existing.family_id, "reuse_detected", now)
            await self.refresh_tokens.revoke_family(existing.family_id, "reuse_detected", now)
            raise RefreshTokenReused()
        if consumed.revoked_at is not None or consumed.expires_at <= now:
            raise RefreshTokenInvalid()
        await self.sessions.revoke(consumed.session_id, "refreshed", now)
        access, access_fingerprint, access_expires = await self.token_issuer.issue_access_token()
        (
            refresh,
            refresh_fingerprint,
            refresh_expires,
        ) = await self.token_issuer.issue_refresh_token()
        session_id = SessionId.new()
        await self.sessions.add(
            Session(
                id=session_id,
                user_id=consumed.user_id,
                family_id=consumed.family_id,
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
                family_id=consumed.family_id,
                user_id=consumed.user_id,
                token_fingerprint=refresh_fingerprint,
                issued_at=now,
                expires_at=refresh_expires,
            )
        )
        return IssuedSession(access, refresh, self.access_ttl_seconds)
