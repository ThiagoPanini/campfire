from typing import cast

from fastapi import APIRouter, Depends, Request, Response, status

from campfire_api.contexts.identity.adapters.clock.system_clock import SystemClock
from campfire_api.contexts.identity.adapters.http.csrf import require_refresh_cookie
from campfire_api.contexts.identity.adapters.http.deps import (
    AuthContext,
    client_ip,
    get_clock,
    get_code_hasher,
    get_email_sender,
    get_hasher,
    get_rate_limiter,
    get_repositories,
    get_settings,
    get_token_issuer,
    optional_current_session,
)
from campfire_api.contexts.identity.adapters.http.schemas import (
    ConfirmationRequiredResponse,
    LoginRequest,
    MeResponse,
    RegisterRequest,
    TokenResponse,
)
from campfire_api.contexts.identity.adapters.rate_limiting.in_memory_limiter import (
    InMemoryRateLimiter,
)
from campfire_api.contexts.identity.adapters.security.argon2_hasher import Argon2PasswordHasher
from campfire_api.contexts.identity.adapters.security.hmac_code_hasher import (
    HmacConfirmationCodeHasher,
)
from campfire_api.contexts.identity.adapters.security.opaque_token_issuer import OpaqueTokenIssuer
from campfire_api.contexts.identity.application.use_cases.authenticate_user import (
    AuthenticateUser,
    UnconfirmedAccount,
)
from campfire_api.contexts.identity.application.use_cases.refresh_session import RefreshSession
from campfire_api.contexts.identity.application.use_cases.register_user import (
    RegisterUser,
    RegistrationResult,
)
from campfire_api.contexts.identity.application.use_cases.sign_out import RevokeSession
from campfire_api.contexts.identity.domain.ports import EmailSender
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
    samesite: str,
    domain: str | None,
    max_age: int,
) -> None:
    # Settings values are already read by callers; keep cookie policy centralized.
    response.set_cookie(
        name,
        token,
        httponly=True,
        secure=secure,
        samesite=cast("str", samesite),
        path="/auth/refresh",
        domain=domain,
        max_age=max_age,
    )


async def apply_refresh_cookie(response: Response, settings: SettingsProvider, token: str) -> None:
    set_refresh_cookie(
        response,
        await settings.refresh_cookie_name(),
        token,
        secure=await settings.refresh_cookie_secure(),
        samesite=await settings.refresh_cookie_samesite(),
        domain=await settings.refresh_cookie_domain(),
        max_age=await settings.refresh_token_ttl_seconds(),
    )


@router.post(
    "/register",
    response_model=ConfirmationRequiredResponse | MeResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def register(
    payload: RegisterRequest,
    request: Request,
    repos=Depends(get_repositories),
    hasher: Argon2PasswordHasher = Depends(get_hasher),
    code_hasher: HmacConfirmationCodeHasher = Depends(get_code_hasher),
    email_sender: EmailSender = Depends(get_email_sender),
    clock: SystemClock = Depends(get_clock),
    settings: SettingsProvider = Depends(get_settings),
    limiter: InMemoryRateLimiter = Depends(get_rate_limiter),
) -> ConfirmationRequiredResponse | MeResponse:
    await enforce_auth_rate_limit(request, payload, limiter)
    result = await RegisterUser(
        users=repos["users"],
        credentials=repos["credentials"],
        hasher=hasher,
        confirmations=repos["email_confirmations"],
        code_hasher=code_hasher,
        email_sender=email_sender,
        clock=clock,
        confirmation_ttl_seconds=await settings.email_confirmation_ttl_seconds(),
        confirmation_required=await settings.email_confirmation_required(),
    )(str(payload.email), payload.password)
    result = cast(RegistrationResult, result)
    if result.status == "registered":
        user = await repos["users"].get_by_id(result.user_id)
        return MeResponse(
            displayName=user.display_name.value,
            email=user.email.value,
        )
    return ConfirmationRequiredResponse(
        expiresInSeconds=await settings.email_confirmation_ttl_seconds(),
        resendCooldownSeconds=await settings.email_confirmation_resend_cooldown_seconds(),
    )


@router.post("/login", response_model=TokenResponse | ConfirmationRequiredResponse)
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
) -> TokenResponse | ConfirmationRequiredResponse:
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
    if isinstance(issued, UnconfirmedAccount):
        return ConfirmationRequiredResponse(
            expiresInSeconds=await settings.email_confirmation_ttl_seconds(),
            resendCooldownSeconds=await settings.email_confirmation_resend_cooldown_seconds(),
        )
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
