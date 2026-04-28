from dataclasses import dataclass

from campfire_api.contexts.identity.domain.ports import (
    Clock,
    RefreshTokenRepository,
    SessionRepository,
)


@dataclass
class RevokeSession:
    sessions: SessionRepository
    refresh_tokens: RefreshTokenRepository
    clock: Clock

    async def __call__(self, session_id: object, family_id: object) -> None:
        now = self.clock.now()
        await self.sessions.revoke(session_id, "signed_out", now)
        await self.refresh_tokens.revoke_family(family_id, "signed_out", now)
