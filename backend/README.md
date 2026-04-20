# campfire — backend

Python + FastAPI backend for the **campfire** private music portal.

Current slice: repertoire registration + consultation. A user can link songs
they can play to their own profile, pick an instrument (from suggestions or a
custom name), declare a proficiency score 0–10, and retrieve their repertoire
enriched with an inferred proficiency label.

## Run

```bash
# from backend/
python -m venv .venv
. .venv/Scripts/activate        # Windows bash; source .venv/bin/activate elsewhere
pip install -e ".[dev]"
cp .env.example .env
uvicorn campfire.main:app --reload
```

API docs: <http://localhost:8000/docs>

## Test

```bash
pytest
ruff check .
mypy
```

## Public routes (v1)

| Route | Purpose |
|---|---|
| `GET  /api/v1/health` | liveness |
| `GET  /api/v1/users` | list seeded users (demo) |
| `GET  /api/v1/users/me` | current user |
| `GET  /api/v1/songs/search?q=<text>` | typeahead-friendly song search |
| `GET  /api/v1/instruments?query=<text>` | instrument suggestions |
| `POST /api/v1/repertoire` | register `(song, instrument, proficiency)` for the current user |
| `GET  /api/v1/repertoire/me` | current user's repertoire |

All routes except `/health` require the `X-User-Id` header (placeholder auth).

## Layout

```
src/campfire/
  domain/           # pure business model: entities, value objects, repo/provider Protocols
  application/      # use cases + application DTOs
  infrastructure/   # adapters: in-memory persistence, song-search provider, auth, bootstrap
  interfaces/       # FastAPI routers + HTTP schemas
  config.py         # settings
  main.py           # ASGI entrypoint
tests/
  unit/             # domain + application (no FastAPI)
  integration/      # full stack via TestClient + in-memory container
```

See [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the layering
rationale and the extension seams (persistence, auth, song-search provider).
