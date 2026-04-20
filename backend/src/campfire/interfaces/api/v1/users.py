from __future__ import annotations

from fastapi import APIRouter

from campfire.interfaces.api.dependencies import ContainerDep, CurrentUser
from campfire.interfaces.api.v1.schemas import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def me(current_user: CurrentUser) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
    )


@router.get("", response_model=list[UserResponse])
def list_users(_current_user: CurrentUser, container: ContainerDep) -> list[UserResponse]:
    return [
        UserResponse(id=u.id, email=u.email, display_name=u.display_name)
        for u in container.list_users.execute()
    ]
