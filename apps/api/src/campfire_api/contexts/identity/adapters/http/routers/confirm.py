from fastapi import APIRouter, Depends, Request, Response, status

from campfire_api.contexts.identity.adapters.clock.system_clock import SystemClock
from campfire_api.contexts.identity.adapters.http.deps import (
    client_ip,
    get_clock,
    get_code_hasher,
    get_email_sender,
    get_rate_limiter,
    get_repositories,
    get_settings,
    get_token_issuer,
)
from campfire_api.contexts.identity.adapters.http.routers.auth import apply_refresh_cookie
from campfire_api.contexts.identity.adapters.http.schemas import (
    ConfirmRequest,
    ConfirmResendRequest,
    ConfirmResendResponse,
    TokenResponse,
)
from campfire_api.contexts.identity.adapters.rate_limiting.in_memory_limiter import (
    InMemoryRateLimiter,
)
from campfire_api.contexts.identity.adapters.security.hmac_code_hasher import (
    HmacConfirmationCodeHasher,
)
from campfire_api.contexts.identity.adapters.security.opaque_token_issuer import OpaqueTokenIssuer
from campfire_api.contexts.identity.application.errors import (
    ConfirmationAttemptsExceeded,
    ConfirmationCodeExpired,
    ConfirmationCodeInvalid,
)
from campfire_api.contexts.identity.application.use_cases.confirm_email import ConfirmEmail
from campfire_api.contexts.identity.application.use_cases.resend_confirmation import (
    ResendConfirmation,
)
from campfire_api.contexts.identity.domain.ports import EmailSender
from campfire_api.settings import SettingsProvider

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/confirm", response_model=TokenResponse)
async def confirm_email(
    payload: ConfirmRequest,
    response: Response,
    request: Request,
    repos=Depends(get_repositories),
    code_hasher: HmacConfirmationCodeHasher = Depends(get_code_hasher),
    token_issuer: OpaqueTokenIssuer = Depends(get_token_issuer),
    clock: SystemClock = Depends(get_clock),
    settings: SettingsProvider = Depends(get_settings),
    limiter: InMemoryRateLimiter = Depends(get_rate_limiter),
) -> TokenResponse:
    await limiter.check(client_ip(request, settings), str(payload.email))
    try:
        issued = await ConfirmEmail(
            users=repos["users"],
            credentials=repos["credentials"],
            confirmations=repos["email_confirmations"],
            sessions=repos["sessions"],
            refresh_tokens=repos["refresh_tokens"],
            hasher=code_hasher,
            token_issuer=token_issuer,
            clock=clock,
            access_ttl_seconds=await settings.access_token_ttl_seconds(),
            max_attempts=await settings.email_confirmation_max_attempts(),
        )(str(payload.email), payload.code)
    except (ConfirmationAttemptsExceeded, ConfirmationCodeExpired, ConfirmationCodeInvalid):
        await repos["_session"].commit()
        raise
    await apply_refresh_cookie(response, settings, issued.refresh_token)
    return TokenResponse(accessToken=issued.access_token, expiresIn=issued.expires_in)


@router.post(
    "/confirm/resend",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=ConfirmResendResponse,
)
async def resend_confirmation(
    payload: ConfirmResendRequest,
    request: Request,
    repos=Depends(get_repositories),
    code_hasher: HmacConfirmationCodeHasher = Depends(get_code_hasher),
    email_sender: EmailSender = Depends(get_email_sender),
    clock: SystemClock = Depends(get_clock),
    settings: SettingsProvider = Depends(get_settings),
    limiter: InMemoryRateLimiter = Depends(get_rate_limiter),
) -> ConfirmResendResponse:
    await limiter.check(client_ip(request, settings), str(payload.email))
    ttl_seconds = await settings.email_confirmation_ttl_seconds()
    cooldown_seconds = await settings.email_confirmation_resend_cooldown_seconds()
    await ResendConfirmation(
        users=repos["users"],
        confirmations=repos["email_confirmations"],
        hasher=code_hasher,
        email_sender=email_sender,
        clock=clock,
        ttl_seconds=ttl_seconds,
        cooldown_seconds=cooldown_seconds,
        hourly_cap=await settings.email_confirmation_resend_hourly_cap(),
    )(str(payload.email))
    return ConfirmResendResponse(
        expiresInSeconds=ttl_seconds,
        resendCooldownSeconds=cooldown_seconds,
    )
