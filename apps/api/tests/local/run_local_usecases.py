from __future__ import annotations

import asyncio
import json
import os
from dataclasses import dataclass, is_dataclass, asdict
from datetime import UTC
from typing import Any, Awaitable, Callable, TypeVar
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from campfire_api.contexts.identity.adapters.clock.system_clock import SystemClock
from campfire_api.contexts.identity.adapters.http.schemas import (
    MeResponse,
    TokenResponse,
)
from campfire_api.contexts.identity.adapters.persistence.credentials_repository import (
    SqlAlchemyCredentialsRepository,
)
from campfire_api.contexts.identity.adapters.persistence.refresh_token_repository import (
    SqlAlchemyRefreshTokenRepository,
)
from campfire_api.contexts.identity.adapters.persistence.session_repository import (
    SqlAlchemySessionRepository,
)
from campfire_api.contexts.identity.adapters.persistence.unit_of_work import (
    sessionmaker_for,
)
from campfire_api.contexts.identity.adapters.persistence.user_repository import (
    SqlAlchemyUserRepository,
)
from campfire_api.contexts.identity.adapters.security.argon2_hasher import (
    Argon2PasswordHasher,
)
from campfire_api.contexts.identity.adapters.security.opaque_token_issuer import (
    OpaqueTokenIssuer,
)
from campfire_api.contexts.identity.application.use_cases.authenticate_user import (
    AuthenticateUser,
)
from campfire_api.contexts.identity.application.use_cases.get_me import (
    GetCurrentUser,
)
from campfire_api.contexts.identity.application.use_cases.refresh_session import (
    RefreshSession,
)
from campfire_api.contexts.identity.application.use_cases.register_user import (
    RegisterUser,
)
from campfire_api.contexts.identity.application.use_cases.session_tokens import (
    IssuedSession,
)
from campfire_api.contexts.identity.application.use_cases.sign_out import (
    RevokeSession,
)
from campfire_api.contexts.repertoire.adapters.caching.ttl_search_cache import (
    TtlSearchCache,
)
from campfire_api.contexts.repertoire.adapters.catalog.fake_song_catalog import (
    FakeSongCatalog,
)
from campfire_api.contexts.repertoire.adapters.http.routers.repertoire import (
    _entry_response,
    _search_result_response,
)
from campfire_api.contexts.repertoire.adapters.http.schemas import (
    EntryCreateRequest,
    EntryListResponse,
    EntryResponse,
    EntryUpdateRequest,
    SearchResponse,
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
from campfire_api.contexts.repertoire.application.use_cases.list_my_entries import (
    ListMyEntries,
)
from campfire_api.contexts.repertoire.application.use_cases.remove_entry import (
    RemoveEntry,
)
from campfire_api.contexts.repertoire.application.use_cases.search_songs import (
    SearchSongs,
)
from campfire_api.contexts.repertoire.application.use_cases.update_proficiency import (
    UpdateProficiency,
)
from campfire_api.settings import EnvSettingsProvider


T = TypeVar("T")


EMAIL = (
    os.getenv("LOCAL_FLOW_EMAIL")
    or f"local-usecase-debug-{uuid4().hex[:10]}@example.com"
)
PASSWORD = os.getenv("LOCAL_FLOW_PASSWORD", "CampfireLocal123!")

INSTRUMENT = os.getenv("LOCAL_FLOW_INSTRUMENT", "Acoustic Guitar")
SEARCH_QUERY = os.getenv("LOCAL_FLOW_SEARCH_QUERY", "wonderwall")

RUN_SEARCH_FLOW = os.getenv("LOCAL_FLOW_RUN_SEARCH", "1").lower() not in {
    "0",
    "false",
    "no",
}

PRINT_TOKENS = os.getenv("LOCAL_FLOW_PRINT_TOKENS", "0").lower() in {
    "1",
    "true",
    "yes",
}


class LocalUseCaseFlowError(RuntimeError):
    """Raised when the local in-process flow cannot continue safely."""


@dataclass(frozen=True)
class DebugAuthContext:
    user_id: object
    session_id: object
    family_id: object


@dataclass(frozen=True)
class Runtime:
    settings: EnvSettingsProvider
    clock: SystemClock
    hasher: Argon2PasswordHasher
    token_issuer: OpaqueTokenIssuer
    search_cache: TtlSearchCache
    search_limiter: InMemorySearchLimiter
    song_catalog: FakeSongCatalog


@dataclass(frozen=True)
class Repositories:
    users: SqlAlchemyUserRepository
    credentials: SqlAlchemyCredentialsRepository
    sessions: SqlAlchemySessionRepository
    refresh_tokens: SqlAlchemyRefreshTokenRepository
    repertoire_entries: SqlAlchemyRepertoireEntryRepository


def build_repositories(session: AsyncSession) -> Repositories:
    return Repositories(
        users=SqlAlchemyUserRepository(session),
        credentials=SqlAlchemyCredentialsRepository(session),
        sessions=SqlAlchemySessionRepository(session),
        refresh_tokens=SqlAlchemyRefreshTokenRepository(session),
        repertoire_entries=SqlAlchemyRepertoireEntryRepository(session),
    )


async def build_runtime() -> Runtime:
    settings = EnvSettingsProvider()
    clock = SystemClock()

    return Runtime(
        settings=settings,
        clock=clock,
        hasher=Argon2PasswordHasher(),
        token_issuer=OpaqueTokenIssuer(settings, clock),
        search_cache=TtlSearchCache(
            ttl_seconds=await settings.search_cache_ttl_seconds(),
            max_entries=await settings.search_cache_max_entries(),
        ),
        search_limiter=InMemorySearchLimiter(
            clock=clock,
            limit=await settings.search_rate_limit_per_window(),
            window_seconds=await settings.search_rate_limit_window_seconds(),
        ),
        # Deterministic local adapter.
        # The SearchSongs use case is real; only the external catalog is fake.
        song_catalog=FakeSongCatalog(),
    )


async def run_in_unit_of_work(
    runtime: Runtime,
    operation: Callable[[Repositories], Awaitable[T]],
) -> T:
    maker = await sessionmaker_for(runtime.settings)

    async with maker() as session:
        repos = build_repositories(session)

        try:
            result = await operation(repos)
            await session.commit()
            return result
        except Exception:
            await session.rollback()
            raise


def as_uuid(value: object) -> UUID:
    raw = getattr(value, "value", value)

    if isinstance(raw, UUID):
        return raw

    return UUID(str(raw))


def mask_token(token: str) -> str:
    if PRINT_TOKENS:
        return token

    if len(token) <= 12:
        return "***"

    return f"{token[:6]}...{token[-6:]}"


def to_printable(value: Any) -> Any:
    if isinstance(value, IssuedSession):
        return {
            "accessToken": mask_token(value.access_token),
            "refreshToken": mask_token(value.refresh_token),
            "expiresIn": value.expires_in,
        }

    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json", by_alias=True)

    if is_dataclass(value):
        return asdict(value)

    if isinstance(value, dict):
        return {key: to_printable(item) for key, item in value.items()}

    if isinstance(value, list | tuple):
        return [to_printable(item) for item in value]

    return value


def pretty(value: Any) -> str:
    return json.dumps(
        to_printable(value),
        indent=2,
        ensure_ascii=False,
        sort_keys=True,
        default=str,
    )


async def run_step(
    title: str,
    payload: Any,
    operation: Callable[[], Awaitable[T]],
) -> T:
    print("\n" + "=" * 88)
    print(title)

    if payload is not None:
        print("\nInput:")
        print(pretty(payload))

    result = await operation()

    print("\nOutput:")
    print(pretty(result))

    return result


async def resolve_auth_context(
    runtime: Runtime,
    repos: Repositories,
    access_token: str,
) -> DebugAuthContext:
    session = await repos.sessions.get_by_access_fingerprint(
        runtime.token_issuer.fingerprint(access_token)
    )

    if session is None:
        raise LocalUseCaseFlowError("No active session found for access token.")

    expires_at = session.access_token_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)

    if session.revoked_at is not None:
        raise LocalUseCaseFlowError("Session is revoked.")

    if expires_at <= runtime.clock.now():
        raise LocalUseCaseFlowError("Session access token is expired.")

    return DebugAuthContext(
        user_id=session.user_id,
        session_id=session.id,
        family_id=session.family_id,
    )


