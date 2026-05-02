from fastapi import APIRouter, Depends, Response

from campfire_api.contexts.identity.adapters.http.deps import get_settings
from campfire_api.contexts.identity.adapters.http.schemas import (
    AuthConfigResponse,
    GoogleConfig,
    PasswordSignUpConfig,
)
from campfire_api.settings import SettingsProvider

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/config", response_model=AuthConfigResponse)
async def auth_config(
    response: Response, settings: SettingsProvider = Depends(get_settings)
) -> AuthConfigResponse:
    response.headers["Cache-Control"] = "public, max-age=60"
    return AuthConfigResponse(
        google=GoogleConfig(enabled=await settings.google_enabled()),
        passwordSignUp=PasswordSignUpConfig(
            enabled=True,
            requiresEmailConfirmation=await settings.email_confirmation_required(),
        ),
    )
