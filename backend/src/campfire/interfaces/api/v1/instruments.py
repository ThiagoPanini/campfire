from __future__ import annotations

from fastapi import APIRouter, Query

from campfire.interfaces.api.dependencies import ContainerDep, CurrentUser

router = APIRouter(prefix="/instruments", tags=["instruments"])


@router.get("", response_model=list[str])
def list_instruments(
    _current_user: CurrentUser,
    container: ContainerDep,
    query: str | None = Query(default=None, description="optional substring filter"),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[str]:
    return container.search_instruments.execute(query=query, limit=limit)