async def register_user_flow(
    runtime: Runtime,
    email: str,
    password: str,
) -> MeResponse:
    async def operation(repos: Repositories) -> MeResponse:
        user = await RegisterUser(
            repos.users,
            repos.credentials,
            runtime.hasher,
            runtime.clock,
        )(email, password)

        return MeResponse(
            displayName=user.display_name.value,
            email=user.email.value,
        )

    return await run_in_unit_of_work(runtime, operation)


async def authenticate_user_flow(
    runtime: Runtime,
    email: str,
    password: str,
) -> IssuedSession:
    async def operation(repos: Repositories) -> IssuedSession:
        return await AuthenticateUser(
            repos.users,
            repos.credentials,
            repos.sessions,
            repos.refresh_tokens,
            runtime.hasher,
            runtime.token_issuer,
            runtime.clock,
            await runtime.settings.access_token_ttl_seconds(),
        )(email, password)

    return await run_in_unit_of_work(runtime, operation)


async def refresh_session_flow(
    runtime: Runtime,
    refresh_token: str,
) -> IssuedSession:
    async def operation(repos: Repositories) -> IssuedSession:
        return await RefreshSession(
            repos.sessions,
            repos.refresh_tokens,
            runtime.token_issuer,
            runtime.clock,
            await runtime.settings.access_token_ttl_seconds(),
        )(refresh_token)

    return await run_in_unit_of_work(runtime, operation)


