from __future__ import annotations

from fastapi import APIRouter

from campfire import __version__
from campfire.interfaces.api.v1.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", version=__version__)
