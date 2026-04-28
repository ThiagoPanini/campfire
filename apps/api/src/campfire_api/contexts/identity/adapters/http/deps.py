from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import UTC

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.clock.system_clock import SystemClock
from campfire_api.contexts.identity.adapters.persistence.credentials_repository import (
    SqlAlchemyCredentialsRepository,
)
from campfire_api.contexts.identity.adapters.persistence.refresh_token_repository import (
    SqlAlchemyRefreshTokenRepository,
)
from campfire_api.contexts.identity.adapters.persistence.session_repository import (
    SqlAlchemySessionRepository,
)
from campfire_api.contexts.identity.adapters.persistence.unit_of_work import session_scope
from campfire_api.contexts.identity.adapters.persistence.user_repository import (
    SqlAlchemyUserRepository,
)
from campfire_api.contexts.identity.adapters.rate_limiting.in_memory_limiter import (
    InMemoryRateLimiter,
)
from campfire_api.contexts.identity.adapters.security.argon2_hasher import Argon2PasswordHasher
from campfire_api.contexts.identity.adapters.security.opaque_token_issuer import OpaqueTokenIssuer
from campfire_api.contexts.identity.application.errors import (
    InvalidCredentials,
    SessionRevokedError,
)
from campfire_api.settings import SettingsProvider

bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthContext:
    user_id: object
    session_id: object
    family_id: object


async def get_settings(request: Request) -> SettingsProvider:
    return request.app.state.settings_provider


async def get_db_session(
    settings: SettingsProvider = Depends(get_settings),
) -> AsyncIterator[AsyncSession]:
    async for session in session_scope(settings):
        yield session


async def ping_database(session: AsyncSession) -> None:
    await session.execute(text("SELECT 1"))


async def get_repositories(session: AsyncSession = Depends(get_db_session)):
    return {
        "users": SqlAlchemyUserRepository(session),
        "credentials": SqlAlchemyCredentialsRepository(session),
        "sessions": SqlAlchemySessionRepository(session),
        "refresh_tokens": SqlAlchemyRefreshTokenRepository(session),
    }


async def get_clock() -> SystemClock:
    return SystemClock()


async def get_hasher() -> Argon2PasswordHasher:
    return Argon2PasswordHasher()


async def get_token_issuer(
    settings: SettingsProvider = Depends(get_settings),
    clock: SystemClock = Depends(get_clock),
) -> OpaqueTokenIssuer:
    return OpaqueTokenIssuer(settings, clock)


async def get_rate_limiter(
    request: Request, settings: SettingsProvider = Depends(get_settings)
) -> InMemoryRateLimiter:
    if not hasattr(request.app.state, "identity_rate_limiter"):
        request.app.state.identity_rate_limiter = InMemoryRateLimiter(
            SystemClock(),
            await settings.rate_limit_per_window(),
            await settings.rate_limit_window_seconds(),
        )
    return request.app.state.identity_rate_limiter


async def get_current_session(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    repos=Depends(get_repositories),
    token_issuer: OpaqueTokenIssuer = Depends(get_token_issuer),
    clock: SystemClock = Depends(get_clock),
) -> AuthContext:
    if credentials is None:
        raise InvalidCredentials()
    session = await repos["sessions"].get_by_access_fingerprint(
        token_issuer.fingerprint(credentials.credentials)
    )
    if not session:
        raise InvalidCredentials()
    now = clock.now()
    expires_at = session.access_token_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if session.revoked_at is not None or expires_at <= now:
        raise SessionRevokedError()
    return AuthContext(session.user_id, session.id, session.family_id)


async def optional_current_session(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    repos=Depends(get_repositories),
    token_issuer: OpaqueTokenIssuer = Depends(get_token_issuer),
    clock: SystemClock = Depends(get_clock),
) -> AuthContext | None:
    if credentials is None:
        return None
    try:
        return await get_current_session(credentials, repos, token_issuer, clock)
    except Exception:
        return None


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def bad_request(message: str) -> HTTPException:
    return HTTPException(status_code=401, detail={"message": message})