async def get_me_flow(
    runtime: Runtime,
    access_token: str,
) -> MeResponse:
    async def operation(repos: Repositories) -> MeResponse:
        context = await resolve_auth_context(runtime, repos, access_token)
        current = await GetCurrentUser(
            repos.users,
        )(context.user_id)

        return MeResponse(
            displayName=current.display_name.value,
            email=current.email.value,
        )

    return await run_in_unit_of_work(runtime, operation)


async def search_songs_flow(
    runtime: Runtime,
    access_token: str,
    query: str,
) -> SearchResponse:
    async def operation(repos: Repositories) -> SearchResponse:
        context = await resolve_auth_context(runtime, repos, access_token)

        results, page, has_more = await SearchSongs(
            runtime.song_catalog,
            runtime.search_cache,
            runtime.search_limiter,
        ).execute(
            user_id=as_uuid(context.user_id),
            query=query,
            page=1,
        )

        return SearchResponse(
            results=[_search_result_response(result) for result in results],
            page=page,
            hasMore=has_more,
        )

    return await run_in_unit_of_work(runtime, operation)


def build_entry_payload(search_response: SearchResponse | None) -> EntryCreateRequest:
    if search_response and search_response.results:
        first_result = search_response.results[0]

        return EntryCreateRequest(
            songExternalId=first_result.external_id,
            songTitle=first_result.title,
            songArtist=first_result.artist,
            songAlbum=first_result.album,
            songReleaseYear=first_result.release_year,
            songCoverArtUrl=first_result.cover_art_url,
            instrument=INSTRUMENT,
            proficiency="learning",
        )

    return EntryCreateRequest(
        songExternalId=f"local-usecase-{uuid4().hex[:12]}",
        songTitle="Wonderwall",
        songArtist="Oasis",
        songAlbum="(What's the Story) Morning Glory?",
        songReleaseYear=1995,
        songCoverArtUrl=None,
        instrument=INSTRUMENT,
        proficiency="learning",
    )


async def add_or_update_entry_flow(
    runtime: Runtime,
    access_token: str,
    payload: EntryCreateRequest,
) -> dict[str, Any]:
    async def operation(repos: Repositories) -> dict[str, Any]:
        context = await resolve_auth_context(runtime, repos, access_token)

        entry, action = await AddOrUpdateEntry(
            repos.repertoire_entries,
            runtime.clock,
        ).execute(
            user_id=as_uuid(context.user_id),
            song_external_id=payload.song_external_id,
            song_title=payload.song_title,
            song_artist=payload.song_artist,
            song_album=payload.song_album,
            song_release_year=payload.song_release_year,
            song_cover_art_url=payload.song_cover_art_url,
            instrument=payload.instrument,
            proficiency=payload.proficiency,
        )

        return {
            "action": action,
            "entry": _entry_response(entry),
        }

    return await run_in_unit_of_work(runtime, operation)


async def list_entries_flow(
    runtime: Runtime,
    access_token: str,
) -> EntryListResponse:
    async def operation(repos: Repositories) -> EntryListResponse:
        context = await resolve_auth_context(runtime, repos, access_token)

        entries = await ListMyEntries(
            repos.repertoire_entries,
        ).execute(as_uuid(context.user_id))

        return EntryListResponse(
            entries=[_entry_response(entry) for entry in entries],
        )

    return await run_in_unit_of_work(runtime, operation)


async def update_entry_proficiency_flow(
    runtime: Runtime,
    access_token: str,
    entry_id: UUID,
) -> EntryResponse:
    payload = EntryUpdateRequest(proficiency="practicing")

    async def operation(repos: Repositories) -> EntryResponse:
        context = await resolve_auth_context(runtime, repos, access_token)

        entry = await UpdateProficiency(
            repos.repertoire_entries,
            runtime.clock,
        ).execute(
            user_id=as_uuid(context.user_id),
            entry_id=entry_id,
            proficiency=payload.proficiency,
        )

        return _entry_response(entry)

    return await run_in_unit_of_work(runtime, operation)


