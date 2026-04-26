import hashlib
import secrets
from datetime import timedelta

from campfire_api.contexts.identity.domain.ports import Clock
from campfire_api.settings import SettingsProvider


class OpaqueTokenIssuer:
    def __init__(self, settings: SettingsProvider, clock: Clock) -> None:
        self.settings = settings
        self.clock = clock

    async def issue_access_token(self) -> tuple[str, bytes, object]:
        token = secrets.token_urlsafe(32)
        expires_at = self.clock.now() + timedelta(
            seconds=await self.settings.access_token_ttl_seconds()
        )
        return token, self.fingerprint(token), expires_at

    async def issue_refresh_token(self) -> tuple[str, bytes, object]:
        token = secrets.token_urlsafe(48)
        expires_at = self.clock.now() + timedelta(
            seconds=await self.settings.refresh_token_ttl_seconds()
        )
        return token, self.fingerprint(token), expires_at

    def fingerprint(self, token: str) -> bytes:
        return hashlib.sha256(token.encode("utf-8")).digest()
