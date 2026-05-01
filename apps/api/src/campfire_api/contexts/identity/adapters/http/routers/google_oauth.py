from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import RedirectResponse

from campfire_api.contexts.identity.adapters.clock.system_clock import SystemClock
from campfire_api.contexts.identity.adapters.http.deps import (
    get_clock,
    get_repositories,
    get_settings,
    get_token_issuer,
)
from campfire_api.contexts.identity.adapters.http.routers.auth import apply_refresh_cookie
from campfire_api.contexts.identity.adapters.http.schemas import (
    GoogleStartRequest,
    GoogleStartResponse,
)
from campfire_api.contexts.identity.adapters.oauth.google_identity_provider import (
    GoogleOAuthIdentityProvider,
)
from campfire_api.contexts.identity.adapters.security.opaque_token_issuer import OpaqueTokenIssuer
from campfire_api.contexts.identity.application.errors import GoogleSignInFailed
from campfire_api.contexts.identity.application.use_cases.complete_google_sign_in import (
    CompleteGoogleSignIn,
)
from campfire_api.contexts.identity.application.use_cases.start_google_sign_in import (
    StartGoogleSignIn,
)
from campfire_api.settings import SettingsProvider

router = APIRouter(prefix="/auth/google", tags=["auth"])
logger = logging.getLogger(__name__)


@router.post("/start", response_model=GoogleStartResponse)
async def start_google(
    payload: GoogleStartRequest,
    response: Response,
    repos=Depends(get_repositories),
    settings: SettingsProvider = Depends(get_settings),
    clock: SystemClock = Depends(get_clock),
) -> GoogleStartResponse:
    started = await StartGoogleSignIn(repos["oauth_flow_states"], settings, clock)(
        intent=payload.intent, next_path=payload.next
    )
    response.set_cookie(
        "campfire_oauth_state",
        started.state_cookie_value,
        httponly=True,
        secure=await settings.refresh_cookie_secure(),
        samesite="lax",
        path="/auth/google",
        max_age=await settings.oauth_flow_ttl_seconds(),
    )
    return GoogleStartResponse(authorizeUrl=started.authorize_url)


@router.get("/callback")
async def google_callback(
    request: Request,
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    repos=Depends(get_repositories),
    settings: SettingsProvider = Depends(get_settings),
    token_issuer: OpaqueTokenIssuer = Depends(get_token_issuer),
    clock: SystemClock = Depends(get_clock),
) -> RedirectResponse:
    web = await settings.web_base_url()
    if error:
        reason = "google_cancelled" if error == "access_denied" else "google_failed"
        _log_failure(reason, request)
        return RedirectResponse(f"{web}/signin?auth_error={reason}", status_code=302)
    try:
        client_id = await settings.google_oauth_client_id()
        client_secret = await settings.google_oauth_client_secret()
        state_cookie = request.cookies.get("campfire_oauth_state")
        if not code or not state or not client_id or not client_secret or not state_cookie:
            raise GoogleSignInFailed()
        completed = await CompleteGoogleSignIn(
            repos["oauth_flow_states"],
            repos["provider_links"],
            repos["email_confirmations"],
            repos["users"],
            GoogleOAuthIdentityProvider(client_id=client_id, client_secret=client_secret),
            repos["sessions"],
            repos["refresh_tokens"],
            token_issuer,
            settings,
            clock,
        )(code=code, query_state=state, state_cookie=state_cookie)
        destination = f"{web}{completed.return_to or '/home'}?auth=ok"
        response = RedirectResponse(destination, status_code=302)
        await apply_refresh_cookie(response, settings, completed.session.refresh_token)
        response.delete_cookie("campfire_oauth_state", path="/auth/google")
        return response
    except GoogleSignInFailed:
        _log_failure("google_failed", request)
        return RedirectResponse(f"{web}/signin?auth_error=google_failed", status_code=302)


def _log_failure(reason: str, request: Request) -> None:
    logger.warning(
        "google_oauth_failure",
        extra={
            "event": "google_oauth_failure",
            "reason": reason,
            "request_id": request.headers.get("x-request-id"),
        },
    )