async def remove_entry_flow(
    runtime: Runtime,
    access_token: str,
    entry_id: UUID,
) -> dict[str, str]:
    async def operation(repos: Repositories) -> dict[str, str]:
        context = await resolve_auth_context(runtime, repos, access_token)

        await RemoveEntry(
            repos.repertoire_entries,
        ).execute(
            user_id=as_uuid(context.user_id),
            entry_id=entry_id,
        )

        return {
            "removedEntryId": str(entry_id),
            "status": "removed",
        }

    return await run_in_unit_of_work(runtime, operation)


async def logout_flow(
    runtime: Runtime,
    access_token: str,
) -> dict[str, str]:
    async def operation(repos: Repositories) -> dict[str, str]:
        context = await resolve_auth_context(runtime, repos, access_token)

        await RevokeSession(
            repos.sessions,
            repos.refresh_tokens,
            runtime.clock,
        )(
            context.session_id,
            context.family_id,
        )

        return {"status": "signed_out"}

    return await run_in_unit_of_work(runtime, operation)


async def main() -> int:
    runtime = await build_runtime()

    print("Campfire local in-process use case flow")
    print(f"EMAIL={EMAIL}")
    print(f"INSTRUMENT={INSTRUMENT}")
    print(f"SEARCH_QUERY={SEARCH_QUERY}")
    print("HTTP server required: no")
    print("Database required: yes")

    try:
        await run_step(
            "1. Register user via RegisterUser use case",
            {"email": EMAIL, "password": "***"},
            lambda: register_user_flow(runtime, EMAIL, PASSWORD),
        )

        issued = await run_step(
            "2. Authenticate user via AuthenticateUser use case",
            {"email": EMAIL, "password": "***"},
            lambda: authenticate_user_flow(runtime, EMAIL, PASSWORD),
        )

        token_response = TokenResponse(
            accessToken=issued.access_token,
            expiresIn=issued.expires_in,
        )
        print("\nPresentation TokenResponse:")
        print(pretty(token_response))

        access_token = issued.access_token
        refresh_token = issued.refresh_token

        await run_step(
            "3. Resolve current user via token + GetCurrentUser use case",
            {"accessToken": mask_token(access_token)},
            lambda: get_me_flow(runtime, access_token),
        )

        refreshed = await run_step(
            "4. Refresh session via RefreshSession use case",
            {"refreshToken": mask_token(refresh_token)},
            lambda: refresh_session_flow(runtime, refresh_token),
        )

        access_token = refreshed.access_token

        search_response: SearchResponse | None = None

        if RUN_SEARCH_FLOW:
            search_response = await run_step(
                "5. Search songs via SearchSongs use case",
                {"query": SEARCH_QUERY, "catalog": "FakeSongCatalog"},
                lambda: search_songs_flow(runtime, access_token, SEARCH_QUERY),
            )

        entry_payload = build_entry_payload(search_response)

        created = await run_step(
            "6. Add repertoire entry via AddOrUpdateEntry use case",
            entry_payload,
            lambda: add_or_update_entry_flow(
                runtime,
                access_token,
                entry_payload,
            ),
        )

        entry_response = created["entry"]
        entry_id = entry_response.id

        await run_step(
            "7. List repertoire entries via ListMyEntries use case",
            None,
            lambda: list_entries_flow(runtime, access_token),
        )

        await run_step(
            "8. Update entry proficiency via UpdateProficiency use case",
            {"entryId": str(entry_id), "proficiency": "practicing"},
            lambda: update_entry_proficiency_flow(
                runtime,
                access_token,
                entry_id,
            ),
        )

        await run_step(
            "9. List repertoire entries after update",
            None,
            lambda: list_entries_flow(runtime, access_token),
        )

        await run_step(
            "10. Remove repertoire entry via RemoveEntry use case",
            {"entryId": str(entry_id)},
            lambda: remove_entry_flow(runtime, access_token, entry_id),
        )

        await run_step(
            "11. List repertoire entries after removal",
            None,
            lambda: list_entries_flow(runtime, access_token),
        )

        await run_step(
            "12. Sign out via RevokeSession use case",
            {"accessToken": mask_token(access_token)},
            lambda: logout_flow(runtime, access_token),
        )

        try:
            await run_step(
                "13. Try to resolve current user after logout",
                {"accessToken": mask_token(access_token)},
                lambda: get_me_flow(runtime, access_token),
            )
        except LocalUseCaseFlowError as exc:
            print("\nExpected result after logout:")
            print(str(exc))

    except Exception as exc:
        print("\nFAILED")
        print(f"{type(exc).__name__}: {exc}")
        return 1

    print("\nLocal in-process use case flow completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
