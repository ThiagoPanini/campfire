# Implementation Plan: Repertoire Song Entry

**Branch**: `003-repertoire-song-entry` | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-repertoire-song-entry/spec.md`

## Summary

Add the second backend bounded context — `repertoire` — alongside the existing
`identity` context, and the matching `repertoire` frontend feature slice. The
slice lets a logged-in user search an external music catalog, pick a song,
choose an instrument from the shared 12-instrument catalog, choose a 3-tier
proficiency level (`learning` / `practicing` / `ready`), and persist a
private entry uniquely keyed by `(user_id, song_external_id, instrument)`.
Listing, removal (hard delete), proficiency update, and a duplicate-aware
"add or update" path round out the slice.

The external catalog (Deezer public API; see Phase 0 / ADR) is reached
through a `SongCatalogPort` Protocol in the repertoire domain. The HTTP
adapter — `DeezerSongCatalog` — is the only place that imports `httpx` and
is the only thing that knows the provider exists. Search is **proxied through
the backend** (not direct browser → Deezer): the backend enforces
authenticated access (FR-001), per-user rate limits (FR-016), and a
short-lived in-memory cache, and applies the catalog's "fetched-at-add-time"
shape (FR-013) so the wire schema the frontend sees is decoupled from
Deezer's. The frontend adds a 300 ms input debounce (FR-016).

Songs are *not* a separately-modeled aggregate in this slice — there is no
`songs` table. The repertoire entry stores the catalog metadata captured at
add-time as denormalized columns (`song_external_id`, `song_title`,
`song_artist`, `song_album`, `song_release_year`, `song_cover_art_url`).
This matches FR-013 (the entry must remain viewable when the catalog
becomes unreachable) and avoids introducing a shared songs aggregate before
a second feature needs one (constitution Principle I — YAGNI).

The repertoire context depends on identity only via the `UserId` value
object and the existing JWT/session middleware that resolves the
authenticated `AuthContext`. No identity entities, repositories, or
catalog modules are imported by repertoire. The shared instrument
vocabulary is lifted into `campfire_api.shared.catalogs.INSTRUMENTS`
(FR-005), with identity re-exporting the same object from its existing
`identity.domain.catalogs` module for backward compatibility. The
proficiency vocabulary is owned by the new repertoire domain.

The frontend ships a feature slice at `apps/web/src/features/repertoire/`
mirroring the existing `auth/` and `onboarding/` slices: a thin API
module, a feature store, and three presentational components (list,
search modal, entry form). The home tile "YOUR REPERTOIRE" (FR-015) is
re-pointed from its placeholder at `apps/web/src/pages/HomePage.tsx` to
a new `RepertoirePage`. Locale strings are added in EN and PT.

A new contract test snapshot lives at
`specs/003-repertoire-song-entry/contracts/openapi.json`. The existing
identity snapshot test compares `create_app().openapi()` against the
identity contracts file; this slice adds a second, separately-pinned
snapshot file to avoid coupling the two slices' snapshots — see
"Contract testing strategy" below for the exact mechanism.

## Technical Context

**Language/Version**: Python 3.12 (backend) + TypeScript 5.x strict
(frontend). Both fixed by the existing toolchain — no new languages.
**Primary Dependencies**:
  - **New (backend)**: `httpx` (already a dependency for tests; promoted to
    a runtime dependency for the Deezer adapter only — domain and
    application layers do not import it).
  - **Reused (backend)**: FastAPI, Pydantic v2, SQLAlchemy 2.x async +
    asyncpg, Alembic, `argon2-cffi` (not used in this slice but stays in
    the project), `uuid-utils`, `pytest` + `pytest-asyncio` +
    `testcontainers[postgres]`, `ruff`, `mypy`.
  - **Reused (frontend)**: existing Vite + React 18 + plain CSS stack;
    the in-memory token client at `apps/web/src/api/client.ts`; the
    locale loader at `apps/web/src/i18n/`.
**Storage**: PostgreSQL 16, one new table `repertoire_entries` with a
foreign key to `users(id)` (`ON DELETE CASCADE`), a partial unique index
on `(user_id, song_external_id, instrument)`, and `TIMESTAMPTZ` UTC
timestamps (per ADR-004 from spec 002, kept).
**Testing**: pytest (`unit` markers for use-case tests with fake
repositories and a fake `SongCatalogPort`; `integration` markers for the
HTTP routes against Testcontainers Postgres; `contract` marker for the
OpenAPI snapshot diff). Frontend has no automated tests in this slice
(constitution Principle IV — proportional rigor; the auth slice did not
introduce them either, and the manual quickstart is the gate).
**Target Platform**: same as identity slice (Linux server, containerized
Postgres locally; production target deferred to a Terraform slice).
**Project Type**: web-application — Python API service (`apps/api/`) +
React SPA (`apps/web/`).
**Performance Goals**: SC-002 — at least 90% of well-known song queries
return a usable first page within 2 seconds of the user finishing typing.
The 2-second budget breaks down as: 300 ms client debounce
(FR-016) + ≤200 ms backend overhead (auth, rate-limit check, cache
lookup) + ≤1.5 s upstream Deezer call. The backend cache (60 s TTL,
LRU-bounded) is the load-bearing trick when a user types, deletes, and
re-types the same query.
**Constraints**:
  - Domain and application layers MUST remain framework-free. The
    architecture test at `apps/api/tests/unit/test_architecture.py`
    currently scopes only the identity context; this slice extends its
    `ROOT` walk to cover all `contexts/*` directories (one-line edit).
  - All new endpoints require `Authorization: Bearer …`; no anonymous
    surfaces (FR-001).
  - No background workers, no queues, no caches *in Postgres*. The search
    cache is process-local, just like the auth rate limiter.
  - No songs table. The existing instrument catalog is lifted to
    `campfire_api.shared.catalogs` because this is the first slice where
    two bounded contexts need the same vocabulary; no additional catalogs
    are introduced.
  - Cover-art URL is stored as a reference; no binary/blob copy is
    fetched or persisted (FR-013).
**Scale/Scope**: Demo-grade. Tens of users, tens of repertoire entries
per user. Pagination for the user's own list is **not** required by the
spec (FR-009 says "all entries"); we render the full list client-side.
Search results are paginated 10 per page via Deezer's `index`/`limit`
params (FR-002).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution: `.specify/memory/constitution.md` v1.1.0.

| Principle / Invariant | Status | Evidence |
|---|---|---|
| **I. Narrow MVP Scope** | ✅ Pass | Slice implements one of the three sanctioned MVP jobs ("record songs a user already knows" + "capture songs the user is still learning" via the `learning` proficiency tier). The spec's §Out-of-scope list (sharing, groups, recommendations, "What to Practice", notes, tags, playlists, bulk add, import) is honored — none of those appear in `data-model.md`, `contracts/`, or `tasks` work. The design slice surfaces a "Wishlist" tab and an optional "Note" field; both are explicitly **deferred** in this plan (see "Design-vs-spec divergences"). |
| **II. Incremental Delivery** | ✅ Pass with documented sequencing | Build order is frontend-first behind a mock, then backend, per the constitution. In practice the frontend slice and the backend slice land together because they share an OpenAPI snapshot — but the frontend's mock mode (powered by the existing `VITE_API_URL` swap and a `repertoire.mock.ts` fallback) lets the frontend run end-to-end before the backend is wired. LocalStack is still deferred — this slice has no AWS service to emulate (Deezer is a public HTTPS API, not an AWS surface). |
| **III. Boring, Proven Stack** | ✅ Pass | Same Python / FastAPI / SQLAlchemy / Postgres stack. The only new runtime dependency is `httpx` (already in dev deps), promoted to a runtime dep for the Deezer adapter. No new language, framework, ORM, queue, cache, or cloud provider. |
| **IV. Proportional Rigor** | ✅ Pass | Tests are scoped to: (a) use-case unit tests against fake repositories + a fake `SongCatalogPort`, (b) HTTP integration tests against Testcontainers Postgres with the upstream catalog **stubbed via a dependency override**, (c) one OpenAPI snapshot test, (d) one extension of the architecture test to cover `contexts/repertoire/`. No load tests. No e2e browser tests. No contract tests against the live Deezer API (the spec covers degradation, not upstream conformance). |
| **V. Docs-as-Code, Continuously** | ✅ Pass | Slice ships `docs/backend/repertoire.mdx` (one page: bounded-context summary, search-flow sequence diagram, error catalog, env vars) and updates `docs/docs.json` to register it under `BACKEND`. The OpenAPI snapshot at `specs/003-repertoire-song-entry/contracts/openapi.json` is committed and a contract test fails CI on drift. |
| **Backend Architecture Invariant 1 — Slicing by bounded context** | ✅ Pass | New code lives under `apps/api/src/campfire_api/contexts/repertoire/{domain,application,adapters}`. The repertoire context owns its own `domain/`, `application/`, and `adapters/` folders mirroring identity 1:1. |
| **Backend Architecture Invariant 2 — Layer purity enforced by test** | ✅ Pass | The existing `tests/unit/test_architecture.py` is extended (one-line change) so its `ROOT` covers `apps/api/src/campfire_api/contexts/` rather than only `…/contexts/identity`. The same `BANNED = {"fastapi", "sqlalchemy", "argon2", "jose"}` set applies. `httpx` is added to `BANNED` so the Deezer client cannot leak into `domain/` or `application/`. |
| **Backend Architecture Invariant 3 — Cross-context references via identifier value objects** | ✅ Pass | Repertoire imports `from campfire_api.contexts.identity.domain.value_objects import UserId` as the only identity-context domain surface. It does **not** import `User`, `UserRow`, `UserRepository`, identity use cases, or `identity.domain.catalogs`. The instrument catalog is shared through `campfire_api.shared.catalogs.INSTRUMENTS`, which is outside any bounded context and is re-exported by identity for existing callers. |
| **Backend Architecture Invariant 4 — Application errors translate to HTTP only at adapter boundary** | ✅ Pass | Use cases raise `RepertoireError` subclasses (`InstrumentUnknown`, `ProficiencyUnknown`, `SearchQueryTooShort`, `EntryNotFound`, `EntryForbidden`, `DuplicateEntry`, `SongCatalogUnavailable`, `SongCatalogRateLimited`, `SearchRateLimited`). A new `register_repertoire_error_handlers(app)` wires the exception handler at app construction. No use case raises `HTTPException`. |
| **Backend Architecture Invariant 5 — Persistence transactions have an explicit boundary** | ✅ Pass | The repertoire HTTP adapter reuses the identity slice's `unit_of_work` pattern. `get_repertoire_repositories` (a new FastAPI dep) opens an `AsyncSession`, yields it, and commits/rolls back in the request lifecycle. Use cases never call `session.commit()`. No new triggers in this slice — search results are read-only and follow the same request-scoped session even though they perform no DB writes. |
| **Backend Architecture Invariant 6 — Validation lives at the layer it actually protects** | ✅ Pass | Pydantic schemas validate transport (e.g., `instrument: str`, `proficiency: Literal["learning","practicing","ready"]`). Domain value objects (`Instrument`, `ProficiencyLevel`, `SongExternalId`) re-validate on construction (so a misconfigured fake repo or a bypass via direct use-case call still fails closed). The duplicate-prevention rule (FR-008) is enforced **once** in the domain (uniqueness invariant on the `(user_id, song_external_id, instrument)` tuple inside the `AddOrUpdateEntry` use case) and **once** at the DB (partial unique index, last line of defense against a concurrent insert race — FR-008 / SC-005 / Edge "double-submit"). |
| **Backend Architecture Invariant 7 — Settings and time are ports, not modules** | ✅ Pass | The Deezer base URL, search-cache TTL, search-cache size, and per-user rate-limit window are added to `SettingsProvider`. `domain/` and `application/` read time only via the existing identity `Clock` Protocol (re-exported as `repertoire.domain.ports.Clock` to keep the dependency direction explicit). No `os.getenv` and no `datetime.utcnow()` in `domain/`/`application/`. |

**Re-check after Phase 1**: still passing (see "Phase 1 re-check" near
the bottom).

## Project Structure

### Documentation (this feature)

```text
specs/003-repertoire-song-entry/
├── plan.md              # This file
├── spec.md              # Already exists
├── research.md          # Phase 0 — catalog provider, rate-limiter shape, FE/BE proxy decision
├── data-model.md        # Phase 1 — repertoire_entries + denormalized song fields
├── quickstart.md        # Phase 1 — clone → up → migrate → run → sign in → add a song
├── contracts/
│   └── openapi.json     # Phase 1 — committed snapshot (drift-tested in CI)
├── adr/
│   ├── 0007-external-music-catalog-provider.md   # Why Deezer, alternatives rejected
│   ├── 0008-no-songs-aggregate-yet.md            # Denormalize-on-add vs. shared songs table
│   └── 0009-search-proxied-through-backend.md    # vs. browser-direct catalog calls
├── checklists/
│   └── requirements.md  # Already exists (from /speckit.specify)
└── tasks.md             # /speckit.tasks output (NOT created by this command)
```

### Source Code (repository root)

```text
apps/
├── api/
│   ├── alembic/versions/
│   │   └── 0003_repertoire_initial.py            # NEW — repertoire_entries table + indexes
│   ├── src/campfire_api/
│   │   ├── main.py                                # MODIFIED — include repertoire router; register error handlers
│   │   ├── settings.py                            # MODIFIED — add deezer_base_url, search_cache_ttl, search_cache_size, search_rate_limit_*
│   │   ├── shared/
│   │   │   ├── __init__.py
│   │   │   └── catalogs.py                         # NEW — INSTRUMENTS shared by identity + repertoire
│   │   └── contexts/
│   │       ├── identity/                          # MODIFIED — catalogs.py re-exports shared INSTRUMENTS
│   │       └── repertoire/                        # NEW
│   │           ├── __init__.py
│   │           ├── domain/
│   │           │   ├── __init__.py
│   │           │   ├── entities.py                # RepertoireEntry, SearchResult (read model — pure dataclasses)
│   │           │   ├── value_objects.py           # RepertoireEntryId, SongExternalId, Instrument, ProficiencyLevel
│   │           │   ├── ports.py                   # RepertoireEntryRepository, SongCatalogPort, SearchCachePort, SearchRateLimiter, Clock (re-exported)
│   │           │   └── errors.py                  # RepertoireError + subclasses
│   │           ├── application/
│   │           │   └── use_cases/
│   │           │       ├── __init__.py
│   │           │       ├── search_songs.py        # debounce/cache/rate-limit live in adapters; this orchestrates the port calls
│   │           │       ├── add_or_update_entry.py # FR-007 / FR-008 — duplicate becomes proficiency update
│   │           │       ├── list_my_entries.py    # FR-009
│   │           │       ├── update_proficiency.py # FR-011
│   │           │       └── remove_entry.py       # FR-010 (hard delete) + FR-012 (ownership check)
│   │           └── adapters/
│   │               ├── http/
│   │               │   ├── __init__.py
│   │               │   ├── routers/
│   │               │   │   ├── __init__.py
│   │               │   │   └── repertoire.py     # GET /repertoire/songs/search, GET/POST /repertoire/entries, PATCH/DELETE /repertoire/entries/{id}
│   │               │   ├── schemas.py             # SearchResultResponse, EntryRequest, EntryResponse
│   │               │   ├── deps.py                # get_repertoire_repositories (Unit of Work), get_song_catalog, get_search_cache, get_search_rate_limiter
│   │               │   └── error_mapping.py      # register_repertoire_error_handlers
│   │               ├── persistence/
│   │               │   ├── __init__.py
│   │               │   ├── models.py              # RepertoireEntryRow (separate Base or reuse identity Base — see "Persistence wiring")
│   │               │   ├── mappers.py
│   │               │   └── repertoire_entry_repository.py
│   │               ├── catalog/
│   │               │   ├── __init__.py
│   │               │   ├── deezer_song_catalog.py # SongCatalogPort impl using httpx.AsyncClient against api.deezer.com
│   │               │   └── fake_song_catalog.py   # In-memory fixture catalog used by integration tests via dep override
│   │               ├── caching/
│   │               │   └── ttl_search_cache.py    # In-process LRU + TTL cache for search responses
│   │               └── rate_limiting/
│   │                   └── in_memory_search_limiter.py  # Per-user-id rolling window; mirrors identity's auth limiter
│   └── tests/
│       ├── unit/
│       │   ├── test_architecture.py               # MODIFIED — extend ROOT to all contexts/, add httpx to BANNED
│       │   └── repertoire/
│       │       ├── __init__.py
│       │       ├── test_add_or_update_entry.py
│       │       ├── test_list_my_entries.py
│       │       ├── test_update_proficiency.py
│       │       ├── test_remove_entry.py
│       │       └── test_search_songs.py           # Uses fake SongCatalogPort
│       ├── integration/
│       │   └── repertoire/
│       │       ├── __init__.py
│       │       ├── test_repertoire_routes.py      # End-to-end against Testcontainers Postgres + fake_song_catalog override
│       │       └── test_authorization.py          # FR-012 / SC-004 — cross-user access is rejected
│       └── contract/
│           └── test_repertoire_openapi_snapshot.py  # NEW — diff against specs/003-…/contracts/openapi.json (the existing identity snapshot test stays unchanged)
└── web/
    └── src/
        ├── api/
        │   └── client.ts                          # UNCHANGED — auth client already supports arbitrary paths
        ├── features/
        │   └── repertoire/                        # NEW slice
        │       ├── index.ts
        │       ├── types.ts                       # Entry, ProficiencyLevel, SearchResult, Instrument
        │       ├── catalogs.ts                    # PROFICIENCY_LEVELS (single source of truth, mirrored from backend)
        │       ├── api/
        │       │   └── repertoire.api.ts          # searchSongs, listEntries, addOrUpdateEntry, updateProficiency, removeEntry
        │       ├── store/
        │       │   └── repertoire.store.ts        # Local store: list cache, in-flight search, debounce timer
        │       └── components/
        │           ├── RepertoireList.tsx
        │           ├── EmptyState.tsx
        │           ├── AddSongModal.tsx           # Owns search input, results list, configure form, save button
        │           ├── SearchResultRow.tsx
        │           ├── EntryConfigureForm.tsx     # Instrument chips + proficiency picker
        │           ├── EntryRow.tsx
        │           └── RemoveEntryDialog.tsx
        ├── pages/
        │   ├── HomePage.tsx                       # MODIFIED — link the YOUR REPERTOIRE tile to /repertoire
        │   └── RepertoirePage.tsx                 # NEW — composes the repertoire components
        ├── i18n/
        │   ├── locales/
        │   │   ├── en.ts                          # MODIFIED — add repertoire.* keys
        │   │   └── pt.ts                          # MODIFIED — add repertoire.* keys
        │   └── types.ts                           # UNCHANGED
        └── styles/
            └── global.css                         # MODIFIED — add repertoire-specific selectors that reuse existing tokens (no new color palette)
```

**Structure Decision**: web-application split, identical to spec 002. The
`apps/api/` tree gains a sibling under `contexts/` — `repertoire/` —
mirroring the identity layout. The `apps/web/` tree gains a sibling under
`features/` — `repertoire/` — mirroring `auth/` and `onboarding/`. Adding a
context is a sibling-folder add, not a refactor; no shared modules need to
move.

### Persistence wiring

The identity slice's SQLAlchemy `DeclarativeBase` lives inside the
identity persistence package (`identity/adapters/persistence/models.py`).
Because Alembic only autogenerates against tables it can see at metadata
import time, this slice **reuses** the same `Base` rather than declaring
a new one. We do this by importing
`from campfire_api.contexts.identity.adapters.persistence.models import Base`
inside `repertoire/adapters/persistence/models.py`. The shared `Base`
lives in adapter code, not in domain, so cross-context invariant 3 still
holds (the import is between two adapter packages, not into either
domain).

If a future context needs an isolated metadata (e.g., it lives in a
different schema or its tables are managed by a different migration
tree), we will lift `Base` to a `shared/persistence/base.py` at that
point — not preemptively.

### Architecture guard rails (delta from spec 002)

- `apps/api/tests/unit/test_architecture.py`:
  - `ROOT` becomes
    `Path(__file__).resolve().parents[2] / "src" / "campfire_api" / "contexts"`
    so it walks all contexts.
  - `BANNED = {"fastapi", "sqlalchemy", "argon2", "jose", "httpx"}` —
    `httpx` is added so the Deezer client cannot leak into a use case.
- `ruff` `flake8-tidy-imports.banned-modules`: extend the existing rule
  set with the same expansion (`httpx` banned in `**/domain/**` and
  `**/application/**` for every context).

### Migration strategy

- Hand-written migration `0003_repertoire_initial.py` (per spec 002's
  "no autogenerate without review" rule).
- DDL: one new table `repertoire_entries`; one partial unique index;
  one helper index on `(user_id, created_at DESC)` for FR-009 list
  rendering.
- `downgrade()` drops the table; safe because nothing else references
  it.
- No data backfill (this is a brand-new context with no existing rows).

### Contract testing strategy

The existing identity snapshot test at
`apps/api/tests/contract/test_openapi_snapshot.py` compares the **whole**
`create_app().openapi()` against the identity snapshot file. Adding a
repertoire router changes `create_app().openapi()` so the existing
identity test would fail unless we either (a) regenerate the identity
snapshot to include repertoire paths, or (b) split the test.

**Decision**: regenerate the identity snapshot in this slice (path
unchanged: `specs/002-backend-auth-slice/contracts/openapi.json`) so it
captures the full app, and add a second, repertoire-only test at
`apps/api/tests/contract/test_repertoire_openapi_snapshot.py` that asserts
every path/component in `specs/003-repertoire-song-entry/contracts/openapi.json`
is present in the live OpenAPI document. This keeps both files
authoritative for their slice's surface and avoids cross-slice churn:
adding a fourth slice later only edits its own snapshot plus the global
identity snapshot (which already has the full app). The *name* of the
identity test stays — only its committed JSON regenerates.

Rationale rejected: keeping the identity snapshot frozen and downgrading
its assertion to "subset" would silently allow accidental removal of
identity paths. The full-document equality is load-bearing.

### Env var contract (delta)

| Variable | Required | Default (dev) | Notes |
|---|---|---|---|
| `DEEZER_BASE_URL` | no | `https://api.deezer.com` | The whole Deezer surface this slice uses is `GET /search?q=...&index=...&limit=10`. |
| `SEARCH_CACHE_TTL_SECONDS` | no | `60` | In-memory cache of `(user_id, normalized_query, page)` → response. 60 s catches the user backspacing into the same query. |
| `SEARCH_CACHE_MAX_ENTRIES` | no | `1024` | LRU eviction; bounds memory. |
| `SEARCH_RATE_LIMIT_PER_WINDOW` | no | `30` | FR-016: per-authenticated-user requests per window. |
| `SEARCH_RATE_LIMIT_WINDOW_SECONDS` | no | `60` | Rolling window; matches the auth limiter's shape. |

All five are read through `SettingsProvider` (constitution invariant 7).
A future `AwsSecretsManagerSettingsProvider` swap (deferred to the
infrastructure slice) needs no application code changes.

### `apps/web/` changes (in this slice)

- `apps/web/src/features/repertoire/` — entire new slice as listed above.
- `apps/web/src/pages/HomePage.tsx` — replace the placeholder
  "YOUR REPERTOIRE" affordance with a link/router push to
  `/repertoire` (FR-015).
- `apps/web/src/pages/RepertoirePage.tsx` — composes
  `RepertoireList`, `AddSongModal`, and `RemoveEntryDialog`.
- `apps/web/src/i18n/locales/en.ts` and `pt.ts` — add a `repertoire`
  namespace covering empty-state copy, the three proficiency labels and
  hints, search empty/no-result/unavailable copy, configure-form
  labels, and toast messages.
- `apps/web/src/styles/global.css` — additive only; reuses the existing
  TOKENS palette from the design slice (no new tokens introduced).
- The existing `client.ts` token-attachment / refresh-on-401 logic is
  unchanged; the repertoire API module just calls `request<T>(...)`.

### Design-vs-spec divergences (deferred extras)

The Claude-Design bundle includes several patterns that are **not** in
the spec; this plan treats them as design-future. They are listed here
explicitly so a reviewer can confirm the deferral and so the tasks
phase doesn't accidentally pull them in:

1. **Wishlist tab** (separate "songs I want to learn" lane) — out of
   scope. The spec's three proficiency levels (`learning` /
   `practicing` / `ready`) carry the "still working on it" semantics
   without a separate concept. Adding a wishlist would also require
   cross-tab counters, "start learning" promotion flow, and dedicated
   storage that the spec does not authorize.
2. **Optional per-entry note** — out of scope. Not in the spec's FRs or
   key entities. Easy to add later as a single nullable `TEXT` column
   without breaking the contract.
3. **Filter chips by instrument / sort by recency** — out of scope.
   FR-009 says "view all entries"; the design's filter affordance can
   land in a follow-up without schema change (it's pure client-side
   filtering over the same response).
4. **"Add manually" free-text fallback in search** — explicitly
   forbidden by the Edge Case "Search returns no results: not allowed
   to fabricate a free-text song" and FR-002 (results from external
   catalog only) and FR-004 (stable external catalog identifier
   required).
5. **Undo on delete** — out of scope. FR-010 says removal is hard
   delete and re-add starts fresh. Implementing undo would require
   short-lived soft-delete state; the spec rejects soft delete.
6. **YouTube link paste** — placeholder in the search empty state copy
   only; no implementation. Not in any FR.

The visual language (TOKENS, type stack, motion, layout) **is**
adopted; only the extra concepts above are deferred.

## Phase 0: Outline & Research

See [research.md](./research.md). Decisions paired with alternatives:

- **External catalog provider**: Deezer public Search API
  (`https://api.deezer.com/search`) vs. MusicBrainz, Spotify Web API,
  Apple Music API, iTunes Search, Last.fm. Decision factors: no API key
  required (matches "demo-grade" budget), CORS not required because we
  proxy server-side, generous unbenchmarked rate limit, returns
  title/artist/album/release year/cover art URL in one call. **ADR-0007**
  captures the comparison and the migration plan if Deezer's terms
  change. Alternatives' rejection notes are in `research.md`.
- **Search topology**: backend proxy vs. browser-direct call to Deezer.
  Decided **backend proxy** because (a) FR-016 requires server-side
  per-user rate limiting and a server-side cache, neither of which are
  reachable from the browser; (b) FR-013 wants stable schema control —
  if Deezer changes its response, we shape it once at the adapter, not
  per-component; (c) authentication: an unauthenticated user MUST NOT
  reach search (FR-001), and an httpOnly cookie can't sign cross-origin
  Deezer calls. **ADR-0009** documents the trade-off (extra hop adds
  latency; cache mostly amortizes it for repeat queries).
- **Songs aggregate vs. denormalized at-add-time**: a separate `songs`
  table referenced by FK from `repertoire_entries` was considered and
  rejected for v1 because (a) no second feature consumes a "song", so
  it would be premature normalization, (b) FR-013 explicitly requires
  the entry to remain readable when the catalog is unreachable —
  denormalization is the simplest implementation of that invariant,
  (c) the (user, song, instrument) uniqueness rule is a constraint on
  the **entry**, not on a song row. **ADR-0008**.
- **Proficiency vocabulary location**: domain module vs. shared
  catalogs module. Decision: keep it inside
  `repertoire.domain.value_objects` (as a `frozenset[str]` or `Enum`)
  so it lives next to the use cases that interpret it. Identity's
  `experience` set is unrelated (career length, not per-song skill);
  reusing the same `catalogs` module would couple the two contexts on a
  shared file change.
- **Search cache shape**: process-local TTL+LRU vs. shared (Redis).
  Decided process-local for the same reasons spec 002 picked an
  in-process auth rate limiter — single dev process today, and a
  shared store is a later-slice concern when horizontal scaling
  starts. The lift to a shared store is one adapter swap behind the
  `SearchCachePort` Protocol.
- **Pagination contract**: `page` query param vs. `index`+`limit` (Deezer
  native). Decided `page` (1-indexed) on our wire so the frontend stays
  provider-agnostic; the adapter translates to Deezer's `index` /
  `limit`. **research.md** captures the math.
- **Cover art**: store URL only vs. proxy bytes. URL only — FR-013
  explicitly says reference-only and the entry must still render its
  textual fields if the URL becomes unreachable (the `<img>` falls back
  to a CSS placeholder; no backend code path on URL failure).
- **`uuid_utils` for entry IDs**: reused unchanged — same UUID v7
  pattern as identity entities (ADR-004).

**Output**: `research.md` with no NEEDS CLARIFICATION markers remaining.

## Phase 1: Design & Contracts

- **Data model** ([data-model.md](./data-model.md)): one new table
  `repertoire_entries`. Columns: `id` (UUID), `user_id` (UUID FK),
  `instrument` (TEXT), `proficiency` (TEXT), `song_external_id`
  (TEXT), `song_title` (TEXT), `song_artist` (TEXT), `song_album`
  (TEXT NULL), `song_release_year` (INTEGER NULL), `song_cover_art_url`
  (TEXT NULL), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
  Constraints: PK on `id`; FK `user_id → users(id) ON DELETE CASCADE`;
  CHECK on `proficiency IN ('learning','practicing','ready')`; CHECK on
  `length(song_external_id) BETWEEN 1 AND 128`; CHECK on
  `song_release_year BETWEEN 1900 AND 2100` (NULL allowed); UNIQUE INDEX
  `ux_repertoire_entries_user_song_instrument` on
  `(user_id, song_external_id, instrument)` (defense for FR-008 /
  SC-005). Helper index `ix_repertoire_entries_user_recent` on
  `(user_id, created_at DESC)` for the list query (FR-009).
  Instrument-vocabulary validation is **not** a DB CHECK (per spec 002
  precedent — preferences.instruments is JSONB without a CHECK; the
  domain validates against `campfire_api.shared.catalogs.INSTRUMENTS`
  application-side, which keeps the catalog update path single-source).
- **Contracts** ([contracts/openapi.json](./contracts/openapi.json)):
  initial OpenAPI 3.1 draft committed; regenerated from the running
  app via `make openapi-snapshot` (existing target). New paths:
  - `GET /repertoire/songs/search?q=&page=` — auth required; returns
    `{ results: SearchResult[], page, hasMore }`.
  - `GET /repertoire/entries` — auth required; returns
    `{ entries: Entry[] }`.
  - `POST /repertoire/entries` — auth required; body
    `{ songExternalId, songTitle, songArtist, songAlbum?, songReleaseYear?, songCoverArtUrl?, instrument, proficiency }`;
    returns `Entry`. Duplicate-by-(user, song, instrument) becomes a
    **proficiency update** in place, returning `200 OK` with the
    updated entry plus a header `X-Repertoire-Action: updated` so the
    frontend can show the "already in list — proficiency updated"
    affordance from the design (the duplicate-error state in the
    design is a UX hint surfaced by the frontend store, not a 4xx).
  - `PATCH /repertoire/entries/{id}` — auth required; body
    `{ proficiency }`; ownership-checked.
  - `DELETE /repertoire/entries/{id}` — auth required;
    ownership-checked; hard delete; returns `204 No Content`.
  Error shapes follow the identity slice's `{ "message": "…" }` envelope.
- **Quickstart** ([quickstart.md](./quickstart.md)): clone → docker
  compose up postgres → `make migrate` → `make seed` (identity-side
  Ada user) → `make run` → `pnpm --filter @campfire/web dev` → sign
  in as `ada@campfire.test` → click YOUR REPERTOIRE tile → search
  "wonderwall" → pick result → pick Guitar → pick Practicing → save.
- **ADRs** under [adr/](./adr/): three (catalog provider, no songs
  aggregate yet, search-proxied-through-backend).
- **Agent context update**: this plan replaces the
  `002-backend-auth-slice/plan.md` reference inside the
  `<!-- SPECKIT START --> … <!-- SPECKIT END -->` markers in
  `AGENTS.md` (and its `CLAUDE.md` symlink) with this file's path.

### Phase 1 re-check (post-design constitution)

| Gate | Status |
|---|---|
| I. Narrow MVP Scope | ✅ Still pass — design-future extras are explicitly deferred above. |
| II. Incremental Delivery | ✅ Still pass — frontend has a mock fallback path; LocalStack still deferred. |
| III. Boring, Proven Stack | ✅ Still pass — only `httpx` (already a dev dep) crosses into runtime. |
| IV. Proportional Rigor | ✅ Still pass — test budget is unit + integration + one snapshot + one architecture extension. |
| V. Docs-as-Code | ✅ Still pass — `docs/backend/repertoire.mdx` ships in the same change set. |
| Backend invariants 1-7 | ✅ Still pass — see the Constitution Check table; no design choice introduced a violation. |

## Out of Scope (this slice)

- Wishlist / "songs I want to learn" as a separate concept (see
  divergence #1).
- Per-entry notes, tags, playlists (divergence #2, #3).
- Bulk import or CSV upload (spec §Out of Scope).
- Group sharing, social visibility, follower mechanics (spec §Out of
  Scope; constitution Principle I).
- "What to Practice" recommendation logic (spec §Out of Scope).
- Soft delete / undo (FR-010 explicitly hard delete).
- Browser-direct catalog calls (rejected in research.md / ADR-0009).
- A shared songs table or external-id catalog cache as a real
  aggregate (rejected in ADR-0008).
- LocalStack, Terraform, ECS, observability stack — all still
  deferred per spec 002's plan.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Two adapter packages share one SQLAlchemy `Base` (`identity/adapters/persistence/models.py` is imported by `repertoire/adapters/persistence/models.py`) | Alembic autogenerate / metadata reflection only sees tables registered against a single `MetaData`. Splitting `Base` per context would mean either two Alembic configs or a manual import-everything aggregator — both heavier than the import. | A `shared/persistence/base.py` was the cleaner long-term home; declined for now because lifting it preemptively would mean editing identity-context files in this slice for purely cosmetic reasons. The lift is documented as a follow-up trigger when context #3 lands. |
| Frontend ships a mock `repertoire.mock.ts` swap behind `VITE_API_URL` | Constitution Principle II asks for frontend-first delivery with mocked data so the slice is demonstrable before backend wiring. | Skipping the mock and only running with the real backend would force end-to-end demo readiness in a single commit, defeating the point of the build sequence. The mock is ~50 lines and lives next to the real client. |
