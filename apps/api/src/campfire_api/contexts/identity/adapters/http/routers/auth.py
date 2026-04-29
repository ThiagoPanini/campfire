from fastapi import APIRouter, Depends, Request, Response, status

from campfire_api.contexts.identity.adapters.clock.system_clock import SystemClock
from campfire_api.contexts.identity.adapters.http.csrf import require_refresh_cookie
from campfire_api.contexts.identity.adapters.http.deps import (
    AuthContext,
    client_ip,
    get_clock,
    get_hasher,
    get_rate_limiter,
    get_repositories,
    get_settings,
    get_token_issuer,
    optional_current_session,
)
from campfire_api.contexts.identity.adapters.http.schemas import (
    LoginRequest,
    MeResponse,
    RegisterRequest,
    TokenResponse,
)
from campfire_api.contexts.identity.adapters.rate_limiting.in_memory_limiter import (
    InMemoryRateLimiter,
)
from campfire_api.contexts.identity.adapters.security.argon2_hasher import Argon2PasswordHasher
from campfire_api.contexts.identity.adapters.security.opaque_token_issuer import OpaqueTokenIssuer
from campfire_api.contexts.identity.application.use_cases.authenticate_user import AuthenticateUser
from campfire_api.contexts.identity.application.use_cases.refresh_session import RefreshSession
from campfire_api.contexts.identity.application.use_cases.register_user import RegisterUser
from campfire_api.contexts.identity.application.use_cases.sign_out import RevokeSession
from campfire_api.settings import SettingsProvider

router = APIRouter(prefix="/auth", tags=["auth"])


async def enforce_auth_rate_limit(
    request: Request,
    payload: RegisterRequest | LoginRequest,
    limiter: InMemoryRateLimiter,
) -> None:
    await limiter.check(client_ip(request), str(payload.email))


def set_refresh_cookie(
    response: Response,
    name: str,
    token: str,
    secure: bool,
    domain: str | None,
    max_age: int,
) -> None:
    # Settings values are already read by callers; keep cookie policy centralized.
    response.set_cookie(
        name,
        token,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/auth/refresh",
        domain=domain,
        max_age=max_age,
    )


async def apply_refresh_cookie(response: Response, settings: SettingsProvider, token: str) -> None:
    set_refresh_cookie(
        response,
        await settings.refresh_cookie_name(),
        token,
        secure=(await settings.env()) == "prod",
        domain=await settings.refresh_cookie_domain(),
        max_age=await settings.refresh_token_ttl_seconds(),
    )


@router.post("/register", response_model=MeResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    repos=Depends(get_repositories),
    hasher: Argon2PasswordHasher = Depends(get_hasher),
    clock: SystemClock = Depends(get_clock),
    limiter: InMemoryRateLimiter = Depends(get_rate_limiter),
) -> MeResponse:
    await enforce_auth_rate_limit(request, payload, limiter)
    user = await RegisterUser(
        repos["users"], repos["credentials"], hasher, clock
    )(str(payload.email), payload.password)
    return MeResponse(
        displayName=user.display_name.value,
        email=user.email.value,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
    repos=Depends(get_repositories),
    hasher: Argon2PasswordHasher = Depends(get_hasher),
    token_issuer: OpaqueTokenIssuer = Depends(get_token_issuer),
    clock: SystemClock = Depends(get_clock),
    settings: SettingsProvider = Depends(get_settings),
    limiter: InMemoryRateLimiter = Depends(get_rate_limiter),
) -> TokenResponse:
    await enforce_auth_rate_limit(request, payload, limiter)
    ttl = await settings.access_token_ttl_seconds()
    issued = await AuthenticateUser(
        repos["users"],
        repos["credentials"],
        repos["sessions"],
        repos["refresh_tokens"],
        hasher,
        token_issuer,
        clock,
        ttl,
    )(str(payload.email), payload.password)
    await apply_refresh_cookie(response, settings, issued.refresh_token)
    return TokenResponse(accessToken=issued.access_token, expiresIn=issued.expires_in)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    refresh_token: str = Depends(require_refresh_cookie),
    repos=Depends(get_repositories),
    token_issuer: OpaqueTokenIssuer = Depends(get_token_issuer),
    clock: SystemClock = Depends(get_clock),
    settings: SettingsProvider = Depends(get_settings),
) -> TokenResponse:
    issued = await RefreshSession(
        repos["sessions"],
        repos["refresh_tokens"],
        token_issuer,
        clock,
        await settings.access_token_ttl_seconds(),
    )(refresh_token)
    await apply_refresh_cookie(response, settings, issued.refresh_token)
    return TokenResponse(accessToken=issued.access_token, expiresIn=issued.expires_in)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    context: AuthContext | None = Depends(optional_current_session),
    repos=Depends(get_repositories),
    clock: SystemClock = Depends(get_clock),
    settings: SettingsProvider = Depends(get_settings),
) -> Response:
    if context is not None:
        await RevokeSession(repos["sessions"], repos["refresh_tokens"], clock)(
            context.session_id, context.family_id
        )
    response.delete_cookie(
        await settings.refresh_cookie_name(),
        path="/auth/refresh",
        domain=await settings.refresh_cookie_domain(),
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
