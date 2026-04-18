# campfire

> A private music repertoire portal for a small, closed group of friends who gather to play music together.

`campfire` answers one question:

> **"Given who is here right now, what can we play?"**

Each authorized user declares songs they know how to play — and on which instruments.
During a gathering, the group queries the portal with the set of present users and
gets the set of viable songs, along with which people support each one.

See [INITIAL_BUSINESS_CONTEXT.md](./INITIAL_BUSINESS_CONTEXT.md) for the full product brief.

---

## Goal of this scaffold

Establish a clean, extensible foundation — not a feature-complete product.

The scaffold proves:

- a clear hexagonal / Clean-Architecture layering;
- a domain-first model centered on `declared musical knowledge` and `possible repertoire`;
- a working vertical slice (register an entry, list my repertoire, list possible repertoire for the present users);
- conventions for testing, linting, configuration, and DI wiring;
- seams where real persistence, real auth, and a presence mechanism will plug in later.

It is intentionally **small**.

---

## Repository layout

```
.
├── backend/                  Python + FastAPI backend
│   ├── src/campfire/
│   │   ├── domain/           pure business model
│   │   ├── application/      use cases
│   │   ├── infrastructure/   adapters (persistence, auth, bootstrap)
│   │   ├── interfaces/       FastAPI HTTP layer
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   └── pyproject.toml
├── docs/
│   └── ARCHITECTURE.md       layering rationale + extension points
├── INITIAL_BUSINESS_CONTEXT.md
└── README.md
```

A `frontend/` workspace is intentionally left out of this first iteration —
the backend contract is the foundation a future UI (web or mobile) will consume.

---

## Run the backend

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate      # on Windows bash; use `source .venv/bin/activate` on macOS/Linux
pip install -e ".[dev]"
cp .env.example .env
uvicorn campfire.main:app --reload
```

Then:

- OpenAPI docs: <http://localhost:8000/docs>
- Health: <http://localhost:8000/api/v1/health>

The bootstrap seeds two authorized users (Alice, Bob) so the API is immediately demoable.
Their ids are returned by `GET /api/v1/users` (supply any seeded id as `X-User-Id`).

### Try the vertical slice

```bash
# 1. list seeded users
curl -H "X-User-Id: <alice-id>" http://localhost:8000/api/v1/users

# 2. Alice declares she knows 'Black' by Pearl Jam on guitar
curl -X POST http://localhost:8000/api/v1/repertoire \
  -H "X-User-Id: <alice-id>" -H "Content-Type: application/json" \
  -d '{"song_title":"Black","song_artist":"Pearl Jam","instrument":"guitar"}'

# 3. query what's playable if Alice and Bob are present
curl -X POST http://localhost:8000/api/v1/repertoire/possible \
  -H "X-User-Id: <alice-id>" -H "Content-Type: application/json" \
  -d '{"present_user_ids":["<alice-id>","<bob-id>"]}'
```

### Test

```bash
cd backend
pytest
ruff check .
mypy
```

---

## How to extend

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the full rationale.

Rules of thumb:

- **New domain concept** → add under `domain/models/`; add a repository `Protocol` under `domain/repositories/`; implement in `infrastructure/persistence/`.
- **New behavior** → add a use case under `application/use_cases/`. Depend only on domain contracts.
- **New endpoint** → add a router under `interfaces/api/v1/`; wire in `router.py`.
- **Replace in-memory storage** → add a new adapter alongside `infrastructure/persistence/memory/`; flip the `bootstrap.py` wiring.
- **Real auth** → replace `PlaceholderAuthenticator` in `infrastructure/auth/`; the interface (`authenticate(user_id) -> User`) is the seam.

---

## Current limitations

- No real authentication (placeholder header-based identity).
- No durable persistence — all data lives in memory and resets on restart.
- No presence/gathering model yet; the client supplies `present_user_ids` directly.
- No frontend.
- Song catalog is free-form (title + artist), with no de-duplication beyond exact match.
- No mastery level, key, or version metadata on repertoire entries.

---

## Assumptions taken while scaffolding

1. Musician vs audience are **behavioral profiles**, not fixed roles — any authorized user may register repertoire or just consult it.
2. A repertoire entry is unique per `(user, song, instrument)` — same song, different instrument is allowed.
3. "Possible repertoire" = **any** song declared by at least one present user. A stricter rule (e.g. at least one guitarist + one vocalist) can be added later as a domain-service option.
4. Presence is an **input** to the query, not a modeled aggregate — deferred until the group decides how presence is captured.
5. Songs are identified by `(title, artist)`. A controlled catalog can be introduced without changing the domain's public contract.
6. In-memory repositories are fine for the scaffold and for running the test suite; production persistence is an explicit future step.
7. Auth is stubbed because the business document only confirms *that* access is restricted, not *how* it is enforced.

---

## Open questions (surfaced for later decisions)

- How is presence captured (manual selection, explicit check-in, something else)?
- Is a standardized song catalog desired, or is free-form acceptable long-term?
- Should mastery level / confidence be modeled on repertoire entries?
- Will gathering history be recorded?
- Who administers the authorized-user list, and through what interface?
- Guest / temporary access allowed?
- Threshold for "playable" — single supporter, or a minimum combination of instruments?

---

## Recommended next steps

1. **Pick an auth strategy** (magic link, OAuth with an allowlist, invite codes) and replace `PlaceholderAuthenticator`.
2. **Introduce durable persistence** (SQLite for local, Postgres for shared) behind the existing repository Protocols.
3. **Model presence**: decide mechanism, then add a `Gathering` aggregate and a `JoinGathering` / `LeaveGathering` use case.
4. **Admin flow**: a minimal endpoint to add/remove authorized users, gated on an admin flag.
5. **Frontend**: a small SPA (or server-rendered pages) optimized for the in-gathering read path.
6. **Observability**: structured logging + a request-id middleware before the user base grows past informal use.
