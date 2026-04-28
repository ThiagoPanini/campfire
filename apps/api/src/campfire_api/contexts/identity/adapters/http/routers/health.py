from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.http.deps import get_db_session, ping_database

router = APIRouter()


@router.get("/healthz", tags=["health"])
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/readyz", tags=["health"])
async def readyz(session: AsyncSession = Depends(get_db_session)) -> dict[str, str]:
    try:
        await ping_database(session)
    except Exception as exc:  # pragma: no cover - depends on database outage
        raise HTTPException(status_code=503, detail={"message": "not ready"}) from exc
    return {"status": "ok"}
