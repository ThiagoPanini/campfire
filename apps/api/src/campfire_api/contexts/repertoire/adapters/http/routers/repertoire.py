from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response

from campfire_api.contexts.identity.adapters.clock.system_clock import SystemClock
from campfire_api.contexts.identity.adapters.http.deps import AuthContext, get_current_session
from campfire_api.contexts.repertoire.adapters.catalog.deezer_song_catalog import DeezerSongCatalog
from campfire_api.contexts.repertoire.adapters.caching.ttl_search_cache import TtlSearchCache
from campfire_api.contexts.repertoire.adapters.http.deps import (
    get_repertoire_repository,
    get_search_cache,
    get_search_rate_limiter,
    get_song_catalog,
)
from campfire_api.contexts.repertoire.adapters.http.schemas import (
    EntryCreateRequest,
    EntryListResponse,
    EntryResponse,
    EntryUpdateRequest,
    SearchResponse,
    SearchResultResponse,
)
from campfire_api.contexts.repertoire.adapters.persistence.repertoire_entry_repository import (
    SqlAlchemyRepertoireEntryRepository,
)
from campfire_api.contexts.repertoire.adapters.rate_limiting.in_memory_search_limiter import (
    InMemorySearchLimiter,
)
from campfire_api.contexts.repertoire.application.use_cases.add_or_update_entry import (
    AddOrUpdateEntry,
)
from campfire_api.contexts.repertoire.application.use_cases.list_my_entries import ListMyEntries
from campfire_api.contexts.repertoire.application.use_cases.remove_entry import RemoveEntry
from campfire_api.contexts.repertoire.application.use_cases.search_songs import SearchSongs
from campfire_api.contexts.repertoire.application.use_cases.update_proficiency import (
    UpdateProficiency,
)
from campfire_api.contexts.repertoire.domain.entities import RepertoireEntry, SearchResult

router = APIRouter(prefix="/repertoire", tags=["repertoire"])


def _entry_response(entry: RepertoireEntry) -> EntryResponse:
    return EntryResponse(
        id=entry.id,
        songExternalId=entry.song_external_id,
        songTitle=entry.song_title,
        songArtist=entry.song_artist,
        songAlbum=entry.song_album,
        songReleaseYear=entry.song_release_year,
        songCoverArtUrl=entry.song_cover_art_url,
        instrument=entry.instrument,
        proficiency=entry.proficiency,
        createdAt=entry.created_at,
        updatedAt=entry.updated_at,
    )


def _search_result_response(result: SearchResult) -> SearchResultResponse:
    return SearchResultResponse(
        externalId=result.external_id,
        title=result.title,
        artist=result.artist,
        album=result.album,
        releaseYear=result.release_year,
        coverArtUrl=result.cover_art_url,
    )


def _user_uuid(auth: AuthContext) -> UUID:
    uid = auth.user_id
    return uid.value if hasattr(uid, "value") else uid


@router.get("/songs/search", response_model=SearchResponse)
async def search_songs(
    q: str = Query(..., min_length=2, max_length=256),
    page: int = Query(default=1, ge=1),
    auth: AuthContext = Depends(get_current_session),
    catalog: DeezerSongCatalog = Depends(get_song_catalog),
    cache: TtlSearchCache = Depends(get_search_cache),
    rate_limiter: InMemorySearchLimiter = Depends(get_search_rate_limiter),
) -> SearchResponse:
    use_case = SearchSongs(catalog, cache, rate_limiter)
    results, page_num, has_more = await use_case.execute(_user_uuid(auth), q, page)
    return SearchResponse(
        results=[_search_result_response(r) for r in results],
        page=page_num,
        hasMore=has_more,
    )


@router.get("/entries", response_model=EntryListResponse)
async def list_entries(
    auth: AuthContext = Depends(get_current_session),
    repository: SqlAlchemyRepertoireEntryRepository = Depends(get_repertoire_repository),
) -> EntryListResponse:
    use_case = ListMyEntries(repository)
    entries = await use_case.execute(_user_uuid(auth))
    return EntryListResponse(entries=[_entry_response(e) for e in entries])


@router.post("/entries", response_model=EntryResponse, status_code=201)
async def add_or_update_entry(
    body: EntryCreateRequest,
    response: Response,
    auth: AuthContext = Depends(get_current_session),
    repository: SqlAlchemyRepertoireEntryRepository = Depends(get_repertoire_repository),
) -> EntryResponse:
    use_case = AddOrUpdateEntry(repository, SystemClock())
    entry, action = await use_case.execute(
        user_id=_user_uuid(auth),
        song_external_id=body.song_external_id,
        song_title=body.song_title,
        song_artist=body.song_artist,
        song_album=body.song_album,
        song_release_year=body.song_release_year,
        song_cover_art_url=body.song_cover_art_url,
        instrument=body.instrument,
        proficiency=body.proficiency,
    )
    response.headers["X-Repertoire-Action"] = action
    if action == "updated":
        response.status_code = 200
    return _entry_response(entry)


@router.patch("/entries/{entry_id}", response_model=EntryResponse)
async def update_proficiency(
    entry_id: UUID,
    body: EntryUpdateRequest,
    auth: AuthContext = Depends(get_current_session),
    repository: SqlAlchemyRepertoireEntryRepository = Depends(get_repertoire_repository),
) -> EntryResponse:
    use_case = UpdateProficiency(repository, SystemClock())
    entry = await use_case.execute(_user_uuid(auth), entry_id, body.proficiency)
    return _entry_response(entry)


@router.delete("/entries/{entry_id}", status_code=204, response_model=None)
async def remove_entry(
    entry_id: UUID,
    auth: AuthContext = Depends(get_current_session),
    repository: SqlAlchemyRepertoireEntryRepository = Depends(get_repertoire_repository),
) -> Response:
    use_case = RemoveEntry(repository)
    await use_case.execute(_user_uuid(auth), entry_id)
    return Response(status_code=204)
