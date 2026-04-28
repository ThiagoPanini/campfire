---
description: "Task list for the Campfire repertoire song-entry slice (repertoire context)"
---

# Tasks: Campfire Repertoire Song Entry

**Input**: Design documents from `/specs/003-repertoire-song-entry/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.json, quickstart.md, .claude/design/campfire-v3/

**Tests**: Unit tests for the domain and the use-case layer are MANDATORY (per plan.md Phase 1 and Constitution Principle IV). Integration tests against a real Postgres are MANDATORY for every route added in this slice (per the user instruction "Every route added in this slice must be covered by both an integration test against a real Postgres instance and an OpenAPI snapshot update", continuing the Spec 002 convention).

**External dependency note**: The Deezer search adapter is the slice's only network dependency. Every test that exercises a code path crossing `SongCatalogPort` MUST stub the port at the adapter boundary — either via a `FakeSongCatalog` fixture used in unit tests or via a FastAPI dependency override that swaps `DeezerSongCatalog` for `FakeSongCatalog` in integration tests. No test in this slice hits `api.deezer.com`.

**Organization**: Tasks are grouped by the eight delivery phases mirroring Spec 002 (setup → domain → adapters → use cases → routers → frontend wiring → docs → acceptance). Use-case, router, and frontend-component tasks carry user-story labels (`[US1]`–`[US4]`) so each journey can be traced through the stack.

## User Stories Reference

- **US1** — Add a song to my repertoire (P1, demo-critical).
- **US2** — View my repertoire (P1, co-dependent with US1 for usable MVP).
- **US3** — Remove a song from my repertoire (P2).
- **US4** — Update proficiency on an existing entry (P3).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel — different files, no incomplete dependencies.
- **[Story]**: Maps to a user story. Setup / foundational / docs / acceptance tasks have no story label.
- File paths are absolute from the repo root.

## Path Conventions

- Backend: `apps/api/src/campfire_api/contexts/repertoire/` (new), `apps/api/alembic/versions/` (new migration).
- Frontend: `apps/web/src/features/repertoire/` (new slice).
- Docs: `docs/backend/repertoire.mdx`, `docs/docs.json`.
- Spec artefacts: `specs/003-repertoire-song-entry/`.

---

## Phase 1: Setup (Repertoire-side scaffolding)

**Purpose**: Extend the existing `apps/api/` project to host a second bounded context. No new project skeleton — Spec 002 already stood that up. This phase widens the architecture guard rails, registers new env vars, and reserves the migration revision.

- [X] T001 Extend the architecture-guard test at [apps/api/tests/unit/test_architecture.py](apps/api/tests/unit/test_architecture.py): change `ROOT` to walk every directory under `apps/api/src/campfire_api/contexts/` (not just `identity/`) and add `"httpx"` to the `BANNED` set so the Deezer client cannot be imported from any `domain/` or `application/` module of any context.
- [X] T002 [P] Extend the ruff `flake8-tidy-imports.banned-modules` rule set in [apps/api/pyproject.toml](apps/api/pyproject.toml) so `httpx` is banned in `**/domain/**` and `**/application/**` for every context (mirrors the existing `fastapi` / `sqlalchemy` / `argon2` / `jose` rules).
- [X] T003 [P] Promote `httpx` from a dev dependency to a runtime dependency in [apps/api/pyproject.toml](apps/api/pyproject.toml) (it is already in dev deps for tests). Run `uv sync` to refresh `apps/api/uv.lock`.
- [X] T004 [P] Extend the `SettingsProvider` model in [apps/api/src/campfire_api/settings.py](apps/api/src/campfire_api/settings.py) with the five env vars from plan.md §Env var contract (delta): `DEEZER_BASE_URL` (default `https://api.deezer.com`), `SEARCH_CACHE_TTL_SECONDS` (default `60`), `SEARCH_CACHE_MAX_ENTRIES` (default `1024`), `SEARCH_RATE_LIMIT_PER_WINDOW` (default `30`), `SEARCH_RATE_LIMIT_WINDOW_SECONDS` (default `60`). Expose them via async-friendly accessors (`deezer_base_url()`, etc.) so a future Secrets-Manager swap stays seamless.
- [X] T005 [P] Append the new env vars and their dev defaults to [apps/api/.env.example](apps/api/.env.example).
- [X] T006 [P] Reserve the migration revision file at [apps/api/alembic/versions/0003_repertoire_initial.py](apps/api/alembic/versions/0003_repertoire_initial.py) with `down_revision = "0002_seed_ada"`, `revision = "0003_repertoire_initial"`, and empty `upgrade()` / `downgrade()` bodies. The DDL is filled in by T023. In the same setup phase, move the shared instrument catalog source to [apps/api/src/campfire_api/shared/catalogs.py](apps/api/src/campfire_api/shared/catalogs.py): create `shared/__init__.py`, define `INSTRUMENTS` with the existing 12 values from `identity.domain.catalogs`, and update [apps/api/src/campfire_api/contexts/identity/domain/catalogs.py](apps/api/src/campfire_api/contexts/identity/domain/catalogs.py) to re-export that same object for identity's existing callers. This avoids a repertoire-domain import from the identity bounded context while keeping one backend source of truth.

**Checkpoint**: `pytest -m unit -q` and `ruff check .` still pass against the existing identity slice; `make migrate` is a no-op (the new revision is empty).

---

## Phase 2: Repertoire Domain (Foundational, pure Python — no FastAPI, no SQLAlchemy, no httpx)

**Purpose**: Framework-free entities, value objects, ports, and errors that every later phase consumes. Blocks all downstream work.

**Parallel rule**: Tasks that touch different files run in parallel; they all depend on T001 (architecture guard) being green.

- [X] T007 [P] Create the package skeleton (empty `__init__.py` files) at [apps/api/src/campfire_api/contexts/repertoire/__init__.py](apps/api/src/campfire_api/contexts/repertoire/__init__.py), [apps/api/src/campfire_api/contexts/repertoire/domain/__init__.py](apps/api/src/campfire_api/contexts/repertoire/domain/__init__.py), [apps/api/src/campfire_api/contexts/repertoire/application/__init__.py](apps/api/src/campfire_api/contexts/repertoire/application/__init__.py), [apps/api/src/campfire_api/contexts/repertoire/application/use_cases/__init__.py](apps/api/src/campfire_api/contexts/repertoire/application/use_cases/__init__.py), and [apps/api/src/campfire_api/contexts/repertoire/adapters/__init__.py](apps/api/src/campfire_api/contexts/repertoire/adapters/__init__.py).
- [X] T008 [P] Create value objects at [apps/api/src/campfire_api/contexts/repertoire/domain/value_objects.py](apps/api/src/campfire_api/contexts/repertoire/domain/value_objects.py): `RepertoireEntryId` (UUID v7 via local `new_uuid()` wrapper around `uuid_utils.uuid7` with v4 fallback per research §R9), `SongExternalId` (str, normalize-strip, length 1–128), `Instrument` (str validated against `campfire_api.shared.catalogs.INSTRUMENTS`, length 1–64), `ProficiencyLevel` (`Literal["learning","practicing","ready"]`), and the `PROFICIENCY_LEVELS = frozenset({"learning","practicing","ready"})` constant. No import from `identity.domain.catalogs` is allowed in the repertoire context.
- [X] T009 [P] Create entities at [apps/api/src/campfire_api/contexts/repertoire/domain/entities.py](apps/api/src/campfire_api/contexts/repertoire/domain/entities.py) as plain dataclasses (no ORM, no Pydantic): `RepertoireEntry` (with all fields from data-model.md §Entity: RepertoireEntry, including the denormalized song columns), and the `SearchResult` read-model dataclass (frozen, fields per data-model.md §Read models).
- [X] T010 [P] Create domain ports at [apps/api/src/campfire_api/contexts/repertoire/domain/ports.py](apps/api/src/campfire_api/contexts/repertoire/domain/ports.py) as `typing.Protocol` classes: `RepertoireEntryRepository` (async `get_by_id`, `get_by_user_song_instrument`, `list_by_user`, `add`, `update`, `delete`), `SongCatalogPort` (async `search(query: str, page: int) -> tuple[list[SearchResult], bool]` returning `(results, has_more)`), `SearchCachePort` (async `get(key) / set(key, value)` keyed by `(user_id, normalized_query, page)`), `SearchRateLimiter` (async `check(user_id) -> None` raising `SearchRateLimited` on miss), and re-export the identity `Clock` Protocol as `repertoire.domain.ports.Clock` so domain/application never imports identity adapter code.
- [X] T011 [P] Create domain errors at [apps/api/src/campfire_api/contexts/repertoire/domain/errors.py](apps/api/src/campfire_api/contexts/repertoire/domain/errors.py): `RepertoireError` base + `InstrumentUnknown`, `ProficiencyUnknown`, `SearchQueryTooShort`, `EntryNotFound`, `EntryForbidden`, `DuplicateEntry`, `SongCatalogUnavailable`, `SongCatalogRateLimited`, `SearchRateLimited`. No `HTTPException` import — translation lives at the adapter boundary (constitution invariant 4).
- [X] T012 [P] Unit tests for value-object and entity invariants at [apps/api/tests/unit/repertoire/__init__.py](apps/api/tests/unit/repertoire/__init__.py) and [apps/api/tests/unit/repertoire/test_value_objects.py](apps/api/tests/unit/repertoire/test_value_objects.py): `SongExternalId` normalization + length floor/ceiling, `Instrument` rejects values outside `campfire_api.shared.catalogs.INSTRUMENTS` (raises `InstrumentUnknown`), `ProficiencyLevel` rejects free-text (raises `ProficiencyUnknown`), `RepertoireEntry` constructor enforces non-empty title/artist after strip and ≤256 chars, `release_year` accepts `None` and rejects 1899 / 2101.

**Checkpoint**: `pytest -m unit apps/api/tests/unit/repertoire/ -q` passes. The architecture-guard test (T001) is still green — no banned import has crept into `repertoire/domain/`.

---

## Phase 3: Repertoire Adapters (Foundational)

**Purpose**: Concrete persistence, catalog, caching, and rate-limiting adapters for the repertoire context. Blocks Phase 4 use cases.

- [X] T013 [P] SQLAlchemy 2.x `RepertoireEntryRow` model at [apps/api/src/campfire_api/contexts/repertoire/adapters/persistence/__init__.py](apps/api/src/campfire_api/contexts/repertoire/adapters/persistence/__init__.py) and [apps/api/src/campfire_api/contexts/repertoire/adapters/persistence/models.py](apps/api/src/campfire_api/contexts/repertoire/adapters/persistence/models.py): import `Base` from `campfire_api.contexts.identity.adapters.persistence.models` (per plan.md §Persistence wiring — adapter↔adapter cross-context import, domain stays isolated). Match the schema in [data-model.md](specs/003-repertoire-song-entry/data-model.md): UUID v7 PK, `TIMESTAMPTZ` columns, `TEXT` columns with CHECKs (length, year range, proficiency enum), FK `user_id → users(id) ON DELETE CASCADE`, unique index `ux_repertoire_entries_user_song_instrument` on `(user_id, song_external_id, instrument)`, helper index `ix_repertoire_entries_user_recent` on `(user_id, created_at DESC)`.
- [X] T014 [P] Mappers at [apps/api/src/campfire_api/contexts/repertoire/adapters/persistence/mappers.py](apps/api/src/campfire_api/contexts/repertoire/adapters/persistence/mappers.py): `row_to_entry(row) -> RepertoireEntry` and `entry_to_row_kwargs(entry) -> dict`. Pure functions — no SQLAlchemy session calls.
- [X] T015 Repository implementation at [apps/api/src/campfire_api/contexts/repertoire/adapters/persistence/repertoire_entry_repository.py](apps/api/src/campfire_api/contexts/repertoire/adapters/persistence/repertoire_entry_repository.py): async SQLAlchemy 2.x style, implements every method on `RepertoireEntryRepository`. `get_by_user_song_instrument` performs the `SELECT … WHERE user_id = :uid AND song_external_id = :sid AND instrument = :instr` lookup used by the duplicate-detection path; `list_by_user` orders by `created_at DESC` (uses `ix_repertoire_entries_user_recent`); `delete` is a hard `DELETE` (FR-010). Depends on T013 + T014.
- [X] T016 [P] `DeezerSongCatalog` HTTP adapter at [apps/api/src/campfire_api/contexts/repertoire/adapters/catalog/__init__.py](apps/api/src/campfire_api/contexts/repertoire/adapters/catalog/__init__.py) and [apps/api/src/campfire_api/contexts/repertoire/adapters/catalog/deezer_song_catalog.py](apps/api/src/campfire_api/contexts/repertoire/adapters/catalog/deezer_song_catalog.py): async `httpx.AsyncClient` against `{deezer_base_url}/search?q=&index=&limit=10`. Translate provider response → `SearchResult` dataclasses (parse year from `album.release_date` prefix per research §R1; fall back to `None` when absent; use `album.cover_medium` for cover art). On HTTP 5xx or transport error raise `SongCatalogUnavailable`; on HTTP 429 raise `SongCatalogRateLimited`. The only file in the slice that imports `httpx`.
- [X] T017 [P] `FakeSongCatalog` test double at [apps/api/src/campfire_api/contexts/repertoire/adapters/catalog/fake_song_catalog.py](apps/api/src/campfire_api/contexts/repertoire/adapters/catalog/fake_song_catalog.py): in-memory fixture catalog with a deterministic seed derived from the design's `SAMPLE_SEARCH_RESULTS` (Wonderwall / Hey Jude / Trem Bala — matching the quickstart). Supports `set_unavailable(True)` and `set_rate_limited(True)` helpers so integration tests can drive FR-014 / FR-016 paths via dependency override.
- [X] T018 [P] In-process TTL+LRU search cache at [apps/api/src/campfire_api/contexts/repertoire/adapters/caching/__init__.py](apps/api/src/campfire_api/contexts/repertoire/adapters/caching/__init__.py) and [apps/api/src/campfire_api/contexts/repertoire/adapters/caching/ttl_search_cache.py](apps/api/src/campfire_api/contexts/repertoire/adapters/caching/ttl_search_cache.py): implements `SearchCachePort` with an `OrderedDict` for LRU eviction and a per-entry expiry timestamp. TTL and capacity read from `SettingsProvider`. Asyncio-lock guarded. Normalizes the cache key via `query.strip().lower()` per research §R5.
- [X] T019 [P] In-process per-user search rate limiter at [apps/api/src/campfire_api/contexts/repertoire/adapters/rate_limiting/__init__.py](apps/api/src/campfire_api/contexts/repertoire/adapters/rate_limiting/__init__.py) and [apps/api/src/campfire_api/contexts/repertoire/adapters/rate_limiting/in_memory_search_limiter.py](apps/api/src/campfire_api/contexts/repertoire/adapters/rate_limiting/in_memory_search_limiter.py): rolling window keyed by `user_id`, parameters from `SettingsProvider` (default 30 / 60 s). Mirrors the identity slice's `in_memory_limiter.py` shape per research §R7. On limit hit raises `SearchRateLimited`.
- [X] T020 [P] Unit tests for the catalog adapter (against a stubbed `httpx.AsyncClient` via `respx` or a hand-rolled transport mock) at [apps/api/tests/unit/repertoire/test_deezer_song_catalog.py](apps/api/tests/unit/repertoire/test_deezer_song_catalog.py): happy-path JSON → `SearchResult[]`, missing-cover-art path, missing-release-date path, 5xx → `SongCatalogUnavailable`, 429 → `SongCatalogRateLimited`. **No real network call** — the test injects a stub transport at the boundary so the suite remains hermetic.
- [X] T021 [P] Unit test for the TTL+LRU cache at [apps/api/tests/unit/repertoire/test_ttl_search_cache.py](apps/api/tests/unit/repertoire/test_ttl_search_cache.py): TTL expiry, LRU eviction at capacity, key normalization (whitespace + case), `(user_id, query, page)` isolation (one user's hit is not another's).
- [X] T022 [P] Unit test for the rate limiter at [apps/api/tests/unit/repertoire/test_in_memory_search_limiter.py](apps/api/tests/unit/repertoire/test_in_memory_search_limiter.py): allows up to N requests in the window, raises on N+1, recovers after the window slides, per-user isolation.
- [X] T023 Author the migration body in [apps/api/alembic/versions/0003_repertoire_initial.py](apps/api/alembic/versions/0003_repertoire_initial.py) (revision file reserved by T006). `upgrade()` creates `repertoire_entries` with the columns, CHECKs, and indexes per data-model.md §Migration. `downgrade()` drops the indexes then the table. Verify locally that `alembic upgrade head && alembic downgrade base && alembic upgrade head` round-trips cleanly.
- [X] T024 Confirm `make check-aurora-extensions` (the existing Spec 002 guard) still passes — `0003_repertoire_initial.py` introduces no `CREATE EXTENSION` statements.

**Checkpoint**: `pytest -m unit apps/api/tests/unit/repertoire/ -q` passes; `make migrate && make migrate-downgrade && make migrate` round-trips locally; the architecture-guard test is still green (T001).

---

## Phase 4: Application Use Cases (per user story)

**Purpose**: Pure-application logic against ports. Each use case is exercised with fake repositories + `FakeSongCatalog` in unit tests (no DB, no network).

### Use cases for User Story 1 — Add a song (P1)

- [X] T025 [US1] `SearchSongs` use case at [apps/api/src/campfire_api/contexts/repertoire/application/use_cases/search_songs.py](apps/api/src/campfire_api/contexts/repertoire/application/use_cases/search_songs.py): orchestrates `SearchRateLimiter.check` → `SearchCachePort.get` → on cache miss `SongCatalogPort.search` → `SearchCachePort.set`. Enforces query length ≥ 2 by raising `SearchQueryTooShort`, which the HTTP adapter maps to 422. Returns `(results, page, has_more)`.
- [X] T026 [US1] `AddOrUpdateEntry` use case at [apps/api/src/campfire_api/contexts/repertoire/application/use_cases/add_or_update_entry.py](apps/api/src/campfire_api/contexts/repertoire/application/use_cases/add_or_update_entry.py): validate instrument against `INSTRUMENTS` (raise `InstrumentUnknown`); validate proficiency against `PROFICIENCY_LEVELS` (raise `ProficiencyUnknown`); load existing entry by `(user_id, song_external_id, instrument)`; if absent INSERT a new entry with `created_at = updated_at = clock.now()` and return `(entry, action="created")`; if present UPDATE proficiency + bump `updated_at` (leave `created_at` alone) and return `(entry, action="updated")`. Implements FR-007 / FR-008 / SC-005 at the application layer; the DB unique index is the last-line race defense.
- [X] T027 [P] [US1] Unit tests for `SearchSongs` at [apps/api/tests/unit/repertoire/test_search_songs.py](apps/api/tests/unit/repertoire/test_search_songs.py): cache hit short-circuits the catalog port, cache miss invokes the catalog and writes back, rate-limit raises `SearchRateLimited`, catalog `SongCatalogUnavailable` propagates, query < 2 chars raises `SearchQueryTooShort`. All paths drive `FakeSongCatalog` — no real network.
- [X] T028 [P] [US1] Unit tests for `AddOrUpdateEntry` at [apps/api/tests/unit/repertoire/test_add_or_update_entry.py](apps/api/tests/unit/repertoire/test_add_or_update_entry.py): happy create, duplicate same-(song,instrument) becomes update with `action="updated"` and `created_at` preserved, unknown instrument raises `InstrumentUnknown`, unknown proficiency raises `ProficiencyUnknown`, two distinct instruments for the same song coexist as separate entries (acceptance scenario US1 #3).

### Use cases for User Story 2 — View repertoire (P1)

- [X] T029 [US2] `ListMyEntries` use case at [apps/api/src/campfire_api/contexts/repertoire/application/use_cases/list_my_entries.py](apps/api/src/campfire_api/contexts/repertoire/application/use_cases/list_my_entries.py): returns `repository.list_by_user(user_id)` ordered by `created_at DESC`. No pagination (FR-009 says "all entries"). FR-014: this path must not call the catalog port — it reads only local data, so it stays available when Deezer is down.
- [X] T030 [P] [US2] Unit tests for `ListMyEntries` at [apps/api/tests/unit/repertoire/test_list_my_entries.py](apps/api/tests/unit/repertoire/test_list_my_entries.py): empty list returned when user has no entries, multiple entries returned in `created_at DESC` order, another user's entries are not returned (FR-012 boundary).

### Use cases for User Story 3 — Remove (P2)

- [X] T031 [US3] `RemoveEntry` use case at [apps/api/src/campfire_api/contexts/repertoire/application/use_cases/remove_entry.py](apps/api/src/campfire_api/contexts/repertoire/application/use_cases/remove_entry.py): load by `entry_id`; if missing OR `entry.user_id != auth.user_id` raise `EntryNotFound` (don't leak existence — same posture identity uses for cross-user); else `repository.delete(entry)`. Hard delete per FR-010.
- [X] T032 [P] [US3] Unit tests for `RemoveEntry` at [apps/api/tests/unit/repertoire/test_remove_entry.py](apps/api/tests/unit/repertoire/test_remove_entry.py): owner deletes successfully, non-owner attempt raises `EntryNotFound` (not `EntryForbidden`, per research §R10 cross-user posture), missing id raises `EntryNotFound`, re-adding the same `(user, song, instrument)` after delete creates a fresh row (acceptance scenario US3 #2 — verified via the `AddOrUpdateEntry` interaction in the same test).

### Use cases for User Story 4 — Update proficiency (P3)

- [X] T033 [US4] `UpdateProficiency` use case at [apps/api/src/campfire_api/contexts/repertoire/application/use_cases/update_proficiency.py](apps/api/src/campfire_api/contexts/repertoire/application/use_cases/update_proficiency.py): load by `entry_id`; ownership check raises `EntryNotFound` on miss/mismatch; validate the new proficiency against `PROFICIENCY_LEVELS` (raise `ProficiencyUnknown`); update `proficiency` and `updated_at`.
- [X] T034 [P] [US4] Unit tests for `UpdateProficiency` at [apps/api/tests/unit/repertoire/test_update_proficiency.py](apps/api/tests/unit/repertoire/test_update_proficiency.py): happy update bumps `updated_at` only, unknown proficiency raises `ProficiencyUnknown`, non-owner attempt raises `EntryNotFound`, missing entry raises `EntryNotFound`.

**Checkpoint**: `pytest -m unit apps/api/tests/unit/repertoire/ -q` passes for every use case. Domain layer remains free of `fastapi` / `sqlalchemy` / `httpx` (T001).

---

## Phase 5: HTTP Routers + Integration Tests + OpenAPI Snapshot

**Purpose**: Expose every use case over HTTP, with an integration test against a real Postgres for every route and a regenerated OpenAPI snapshot.

**Constraint (carried from user prompt)**: every route below MUST have (a) an integration test against a Testcontainers Postgres covering the documented status codes, and (b) an OpenAPI snapshot update committed in the same change set. The Deezer adapter is replaced by `FakeSongCatalog` via dependency override in every integration test — no live network.

### Schemas + dependencies (shared by all routers)

- [X] T035 Pydantic transport schemas at [apps/api/src/campfire_api/contexts/repertoire/adapters/http/__init__.py](apps/api/src/campfire_api/contexts/repertoire/adapters/http/__init__.py) and [apps/api/src/campfire_api/contexts/repertoire/adapters/http/schemas.py](apps/api/src/campfire_api/contexts/repertoire/adapters/http/schemas.py): `SearchResultResponse`, `SearchResponse`, `EntryResponse`, `EntryListResponse`, `EntryCreateRequest`, `EntryUpdateRequest`, `ErrorResponse`. Field shapes match [contracts/openapi.json](specs/003-repertoire-song-entry/contracts/openapi.json) byte-for-byte (camelCase aliases on the wire, snake_case on the Python side).
- [X] T036 FastAPI dependency providers at [apps/api/src/campfire_api/contexts/repertoire/adapters/http/deps.py](apps/api/src/campfire_api/contexts/repertoire/adapters/http/deps.py): `get_repertoire_repositories` (Unit-of-Work yielding an `AsyncSession` and constructing `RepertoireEntryRepository`), `get_song_catalog` (returns the singleton `DeezerSongCatalog` — overrideable), `get_search_cache` (returns the singleton `TtlSearchCache`), `get_search_rate_limiter` (returns the singleton in-memory limiter). All four are designed for `app.dependency_overrides[…]` swap-in by integration tests.
- [X] T037 Error-mapping module at [apps/api/src/campfire_api/contexts/repertoire/adapters/http/error_mapping.py](apps/api/src/campfire_api/contexts/repertoire/adapters/http/error_mapping.py): `register_repertoire_error_handlers(app)` translates `RepertoireError` subclasses to HTTP responses — `InstrumentUnknown` / `ProficiencyUnknown` / `SearchQueryTooShort` → 422, `EntryNotFound` / `EntryForbidden` → 404 (single shared response shape, per FR-012 / SC-004 to avoid leaking existence), `DuplicateEntry` is **not** a 4xx (handled in-band by the use case via `action="updated"`), `SongCatalogUnavailable` → 503, `SongCatalogRateLimited` / `SearchRateLimited` → 429 with `Retry-After`. Wire from [apps/api/src/campfire_api/main.py](apps/api/src/campfire_api/main.py).

### Routes for User Story 1 — Add (P1)

- [X] T038 [US1] `GET /repertoire/songs/search` handler at [apps/api/src/campfire_api/contexts/repertoire/adapters/http/routers/__init__.py](apps/api/src/campfire_api/contexts/repertoire/adapters/http/routers/__init__.py) and [apps/api/src/campfire_api/contexts/repertoire/adapters/http/routers/repertoire.py](apps/api/src/campfire_api/contexts/repertoire/adapters/http/routers/repertoire.py): auth required via the existing `get_current_session` dependency; query params `q` (≥ 2 chars), `page` (≥ 1, default 1); calls `SearchSongs`; returns `SearchResponse`. Documents 401 / 429 / 503 responses to match [contracts/openapi.json](specs/003-repertoire-song-entry/contracts/openapi.json).
- [X] T039 [US1] `POST /repertoire/entries` handler in the same router file: auth required; body `EntryCreateRequest`; calls `AddOrUpdateEntry`; returns `EntryResponse` with `X-Repertoire-Action: created` (201) on insert or `X-Repertoire-Action: updated` (200) on the duplicate-becomes-update path (FR-008 / contract).
- [X] T040 Wire the repertoire router into [apps/api/src/campfire_api/main.py](apps/api/src/campfire_api/main.py) (`include_router`) and call `register_repertoire_error_handlers(app)` at app construction. Depends on T037–T039 (and the US2/US3/US4 routes below for the final wiring; this task is the single include-point).
- [X] T041 [P] [US1] Integration test for search at [apps/api/tests/integration/repertoire/__init__.py](apps/api/tests/integration/repertoire/__init__.py) and [apps/api/tests/integration/repertoire/test_search_route.py](apps/api/tests/integration/repertoire/test_search_route.py): Testcontainers Postgres + FastAPI test client + `app.dependency_overrides[get_song_catalog] = lambda: FakeSongCatalog(...)`. Asserts: 401 without bearer; 422 for `q` shorter than 2 characters; 200 with results for `wonderwall`; 429 when the limiter is exhausted (override `get_search_rate_limiter` to a 1-per-window stub); 503 when `FakeSongCatalog.set_unavailable(True)`; cache short-circuit on the second identical query (assert the fake's call counter increments only once). **No live Deezer call** — the override guarantees hermetic execution.
- [X] T042 [P] [US1] Integration test for add-entry at [apps/api/tests/integration/repertoire/test_add_entry_route.py](apps/api/tests/integration/repertoire/test_add_entry_route.py): 401 without bearer; 201 + `X-Repertoire-Action: created` happy path; second identical POST returns 200 + `X-Repertoire-Action: updated` with new proficiency, no second row inserted (FR-008 / SC-005); 422 on unknown instrument; 422 on unknown proficiency; same `(user, song)` with a different instrument coexists as a second row (US1 acceptance #3). Each assertion verifies via a SQL `SELECT count(*) FROM repertoire_entries` that the DB matches the contract.

### Routes for User Story 2 — View (P1)

- [X] T043 [US2] `GET /repertoire/entries` handler in [apps/api/src/campfire_api/contexts/repertoire/adapters/http/routers/repertoire.py](apps/api/src/campfire_api/contexts/repertoire/adapters/http/routers/repertoire.py): auth required; calls `ListMyEntries`; returns `EntryListResponse` ordered by `created_at DESC`.
- [X] T044 [P] [US2] Integration test for list at [apps/api/tests/integration/repertoire/test_list_route.py](apps/api/tests/integration/repertoire/test_list_route.py): 401 without bearer; 200 with empty list for a user with no entries; 200 with three entries in `created_at DESC` order; another user's entries are NOT visible (FR-012 / SC-004); list still returns 200 even when `FakeSongCatalog.set_unavailable(True)` (FR-014 / SC-003 — local-only path is independent of the catalog).

### Routes for User Story 3 — Remove (P2)

- [X] T045 [US3] `DELETE /repertoire/entries/{entry_id}` handler in [apps/api/src/campfire_api/contexts/repertoire/adapters/http/routers/repertoire.py](apps/api/src/campfire_api/contexts/repertoire/adapters/http/routers/repertoire.py): auth required; calls `RemoveEntry`; returns 204.
- [X] T046 [P] [US3] Integration test for delete at [apps/api/tests/integration/repertoire/test_remove_route.py](apps/api/tests/integration/repertoire/test_remove_route.py): 401 without bearer; 204 on owner delete; subsequent GET /entries no longer lists the row; 404 on second delete attempt; 404 when another user attempts the delete (existence not leaked); re-adding the same `(user, song, instrument)` after delete creates a fresh row with new `created_at` (US3 acceptance #2).

### Routes for User Story 4 — Update proficiency (P3)

- [X] T047 [US4] `PATCH /repertoire/entries/{entry_id}` handler in [apps/api/src/campfire_api/contexts/repertoire/adapters/http/routers/repertoire.py](apps/api/src/campfire_api/contexts/repertoire/adapters/http/routers/repertoire.py): auth required; body `EntryUpdateRequest`; calls `UpdateProficiency`; returns `EntryResponse`.
- [X] T048 [P] [US4] Integration test for update at [apps/api/tests/integration/repertoire/test_update_route.py](apps/api/tests/integration/repertoire/test_update_route.py): 401 without bearer; 200 happy update flips `learning` → `practicing` and bumps `updated_at` while preserving `created_at`; 422 on unknown proficiency; 404 when another user attempts the update.

### Cross-cutting authorization + snapshot

- [X] T049 [P] Authorization sweep at [apps/api/tests/integration/repertoire/test_authorization.py](apps/api/tests/integration/repertoire/test_authorization.py): seeds two users (Ada and a second user), creates entries for both, and asserts that every mutating route (POST / PATCH / DELETE) and every reading route (GET /entries) returning entries scoped to the calling user, with cross-user attempts returning 404 and never leaking row existence (FR-012 / SC-004).
- [X] T050 Run `make openapi-snapshot` to regenerate the FULL live OpenAPI document into [specs/002-backend-auth-slice/contracts/openapi.json](specs/002-backend-auth-slice/contracts/openapi.json) (the identity slice's snapshot file is the authoritative full-app snapshot per plan.md §Contract testing strategy) AND extract the repertoire-only subset into [specs/003-repertoire-song-entry/contracts/openapi.json](specs/003-repertoire-song-entry/contracts/openapi.json). Both files are committed in the same change set as the routers.
- [X] T051 [P] Repertoire snapshot test at [apps/api/tests/contract/test_repertoire_openapi_snapshot.py](apps/api/tests/contract/test_repertoire_openapi_snapshot.py): asserts that every path, operation, schema, and response in `specs/003-repertoire-song-entry/contracts/openapi.json` is present (key-equal) in `create_app().openapi()`. The existing identity snapshot test at [apps/api/tests/contract/test_openapi_snapshot.py](apps/api/tests/contract/test_openapi_snapshot.py) continues to assert full-document equality against the regenerated identity snapshot from T050; if it now fails on drift, regenerate per T050 and commit.

**Checkpoint**: every endpoint in [contracts/openapi.json](specs/003-repertoire-song-entry/contracts/openapi.json) is reachable, returns the documented status codes against a real Postgres, and is covered by an integration test with the catalog port faked at the boundary. Both OpenAPI snapshots are committed.

---

## Phase 6: Frontend Wiring (`apps/web/`)

**Purpose**: Build the repertoire feature slice mirroring `auth/` and `onboarding/`, replace the Home tile placeholder, and ship locale strings. Pixel targets come from the design at [.claude/design/campfire-v3/project/Repertoire Song Entry.html](.claude/design/campfire-v3/project/Repertoire Song Entry.html) — read it (and its imports) before writing components, and recreate it in React/CSS rather than copying the prototype's structure verbatim. Deferred design extras (wishlist, notes, filter chips, undo, "add manually") are explicitly out of scope per plan.md §Design-vs-spec divergences.

### Slice scaffolding

- [X] T052 [P] Create the slice skeleton with empty barrels at [apps/web/src/features/repertoire/index.ts](apps/web/src/features/repertoire/index.ts), [apps/web/src/features/repertoire/types.ts](apps/web/src/features/repertoire/types.ts) (`Entry`, `ProficiencyLevel`, `SearchResult`, `Instrument`), [apps/web/src/features/repertoire/catalogs.ts](apps/web/src/features/repertoire/catalogs.ts) (`PROFICIENCY_LEVELS = ["learning","practicing","ready"] as const` — single FE source of truth, mirrored from backend per research §R4).
- [X] T053 [P] Real API module at [apps/web/src/features/repertoire/api/repertoire.api.ts](apps/web/src/features/repertoire/api/repertoire.api.ts): `searchSongs(q, page)`, `listEntries()`, `addOrUpdateEntry(payload)`, `updateProficiency(id, proficiency)`, `removeEntry(id)`. Uses the existing `client.ts` fetch wrapper from the auth slice (no changes to `client.ts`). `addOrUpdateEntry` reads the `X-Repertoire-Action` header from the response and surfaces it in its return value so the store can show the "already in your list — proficiency updated" UX hint.
- [X] T054 [P] Mock fallback at [apps/web/src/features/repertoire/repertoire.mock.ts](apps/web/src/features/repertoire/repertoire.mock.ts): in-memory list + a fixture search response derived from `SAMPLE_SEARCH_RESULTS` in the design slice. Activated when `import.meta.env.VITE_API_URL === "mock://repertoire"` per quickstart §5a.
- [X] T055 Repertoire feature store at [apps/web/src/features/repertoire/store/repertoire.store.ts](apps/web/src/features/repertoire/store/repertoire.store.ts): list cache, in-flight search state (debounce timer, last-fired query, page accumulator for "load more", loading flag set before each request so the UI can show pending search immediately), action handlers for add/update/remove. The 300 ms client debounce (FR-016) lives here.

### Components for User Story 1 — Add (P1)

- [X] T056 [P] [US1] `AddSongModal` component at [apps/web/src/features/repertoire/components/AddSongModal.tsx](apps/web/src/features/repertoire/components/AddSongModal.tsx): owns the search input, results list, configure form, and save button per the design's Repertoire Song Entry HTML. Two-state UI: search-mode → configure-mode.
- [X] T057 [P] [US1] `SearchResultRow` component at [apps/web/src/features/repertoire/components/SearchResultRow.tsx](apps/web/src/features/repertoire/components/SearchResultRow.tsx): one row per `SearchResult` with title, artist, album/year, cover-art `<img>` with an `onerror` fallback to a CSS placeholder per FR-013.
- [X] T058 [P] [US1] `EntryConfigureForm` component at [apps/web/src/features/repertoire/components/EntryConfigureForm.tsx](apps/web/src/features/repertoire/components/EntryConfigureForm.tsx): instrument chips (12-instrument catalog from `identity` mirrored on the FE — reuse the existing constant from `apps/web/src/features/onboarding/`) + proficiency picker (3 tiers). Submission disabled until both are chosen (US1 edge case — block submit without instrument or proficiency).

### Components for User Story 2 — View (P1)

- [X] T059 [P] [US2] `EmptyState` component at [apps/web/src/features/repertoire/components/EmptyState.tsx](apps/web/src/features/repertoire/components/EmptyState.tsx): "YOUR REPERTOIRE IS EMPTY" + "ADD YOUR FIRST SONG" CTA per design.
- [X] T060 [P] [US2] `EntryRow` component at [apps/web/src/features/repertoire/components/EntryRow.tsx](apps/web/src/features/repertoire/components/EntryRow.tsx): renders `Entry` (title, artist, instrument, proficiency, cover art with the same `onerror` fallback as `SearchResultRow`).
- [X] T061 [P] [US2] `RepertoireList` component at [apps/web/src/features/repertoire/components/RepertoireList.tsx](apps/web/src/features/repertoire/components/RepertoireList.tsx): renders the list when entries exist, otherwise renders `EmptyState`.

### Component for User Story 3 — Remove (P2)

- [X] T062 [P] [US3] `RemoveEntryDialog` component at [apps/web/src/features/repertoire/components/RemoveEntryDialog.tsx](apps/web/src/features/repertoire/components/RemoveEntryDialog.tsx): confirmation dialog wired to `removeEntry`. Hard-delete copy per FR-010 (no "undo" affordance, per plan.md §Design-vs-spec divergence #5).

### Inline edit for User Story 4 — Update proficiency (P3)

- [X] T063 [US4] Inline proficiency edit on `EntryRow` (extend [apps/web/src/features/repertoire/components/EntryRow.tsx](apps/web/src/features/repertoire/components/EntryRow.tsx) — pencil icon → in-place picker → calls `updateProficiency`). Optimistic UI update on success; rollback + toast on failure.

### Page + Home tile + locales + smoke test

- [X] T064 New `RepertoirePage` at [apps/web/src/pages/RepertoirePage.tsx](apps/web/src/pages/RepertoirePage.tsx): composes `RepertoireList`, `AddSongModal`, `RemoveEntryDialog`. Loads the entries on mount via the store.
- [X] T065 Re-point the YOUR REPERTOIRE tile at [apps/web/src/pages/HomePage.tsx](apps/web/src/pages/HomePage.tsx) to navigate to `/repertoire` (FR-015 — replace the placeholder behavior).
- [X] T066 [P] Add the `/repertoire` route to the existing router config (whichever file currently registers `/onboarding`).
- [X] T067 [P] Locales — extend [apps/web/src/i18n/locales/en.ts](apps/web/src/i18n/locales/en.ts) and [apps/web/src/i18n/locales/pt.ts](apps/web/src/i18n/locales/pt.ts) with a `repertoire` namespace covering: empty-state copy, three proficiency labels and their hints ("Working out the parts" / "Drilling, not yet smooth" / "Can play it in front of others" — and PT equivalents), search empty / no-result / unavailable copy, configure-form labels, toast messages ("SONG ADDED", "PROFICIENCY UPDATED", "ENTRY REMOVED"), the duplicate-add affordance copy ("ALREADY IN YOUR LIST").
- [X] T068 [P] Style additions at [apps/web/src/styles/global.css](apps/web/src/styles/global.css): repertoire-specific selectors that reuse the existing TOKENS palette (no new tokens — per plan.md). Cover-art placeholder CSS for the `onerror` fallback.
- [X] T069 Manual smoke test of the four frontend journeys (search-and-add → list; add duplicate → "already in list" affordance + proficiency updated; remove → empty state; update proficiency in place) against the running backend. Re-run with `VITE_API_URL=mock://repertoire` to confirm the mock path also exercises all four journeys. Record outcomes (pass/fail per journey) in the PR description, including the elapsed time for the first search-and-add journey and the observed search-response time after typing stops (SC-001 / SC-002 smoke evidence).

**Checkpoint**: All four journeys succeed against the real backend; the mock fallback also works; no changes were made to `client.ts` or to identity-slice files.

---

## Phase 7: Documentation

- [X] T070 [P] Author the repertoire backend doc page at [docs/backend/repertoire.mdx](docs/backend/repertoire.mdx): bounded-context summary, search-flow Mermaid sequence (browser → backend → cache → limiter → Deezer), error catalog (`InstrumentUnknown`, `ProficiencyUnknown`, `EntryNotFound`, `DuplicateEntry`-as-200, `SongCatalogUnavailable`, `SearchRateLimited`), env var reference (the five new vars from T004), and a link to the committed snapshot at `specs/003-repertoire-song-entry/contracts/openapi.json`.
- [X] T071 Update [docs/docs.json](docs/docs.json) navigation: add `repertoire` to the existing `BACKEND` group.
- [X] T072 [P] Commit ADRs 0007–0009 under [specs/003-repertoire-song-entry/adr/](specs/003-repertoire-song-entry/adr/): `0007-external-music-catalog-provider.md` (Deezer choice + alternatives), `0008-no-songs-aggregate-yet.md` (denormalize-at-add-time), `0009-search-proxied-through-backend.md` (vs. browser-direct).
- [X] T073 [P] Update the `<!-- SPECKIT START --> … <!-- SPECKIT END -->` block in [AGENTS.md](AGENTS.md) (and its `CLAUDE.md` symlink) to point at `specs/003-repertoire-song-entry/plan.md`.

**Checkpoint**: Mintlify renders the new page locally; `docs/docs.json` validates; ADRs are committed; agent-context block points at the current slice.

---

## Phase 8: Acceptance

**Purpose**: Prove every contract claim with the existing manual quickstart and the full automated suite.

- [X] T074 Re-run the manual journey from [specs/003-repertoire-song-entry/quickstart.md](specs/003-repertoire-song-entry/quickstart.md) end-to-end against the real backend and the real Deezer API. Time the first add journey from clicking YOUR REPERTOIRE to seeing the saved entry (target: <60 seconds, SC-001), and time the first-page search response after typing stops for at least one well-known song (target: <2 seconds, SC-002 smoke evidence). Verify each acceptance criterion below and record outcomes in the PR:
    - sign-in as `ada@campfire.test` → click YOUR REPERTOIRE tile → empty state renders;
    - search `wonderwall` (300 ms debounce visible) → pick result → choose Guitar → choose Practicing → save → entry visible in list (US1);
    - add the same Wonderwall + Guitar with proficiency Performance-ready → frontend shows "ALREADY IN YOUR LIST" affordance, single row in DB with updated proficiency (US1 #4 / FR-008);
    - add Wonderwall + Piano → second row coexists (US1 #3);
    - reload the page → list persists (US2);
    - inline-edit proficiency → row re-renders + persists across reload (US4);
    - delete entry → returns to empty state, gone after reload (US3 / FR-010);
    - simulate catalog-down per quickstart §8 → search shows "temporarily unavailable", existing list still loads (FR-014 / SC-003).
- [X] T075 Run `make test` (full suite — unit + integration + contract) against a fresh Testcontainers Postgres. Zero failures required. Re-run with `TEST_BACKEND=compose make test-integration` to confirm the Compose fallback also passes.
- [X] T076 Verify `make check-aurora-extensions` still passes against the migration set including `0003_repertoire_initial.py`.
- [X] T077 Document the spec change-log entry in [specs/003-repertoire-song-entry/spec.md](specs/003-repertoire-song-entry/spec.md) under a new `## Change Log` section dated 2026-04-27, recording the Phase 8 manual outcome.

**Checkpoint**: Slice ships. SC-001 through SC-006 demonstrably hold.

---

## Dependencies & Execution Order

### Phase Dependencies (linear)

1. Setup (Phase 1) — depends on Spec 002's identity slice landing.
2. Repertoire Domain (Phase 2) — depends on T001 (architecture guard) being green.
3. Repertoire Adapters (Phase 3) — depends on Phase 2 (ports) and Phase 1 (settings + revision file).
4. Use Cases (Phase 4) — depends on Phase 2 (ports + entities + errors) and Phase 3 (fakes available for tests).
5. Routers (Phase 5) — depends on Phase 4 (use cases) + Phase 3 (deps + persistence).
6. Frontend Wiring (Phase 6) — can begin against the mock fallback (T054) once Phase 4 contracts are clear; the manual smoke (T069) requires Phase 5 to be live.
7. Docs (Phase 7) — depends on Phase 5 (final OpenAPI shape).
8. Acceptance (Phase 8) — depends on every prior phase.

### Within each phase

- Tests for the use case / route MUST pass against the implementation in the same phase before moving on.
- Models before repositories before use cases before routers before frontend wiring before docs.

### Parallel opportunities

- All `[P]`-marked tasks within a phase can run in parallel (different files, no incomplete dependencies).
- Across user stories within Phase 4 + Phase 5, US1 / US2 / US3 / US4 can be split across developers once the foundational adapters land.
- Within Phase 6, components for different user stories (T056–T058 for US1, T059–T061 for US2, T062 for US3, T063 for US4) can be built in parallel; the page composition (T064) and locale extension (T067) are the rendezvous points.

### User-story parallelism within Phase 4 + Phase 5

- Once foundational adapters exist, US1, US2, US3, US4 work can be split across developers:
    - Developer A → US1 tasks (T025, T026, T027, T028, T038, T039, T041, T042).
    - Developer B → US2 tasks (T029, T030, T043, T044).
    - Developer C → US3 tasks (T031, T032, T045, T046).
    - Developer D → US4 tasks (T033, T034, T047, T048).
- T040 (router wiring), T049 (cross-cutting authorization sweep), T050 (snapshot regen), and T051 (snapshot test) MUST run after all router tasks merge.

---

## Parallel Example: Phase 2 (Repertoire Domain)

```bash
# All independent files — launch in parallel:
Task: "Create package skeleton in apps/api/src/campfire_api/contexts/repertoire/"
Task: "Create value objects in apps/api/src/campfire_api/contexts/repertoire/domain/value_objects.py"
Task: "Create entities in apps/api/src/campfire_api/contexts/repertoire/domain/entities.py"
Task: "Create domain ports in apps/api/src/campfire_api/contexts/repertoire/domain/ports.py"
Task: "Create domain errors in apps/api/src/campfire_api/contexts/repertoire/domain/errors.py"
Task: "Unit tests for value objects + entities"
```

## Parallel Example: Phase 3 (Adapters, after T013 + T014 land)

```bash
Task: "RepertoireEntry repository impl (T015)"
Task: "DeezerSongCatalog adapter (T016)"
Task: "FakeSongCatalog test double (T017)"
Task: "TtlSearchCache (T018)"
Task: "InMemorySearchLimiter (T019)"
Task: "Catalog adapter unit tests with stubbed httpx (T020)"
Task: "Cache unit tests (T021)"
Task: "Limiter unit tests (T022)"
```

---

## Implementation Strategy

### MVP slice (US1 + US2 demo path)

1. Phases 1 → 2 → 3 → 4 (US1 + US2 use cases) → 5 (US1 + US2 routers + integration tests + snapshot).
2. Wire `apps/web/` (Phase 6) for search-and-add + list + Home-tile re-point.
3. Smoke-test the `wonderwall → guitar → practicing → list` journey.
4. **Stop and validate** before US3 / US4.

### Incremental delivery

1. MVP (US1 + US2) → demo.
2. Add US3 (remove) — small surface, immediate hygiene value.
3. Add US4 (update proficiency) — completes the lifecycle.
4. Phase 7 (docs) → Phase 8 (acceptance).

### Constraints recap (do **not** violate)

- No songs table; the entry is denormalized at add-time (FR-013 / ADR-0008).
- No browser-direct catalog calls; every Deezer hit is server-side and goes through `SongCatalogPort` (FR-001 / FR-016 / ADR-0009).
- No live Deezer call in any test — `FakeSongCatalog` is the only catalog the test suite ever sees, injected via FastAPI dependency override at the port boundary.
- Every route added in this slice ships with a Postgres-backed integration test AND an OpenAPI snapshot update committed in the same change set (carried from Spec 002).
- Domain and application layers stay free of `fastapi`, `sqlalchemy`, `httpx`, `argon2`, `jose` — verified by the extended architecture-guard test (T001) and the extended ruff banned-modules rule (T002).
- No deferred design extras (wishlist, notes, filter chips, undo, "add manually") — listed in plan.md §Design-vs-spec divergences.

---

## Notes

- `[P]` tasks touch different files and have no incomplete dependencies.
- `[US?]` labels trace tasks to the spec's user stories — useful when splitting across developers.
- Commit per task (or per logical group of `[P]` tasks).
- The integration suite (Phase 5) is the source of truth for SC-003 / SC-004 / SC-005. The OpenAPI snapshot is the source of truth for the wire contract.
- The Deezer adapter is the only `httpx` import in the entire context; the architecture-guard test fails closed if that ever drifts.
