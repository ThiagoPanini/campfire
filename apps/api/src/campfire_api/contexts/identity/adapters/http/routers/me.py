from fastapi import APIRouter, Depends

from campfire_api.contexts.identity.adapters.http.deps import (
    AuthContext,
    get_current_session,
    get_repositories,
)
from campfire_api.contexts.identity.adapters.http.schemas import MeResponse
from campfire_api.contexts.identity.application.use_cases.get_me import GetCurrentUser

router = APIRouter(tags=["me"])


@router.get("/me", response_model=MeResponse)
async def me(
    context: AuthContext = Depends(get_current_session), repos=Depends(get_repositories)
) -> MeResponse:
    current = await GetCurrentUser(repos["users"])(context.user_id)
    return MeResponse(
        displayName=current.display_name.value,
        email=current.email.value,
    )
