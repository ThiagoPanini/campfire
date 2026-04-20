from __future__ import annotations

from fastapi import APIRouter, Query

from campfire.interfaces.api.dependencies import ContainerDep, CurrentUser
from campfire.interfaces.api.v1.schemas import SongSearchItemResponse

router = APIRouter(prefix="/songs", tags=["songs"])


@router.get("/search", response_model=list[SongSearchItemResponse])
def search_songs(
    _current_user: CurrentUser,
    container: ContainerDep,
    q: str = Query(default="", description="free-text search over title/artist"),
    limit: int = Query(default=20, ge=1, le=100),
) -> list[SongSearchItemResponse]:
    views = container.search_songs.execute(query=q, limit=limit)
    return [
        SongSearchItemResponse(
            title=v.title,
            artist=v.artist,
            source=v.source,
            external_id=v.external_id,
        )
        for v in views
    ]
