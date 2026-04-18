# campfire — backend

Python + FastAPI backend for the **campfire** private music portal.

## Run

```bash
# from backend/
python -m venv .venv
. .venv/Scripts/activate        # Windows bash
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

## Layout

```
src/campfire/
  domain/           # pure business model (entities, value objects, repo contracts)
  application/      # use cases / orchestration
  infrastructure/   # adapters: persistence, auth, settings
  interfaces/       # FastAPI routers / HTTP schemas
  config.py         # settings
  main.py           # ASGI entrypoint
tests/
  unit/             # domain + application
  integration/      # FastAPI TestClient
```

See [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for rationale.
