# CLAUDE.md

Notes for future Claude. Read before touching code.

## Product

`campfire` — private music repertoire portal. ~10 pre-authorized friends.

The **current active slice** is user-owned repertoire registration and
consultation. It answers:

> "What songs do I know, on which instruments, and how well?"

Users search songs, pick an instrument (from suggestions or a custom name),
declare a proficiency score 0–10, and retrieve their own repertoire.

Group-level "possible repertoire for present users" is intentionally **out of
scope** right now — it was prototyped earlier and was removed to keep the
codebase focused. It can be reintroduced later as a new use case without
breaking anything.

Full product brief: [INITIAL_BUSINESS_CONTEXT.md](./INITIAL_BUSINESS_CONTEXT.md).
Treat as source of truth for domain language. The current code narrows that
brief down on purpose — if docs and code diverge, trust the code.

## Architecture — non-negotiable

Hexagonal / Clean Architecture. Dependencies point **inward**:

```
interfaces/  →  application/  →  domain/
         ↖  infrastructure/  ↗
```

Rules enforced across the codebase:

- `domain/` imports **nothing** from `application/`, `infrastructure/`,
  `interfaces/`, or 3rd-party libs (stdlib only: dataclasses, datetime, uuid,
  collections, typing).
- `application/` imports only from `domain/` + own DTOs.
- `interfaces/` (FastAPI routers) must call **use cases only** — never reach
  into `container.<repo>` directly. Adding a new read endpoint means adding a
  use case first.
- `infrastructure/bootstrap.py` is the **only** composition root. Swap
  adapters (SQL, external song provider, real auth) here.

Repositories and providers are `typing.Protocol` (structural), not ABCs.

## Key domain invariants

- `RepertoireEntry` unique per `(user_id, song_id, instrument)`. Same song,
  different instrument = allowed. Duplicate raises
  `DuplicateRepertoireEntryError` → HTTP 409.
- `Instrument` value object — normalized lowercase via `object.__setattr__`
  in `__post_init__` (frozen dataclass trick).
- `Proficiency` value object — integer 0..10, raises `ValueError` out of
  range. Category label (`beginner`/`intermediate`/`advanced`/`expert`) is a
  derived `@property`, never stored separately.
- `Song` identified by `(title, artist)`. No canonical catalog —
  `find_by_title_and_artist` is find-or-create inside
  `RegisterRepertoireEntry`.
- `SongSearchProvider` is a separate port from `SongRepository`. Default
  adapter is an in-memory seeded list. External providers plug in through
  this port without touching local storage or the rest of the code.
- `InstrumentCatalog` supplies suggestions only. Custom instrument names are
  accepted at registration time without a prior catalog entry.

## Auth (stub)

`PlaceholderAuthenticator` resolves `X-User-Id` against `UserRepository`.
Replace in `infrastructure/auth/` — interface:
`authenticate(user_id) -> User`, raises `NotAuthorizedUserError`.

Missing or unknown header → 401 in
`interfaces/api/dependencies.py::get_current_user`.

## Entities — conventions

- All entities + value objects: `@dataclass(frozen=True, slots=True)`.
- Ids: `UUID` via `field(default_factory=uuid4)`.
- Timestamps: `datetime.now(UTC)` (Python 3.11+ `UTC`, not `timezone.utc`).
- Validation in `__post_init__`. Out-of-range / empty values raise
  `ValueError`.
- Use cases: also frozen slotted dataclasses. Constructor DI via dataclass
  fields (no `__init__` boilerplate).

## FastAPI conventions

- Sync `def` routes — in-memory repos, no async I/O yet.
- Deps via `Annotated[..., Depends(...)]`. Two aliases in
  `interfaces/api/dependencies.py`: `ContainerDep`, `CurrentUser`.
- Container lives on `app.state.container`, created in `lifespan`. Test
  fixture overrides post-yield.
- HTTP schemas in `interfaces/api/v1/schemas.py` — pydantic v2. Never reuse
  domain entities as response models.
- Expected errors → `HTTPException`. Domain `ValueError` (e.g. bad
  proficiency slipping past the pydantic guard) → 422. Invariant violations
  (`SongNotFoundError` inside `list_user_repertoire`) → 500; means data
  corruption.

## Active API surface (v1)

- `GET  /health`
- `GET  /users`, `GET /users/me`
- `GET  /songs/search?q=<text>`
- `GET  /instruments?query=<text>`
- `POST /repertoire` — body `{song_title, song_artist, instrument, proficiency}`
- `GET  /repertoire/me`

No `/repertoire/possible` — removed with the scope reduction.

## Testing

- `tests/unit/` — pure domain + application. No FastAPI, no TestClient.
- `tests/integration/` — full stack via `TestClient` + real in-memory
  container.
- Fixtures: `container`, `client` in `conftest.py`. Client swaps
  `app.state.container` so tests share state with arrange phase.
- All tests deterministic + network-free.
- Run: `cd backend && pytest` (needs `pip install -e ".[dev]"` first).

## Tooling

- Python **3.11+** (uses `UTC`, `X | Y` unions).
- Ruff: line-length 100, selects `E,F,W,I,N,UP,B,SIM,RUF`, ignores `B008`
  (Depends).
- Mypy strict, `packages = ["campfire"]`, `mypy_path = "src"`.
- Config all in `backend/pyproject.toml`.

## Gotchas

- **`fastapi` may not be installed in user env**. Running `pytest` cold
  fails at `ModuleNotFoundError`. Use `ast.parse` walks for cheap syntax
  check; real test requires `pip install -e ".[dev]"` in `backend/`.
- **`datetime.UTC`** not `timezone.utc`. Breaks on <3.11.
- **Don't** add `Manager`, `Service` suffix to classes casually — use-case
  classes named after the action (`RegisterRepertoireEntry`, `SearchSongs`).
- **Don't** touch `container.<repo>` from routers — add a use case.
- **Song** is found-or-created inside register. Future catalog feature will
  need refactor; interface stays.
- `bootstrap.py` seeds Alice + Bob. Remove when admin onboarding lands.
- `SongSearchProvider` seed data lives in
  `infrastructure/persistence/memory/song_search_provider.py`. Tests rely on
  a few specific titles ("Black", "Blackbird", Beatles entries) — keep those
  if you trim the seed.

## Where things go — cheat sheet

| Task | Location |
|---|---|
| New domain concept | `domain/models/` + repo Protocol in `domain/repositories/` |
| New behavior | `application/use_cases/` — depend only on domain |
| New endpoint | `interfaces/api/v1/` router → use case (never repo) |
| Swap persistence | new adapter next to `infrastructure/persistence/memory/`; flip `bootstrap.py` |
| Swap song search | new `SongSearchProvider` adapter; flip `bootstrap.py` |
| Swap auth | replace `PlaceholderAuthenticator` in `infrastructure/auth/` |

## Extension docs

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — layering rationale +
  extension seams
- [README.md](./README.md) — run instructions, current scope, deferred items

## Current limitations (known)

- No real auth (header stub).
- No durable persistence (in-memory, resets on restart).
- No external song-search provider wired in (local seeded catalog only).
- No group-level "possible repertoire" (descoped).
- No frontend.
