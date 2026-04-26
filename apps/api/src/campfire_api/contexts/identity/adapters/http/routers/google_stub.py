from fastapi import APIRouter, Depends, Response

from campfire_api.contexts.identity.adapters.clock.system_clock import SystemClock
from campfire_api.contexts.identity.adapters.http.deps import (
    get_clock,
    get_hasher,
    get_repositories,
    get_settings,
    get_token_issuer,
)
from campfire_api.contexts.identity.adapters.http.routers.auth import apply_refresh_cookie
from campfire_api.contexts.identity.adapters.http.schemas import GoogleStubRequest, TokenResponse
from campfire_api.contexts.identity.adapters.security.argon2_hasher import Argon2PasswordHasher
from campfire_api.contexts.identity.adapters.security.opaque_token_issuer import OpaqueTokenIssuer
from campfire_api.contexts.identity.application.use_cases.authenticate_user import AuthenticateUser
from campfire_api.contexts.identity.application.use_cases.google_stub_sign_in import (
    ContinueWithGoogleStub,
)
from campfire_api.settings import SettingsProvider

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google-stub", response_model=TokenResponse)
async def google_stub(
    payload: GoogleStubRequest,
    response: Response,
    repos=Depends(get_repositories),
    hasher: Argon2PasswordHasher = Depends(get_hasher),
    token_issuer: OpaqueTokenIssuer = Depends(get_token_issuer),
    clock: SystemClock = Depends(get_clock),
    settings: SettingsProvider = Depends(get_settings),
) -> TokenResponse:
    ttl = await settings.access_token_ttl_seconds()
    authenticator = AuthenticateUser(
        repos["users"],
        repos["credentials"],
        repos["sessions"],
        repos["refresh_tokens"],
        hasher,
        token_issuer,
        clock,
        ttl,
    )
    issued = await ContinueWithGoogleStub(
        repos["users"],
        repos["preferences"],
        authenticator,
        clock,
        await settings.google_stub_enabled(),
    )(payload.intent)
    await apply_refresh_cookie(response, settings, issued.refresh_token)
    return TokenResponse(accessToken=issued.access_token, expiresIn=issued.expires_in)
