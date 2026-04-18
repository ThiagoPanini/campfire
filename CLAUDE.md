# CLAUDE.md

Notes for future Claude. Read before touching code.

## Product

`campfire` — private music repertoire portal. ~10 pre-authorized friends. Answers one question:

> "Given who is here right now, what can we play?"

Users declare songs + instruments they know. Query with present user ids → viable songs + supporters.

Full brief: [INITIAL_BUSINESS_CONTEXT.md](./INITIAL_BUSINESS_CONTEXT.md). Treat as source of truth for domain language.

## Architecture — non-negotiable

Hexagonal / Clean Architecture. Dependencies point **inward**:

```
interfaces/  →  application/  →  domain/
         ↖  infrastructure/  ↗
```

Rules enforced across the codebase:

- `domain/` imports **nothing** from `application/`, `infrastructure/`, `interfaces/`, or 3rd-party libs (stdlib only: dataclasses, datetime, uuid, collections, typing).
- `application/` imports only from `domain/` + own DTOs.
- `interfaces/` (FastAPI routers) must call **use cases only** — never reach into `container.<repo>` directly. Adding a new read endpoint means adding a use case first.
- `infrastructure/bootstrap.py` is the **only** composition root. Swap adapters (SQL, real auth) here.

Repositories are `typing.Protocol` (structural), not ABCs. Keeps domain ORM-free.

## Key domain invariants

- `RepertoireEntry` unique per `(user_id, song_id, instrument)`. Same song, different instrument = allowed. Duplicate raises `DuplicateRepertoireEntryError` → HTTP 409.
- `Instrument` value object — normalized lowercase via `object.__setattr__` in `__post_init__` (frozen dataclass trick).
- `Song` identified by `(title, artist)`. No catalog yet — `find_by_title_and_artist` is find-or-create inside `RegisterRepertoireEntry`.
- `PossibleRepertoireService.compute` — pure, no I/O. Rule: song viable iff ≥1 present user declared it. Returns supporters map (user_id → instruments tuple).
- Presence is **input to the query**, not an aggregate. Deferred until group decides capture mechanism. Stable seam: `ListPossibleRepertoire.execute(present_user_ids)`.

## Auth (stub)

`PlaceholderAuthenticator` resolves `X-User-Id` header against `UserRepository`. Replace in `infrastructure/auth/` — interface: `authenticate(user_id) -> User`, raises `NotAuthorizedUserError`. Single swap point.

Missing or unknown header → 401 in `interfaces/api/dependencies.py::get_current_user`.

## Entities — conventions

- All entities + value objects: `@dataclass(frozen=True, slots=True)`.
- Ids: `UUID` via `field(default_factory=uuid4)`.
- Timestamps: `datetime.now(UTC)` (Python 3.11+ `UTC`, not `timezone.utc`).
- Validation in `__post_init__`. Empty strings raise `ValueError`.
- Use cases: also frozen slotted dataclasses. Constructor DI via dataclass fields (no `__init__` boilerplate).

## FastAPI conventions

- Sync `def` routes — in-memory repos, no async I/O yet. When real persistence lands, flip to `async def` together with repo.
- Deps via `Annotated[..., Depends(...)]`. Two aliases in `interfaces/api/dependencies.py`: `ContainerDep`, `CurrentUser`.
- Container lives on `app.state.container`, created in `lifespan`. Test fixture overrides post-yield.
- HTTP schemas in `interfaces/api/v1/schemas.py` — pydantic v2. Never reuse domain entities as response models.
- Expected errors → `HTTPException`. Invariant violations (e.g. `SongNotFoundError` in `list_possible`) → 500 is acceptable; means data corruption.

## Testing

- `tests/unit/` — pure domain + application. No FastAPI, no TestClient.
- `tests/integration/` — full stack via `TestClient` + real in-memory container.
- Fixtures: `container`, `client` in `conftest.py`. Client swaps `app.state.container` so tests share state with arrange phase.
- Run: `cd backend && pytest` (needs `pip install -e ".[dev]"` first).

## Tooling

- Python **3.11+** (uses `UTC`, `X | Y` unions).
- Ruff: line-length 100, selects `E,F,W,I,N,UP,B,SIM,RUF`, ignores `B008` (Depends).
- Mypy strict, `packages = ["campfire"]`, `mypy_path = "src"`.
- Config all in `backend/pyproject.toml`.

## Gotchas

- **`fastapi` not installed in user env**. Running `pytest` cold fails at `ModuleNotFoundError`. Use `ast.parse` walks for cheap syntax check; real test requires `pip install -e ".[dev]"` in `backend/`.
- **`datetime.UTC`** not `timezone.utc`. Breaks on <3.11.
- **Don't** add `Manager`, `Service` suffix to classes casually — use-case classes named after the action (`RegisterRepertoireEntry`, `ListPossibleRepertoire`).
- **Don't** touch `container.<repo>` from routers — add a use case.
- **Song** is found-or-created inside register. Future catalog feature will need refactor; interface stays.
- `bootstrap.py` seeds Alice + Bob. Remove when admin onboarding lands.

## Where things go — cheat sheet

| Task | Location |
|---|---|
| New domain concept | `domain/models/` + repo Protocol in `domain/repositories/` |
| New behavior | `application/use_cases/` — depend only on domain |
| New endpoint | `interfaces/api/v1/` router → use case (never repo) |
| Swap persistence | new adapter next to `infrastructure/persistence/memory/`; flip `bootstrap.py` |
| Swap auth | replace `PlaceholderAuthenticator` in `infrastructure/auth/` |

## Extension docs

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — layering rationale
- [README.md](./README.md) — run instructions, assumptions, open questions

## Current limitations (known)

- No real auth (header stub).
- No durable persistence (in-memory, resets on restart).
- No `Gathering` aggregate — presence is a query input.
- No mastery level / key / version on `RepertoireEntry`.
- No frontend. Backend contract is the foundation.
