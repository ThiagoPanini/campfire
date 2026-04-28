from fastapi import APIRouter, Depends

from campfire_api.contexts.identity.adapters.clock.system_clock import SystemClock
from campfire_api.contexts.identity.adapters.http.deps import (
    AuthContext,
    get_clock,
    get_current_session,
    get_repositories,
)
from campfire_api.contexts.identity.adapters.http.schemas import MeResponse, PreferencesPayload
from campfire_api.contexts.identity.application.use_cases.get_me import GetCurrentUser
from campfire_api.contexts.identity.application.use_cases.update_preferences import (
    UpdatePreferences,
)

router = APIRouter(tags=["me"])


def to_me_response(current) -> MeResponse:
    return MeResponse(
        displayName=current.user.display_name.value,
        email=current.user.email.value,
        firstLogin=current.user.first_login,
        preferences=PreferencesPayload(
            instruments=current.preferences.instruments,
            genres=current.preferences.genres,
            context=current.preferences.context,
            goals=current.preferences.goals,
            experience=current.preferences.experience,
        ),
    )


@router.get("/me", response_model=MeResponse)
async def me(
    context: AuthContext = Depends(get_current_session), repos=Depends(get_repositories)
) -> MeResponse:
    return to_me_response(
        await GetCurrentUser(repos["users"], repos["preferences"])(context.user_id)
    )


@router.patch("/me/preferences", response_model=MeResponse)
async def update_preferences(
    payload: PreferencesPayload,
    context: AuthContext = Depends(get_current_session),
    repos=Depends(get_repositories),
    clock: SystemClock = Depends(get_clock),
) -> MeResponse:
    await UpdatePreferences(repos["users"], repos["preferences"], clock)(
        context.user_id,
        payload.instruments,
        payload.genres,
        payload.context,
        payload.goals,
        payload.experience,
    )
    return to_me_response(
        await GetCurrentUser(repos["users"], repos["preferences"])(context.user_id)
    )
