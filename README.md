# campfire

> A private music repertoire portal for a small, closed group of friends.

`campfire` lets each authorized user build a personal, queryable record of the
songs they can play — on which instrument, and how well.

The first functional slice answers a single user-centered question:

> **"What songs do I know, on which instruments, and how well?"**

Group-level questions (e.g. "what can we play tonight?") are deliberately
deferred. The backend is intentionally the foundation — a UI will consume this
contract in a later iteration.

See [INITIAL_BUSINESS_CONTEXT.md](./INITIAL_BUSINESS_CONTEXT.md) for the full
product brief. Note: the current codebase scopes down that brief to the
repertoire-registration foundation described below.

---

## Current scope (first slice)

The backend supports:

- authorized-user access (placeholder header-based auth),
- **song search** suitable for a future typeahead UI,
- **instrument suggestions** (common list + free-text filter) with support for
  custom instrument names,
- **registering a repertoire entry** — link a `(song, instrument, proficiency)`
  triple to the authenticated user,
- **proficiency** captured as an integer score 0–10 with an inferred label
  (`beginner` / `intermediate` / `advanced` / `expert`),
- **consulting your own repertoire** — list every entry the current user has
  declared, enriched with proficiency data.

Explicitly **not in scope** of this slice:

- group-level "what can everyone present play?" (presence/gathering flows),
- durable persistence (in-memory only, resets on restart),
- real authentication,
- a frontend,
- a canonical music catalog.

---

## Architecture

Hexagonal / Clean Architecture. Dependencies point inward:
`interfaces → application → domain`, with `infrastructure` adapting to domain
contracts.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the rationale and
extension seams.

```
.
├── backend/                  Python + FastAPI backend
│   └── src/campfire/
│       ├── domain/           pure business model
│       ├── application/      use cases
│       ├── infrastructure/   adapters + composition root
│       ├── interfaces/       FastAPI HTTP layer
│       ├── config.py
│       └── main.py
├── docs/ARCHITECTURE.md
├── INITIAL_BUSINESS_CONTEXT.md
└── README.md
```

---

## Run the backend

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate      # on Windows bash; source .venv/bin/activate elsewhere
pip install -e ".[dev]"
cp .env.example .env
uvicorn campfire.main:app --reload
```

- OpenAPI docs: <http://localhost:8000/docs>
- Health: <http://localhost:8000/api/v1/health>

Bootstrap seeds two authorized users (Alice, Bob) so the API is demoable.
`GET /api/v1/users` lists their ids — supply any id as `X-User-Id`.

### Try the vertical slice

```bash
# list seeded users
curl -H "X-User-Id: <alice-id>" http://localhost:8000/api/v1/users

# song search (typeahead-friendly)
curl -H "X-User-Id: <alice-id>" \
  "http://localhost:8000/api/v1/songs/search?q=beatles"

# instrument suggestions (optional substring filter)
curl -H "X-User-Id: <alice-id>" \
  "http://localhost:8000/api/v1/instruments?query=guitar"

# register: Alice knows 'Black' by Pearl Jam on guitar, proficiency 8
curl -X POST http://localhost:8000/api/v1/repertoire \
  -H "X-User-Id: <alice-id>" -H "Content-Type: application/json" \
  -d '{"song_title":"Black","song_artist":"Pearl Jam","instrument":"guitar","proficiency":8}'

# Alice's repertoire
curl -H "X-User-Id: <alice-id>" http://localhost:8000/api/v1/repertoire/me
```

Custom instruments (not in the suggestion list) are accepted as-is during
registration — no prior catalog entry required.

### Test

```bash
cd backend
pytest
ruff check .
mypy
```

---

## How to extend

- **New domain concept** → `domain/models/` + a `Protocol` under `domain/repositories/`, then implement in `infrastructure/persistence/`.
- **New behavior** → a use case under `application/use_cases/`, depending only on domain contracts.
- **New endpoint** → router under `interfaces/api/v1/`, wired in `router.py`, calling a use case (never a repository).
- **Replace in-memory storage** → add an adapter alongside `infrastructure/persistence/memory/`; flip `bootstrap.py`.
- **Real auth** → replace `PlaceholderAuthenticator` in `infrastructure/auth/`.
- **External song provider** → add an adapter satisfying `SongSearchProvider`, swap it in `bootstrap.py`. Keep tests network-free.

---

## Current limitations

- Placeholder header-based auth — no OAuth / magic links yet.
- In-memory repositories — all state resets on restart.
- Song search uses a seeded local catalog behind a provider abstraction;
  no external music API is wired in yet.
- Instrument suggestions are a curated list; custom names are supported at
  registration time but not persisted back to the catalog.
- No frontend.

---

## Intentionally deferred

- Group-level "possible repertoire" for a gathering — the previous scaffold
  experimented with this, but the initial slice is deliberately user-centric.
  The seam (`present_user_ids` as a query input) can be reintroduced via a
  dedicated use case when the group decides how presence is captured.
- Durable persistence (SQLite/Postgres) — adapters plug in behind existing
  repository Protocols.
- Admin flow for the authorized-user list.
- Mastery history, song key, song version metadata beyond proficiency.

---

## Assumptions taken while scaffolding

1. Musician vs audience are **behavioral profiles**, not fixed roles.
2. A repertoire entry is unique per `(user, song, instrument)` — same song on a different instrument is allowed.
3. Proficiency is a single integer 0–10 per entry; the category label is derived, not stored separately.
4. Songs are identified by `(title, artist)` for now. A controlled catalog can be introduced without changing the domain's public contract.
5. Instruments stay as lightweight normalized names (value objects); a catalog upgrade is optional and additive.
6. Song search is an explicit seam (`SongSearchProvider`) so an external API (e.g. MusicBrainz) can replace the local seed later without affecting the rest of the code.
7. In-memory repositories are acceptable for the scaffold; production persistence is an explicit future step.
