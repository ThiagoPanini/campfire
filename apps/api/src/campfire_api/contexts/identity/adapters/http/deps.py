from dataclasses import dataclass
from datetime import UTC
from ipaddress import ip_address
from urllib.parse import urlsplit

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.clock.system_clock import SystemClock
from campfire_api.contexts.identity.adapters.messaging.console_email_sender import (
    ConsoleEmailSender,
)
from campfire_api.contexts.identity.adapters.messaging.http_email_sender import HttpEmailSender
from campfire_api.contexts.identity.adapters.persistence.credentials_repository import (
    SqlAlchemyCredentialsRepository,
)
from campfire_api.contexts.identity.adapters.persistence.email_confirmation_repository import (
    SqlAlchemyEmailConfirmationRepository,
)
from campfire_api.contexts.identity.adapters.persistence.oauth_flow_state_repository import (
    SqlAlchemyOAuthFlowStateRepository,
)
from campfire_api.contexts.identity.adapters.persistence.provider_link_repository import (
    SqlAlchemyProviderLinkRepository,
)
from campfire_api.contexts.identity.adapters.persistence.refresh_token_repository import (
    SqlAlchemyRefreshTokenRepository,
)
from campfire_api.contexts.identity.adapters.persistence.session_repository import (
    SqlAlchemySessionRepository,
)
from campfire_api.contexts.identity.adapters.persistence.user_repository import (
    SqlAlchemyUserRepository,
)
from campfire_api.contexts.identity.adapters.rate_limiting.in_memory_limiter import (
    InMemoryRateLimiter,
)
from campfire_api.contexts.identity.adapters.security.argon2_hasher import Argon2PasswordHasher
from campfire_api.contexts.identity.adapters.security.hmac_code_hasher import (
    HmacConfirmationCodeHasher,
)
from campfire_api.contexts.identity.adapters.security.opaque_token_issuer import OpaqueTokenIssuer
from campfire_api.contexts.identity.application.errors import (
    InvalidCredentials,
    OriginNotAllowed,
    SessionRevokedError,
)
from campfire_api.settings import SettingsProvider
from campfire_api.shared.persistence.deps import get_db_session, get_settings

bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthContext:
    user_id: object
    session_id: object
    family_id: object


async def ping_database(session: AsyncSession) -> None:
    await session.execute(text("SELECT 1"))


async def get_repositories(session: AsyncSession = Depends(get_db_session)):
    return {
        "_session": session,
        "users": SqlAlchemyUserRepository(session),
        "credentials": SqlAlchemyCredentialsRepository(session),
        "sessions": SqlAlchemySessionRepository(session),
        "refresh_tokens": SqlAlchemyRefreshTokenRepository(session),
        "provider_links": SqlAlchemyProviderLinkRepository(session),
        "email_confirmations": SqlAlchemyEmailConfirmationRepository(session),
        "oauth_flow_states": SqlAlchemyOAuthFlowStateRepository(session),
    }


async def get_clock() -> SystemClock:
    return SystemClock()


async def get_hasher() -> Argon2PasswordHasher:
    return Argon2PasswordHasher()


async def get_code_hasher(
    settings: SettingsProvider = Depends(get_settings),
) -> HmacConfirmationCodeHasher:
    key = await settings.email_confirmation_hmac_key()
    return HmacConfirmationCodeHasher(key or "dev-email-confirmation-key")


async def get_email_sender(settings: SettingsProvider = Depends(get_settings)):
    backend = (await settings.mail_backend()).lower()
    if backend == "http":
        url = await settings.mail_http_url()
        api_key = await settings.mail_http_api_key()
        from_email = await settings.mail_from()
        if not url or not api_key or not from_email:
            raise RuntimeError(
                "MAIL_BACKEND=http requires MAIL_HTTP_URL, MAIL_HTTP_API_KEY, MAIL_FROM"
            )
        return HttpEmailSender(url, api_key, from_email)
    return ConsoleEmailSender(await settings.mail_outbox_dir(), await settings.mail_from())


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


def _peer_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _origin_key(value: str) -> str:
    parsed = urlsplit(value)
    scheme = parsed.scheme.lower()
    hostname = (parsed.hostname or "").lower()
    port = parsed.port
    if not scheme or not hostname:
        return ""
    default_port = (scheme == "http" and port == 80) or (scheme == "https" and port == 443)
    return f"{scheme}://{hostname}" if port is None or default_port else f"{scheme}://{hostname}:{port}"


def client_ip(request: Request, settings: SettingsProvider) -> str:
    peer = _peer_ip(request)
    try:
        peer_address = ip_address(peer)
    except ValueError:
        return peer
    trusted = (
        tuple(settings.trusted_proxies_sync()) if hasattr(settings, "trusted_proxies_sync") else ()
    )
    if not trusted:
        return peer
    if not any(peer_address in network for network in trusted):
        return peer
    xff = request.headers.get("x-forwarded-for")
    if not xff:
        return peer
    hops = [hop.strip() for hop in xff.split(",") if hop.strip()]
    try:
        addresses = [ip_address(hop) for hop in hops]
    except ValueError:
        return peer
    for address in reversed([*addresses, peer_address]):
        if not any(address in network for network in trusted):
            return str(address)
    return peer


async def client_ip_async(request: Request, settings: SettingsProvider) -> str:
    peer = _peer_ip(request)
    try:
        peer_address = ip_address(peer)
    except ValueError:
        return peer
    trusted = tuple(await settings.trusted_proxies())
    if not trusted or not any(peer_address in network for network in trusted):
        return peer
    xff = request.headers.get("x-forwarded-for")
    if not xff:
        return peer
    hops = [hop.strip() for hop in xff.split(",") if hop.strip()]
    try:
        addresses = [ip_address(hop) for hop in hops]
    except ValueError:
        return peer
    for address in reversed([*addresses, peer_address]):
        if not any(address in network for network in trusted):
            return str(address)
    return peer


async def require_same_origin(
    request: Request, settings: SettingsProvider = Depends(get_settings)
) -> None:
    """Allow cookie-backed mutations only from configured origins.

    Browsers send Origin on unsafe cross-site POSTs. If it is absent, treat the
    request as a same-origin/non-browser call so local clients keep working while
    hostile browser origins fail closed.
    """
    allowed = {_origin_key(origin) for origin in await settings.cors_origins()}
    raw_origin = request.headers.get("origin")
    if not raw_origin:
        return
    origin = _origin_key(raw_origin)
    if origin not in allowed:
        raise OriginNotAllowed()


def bad_request(message: str) -> HTTPException:
    return HTTPException(status_code=401, detail={"message": message})
