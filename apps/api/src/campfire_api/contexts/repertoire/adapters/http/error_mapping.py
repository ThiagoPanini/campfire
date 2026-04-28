from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from campfire_api.contexts.repertoire.domain.errors import (
    EntryForbidden,
    EntryNotFound,
    InstrumentUnknown,
    ProficiencyUnknown,
    RepertoireError,
    SearchQueryTooShort,
    SearchRateLimited,
    SongCatalogRateLimited,
    SongCatalogUnavailable,
)


def repertoire_error_response(exc: RepertoireError) -> JSONResponse:
    headers: dict[str, str] = {}
    if isinstance(exc, (InstrumentUnknown, ProficiencyUnknown, SearchQueryTooShort)):
        return JSONResponse(status_code=422, content={"message": str(exc)})
    if isinstance(exc, (EntryNotFound, EntryForbidden)):
        return JSONResponse(status_code=404, content={"message": "not found"})
    if isinstance(exc, (SearchRateLimited, SongCatalogRateLimited)):
        retry_after = getattr(exc, "retry_after", 60)
        return JSONResponse(
            status_code=429,
            content={"message": "too many requests"},
            headers={"Retry-After": str(retry_after)},
        )
    if isinstance(exc, SongCatalogUnavailable):
        return JSONResponse(status_code=503, content={"message": "catalog temporarily unavailable"})
    return JSONResponse(status_code=500, content={"message": "internal error"})


def register_repertoire_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RepertoireError)
    async def _handle_repertoire_error(_request: Request, exc: RepertoireError) -> JSONResponse:
        return repertoire_error_response(exc)
