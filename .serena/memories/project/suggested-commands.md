**Root (`package.json` — orchestrates web only)**
| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server (apps/web) |
| `npm run build` | `tsc -b` then `vite build` |
| `npm run typecheck` | TS-only (`tsc -b apps/web/tsconfig.json`) |
| `npm run preview` | Preview built bundle |
| `npm run docs:dev` | Mintlify dev server (`cd docs && mint dev`) |

**Backend (`apps/api/Makefile` — run from `apps/api/`)**
| Command | Purpose |
|---|---|
| `make run` | `uv run uvicorn campfire_api.main:app --reload --port 8000` |
| `make test` | All pytest |
| `make test-unit` | `pytest -m unit tests/unit` |
| `make test-integration` | Testcontainers Postgres |
| `make test-integration-compose` | Use the running `docker compose` Postgres (`TEST_BACKEND=compose`) |
| `make migrate` / `make downgrade` / `make db-reset` | Alembic |
| `make seed` | `uv run python scripts/seed.py` (creates Ada user) |
| `make lint` / `make format` | `ruff check` / `ruff format` over `src tests scripts` |
| `make openapi-snapshot` | Regenerate OpenAPI snapshot file |
| `make check-aurora-extensions` | Aurora extension preflight |

**Bring-up (cold)**:
```bash
docker compose up -d postgres
cd apps/api && uv sync && make migrate && make seed && make run
# in another shell, from repo root:
npm install && npm run dev
```

**Health checks**: `GET /healthz`, `GET /readyz`. Quick probe: `curl http://localhost:8000/healthz`.

**Pinned test fixture**: integration tests truncate + reseed user `ada@campfire.test` (id `018f0000-0000-7000-8000-000000000001`); see `apps/api/tests/conftest.py`.

**Spec Kit**: feature work goes through `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement` (skills are listed in the harness as `speckit-*`). Each phase writes into `specs/NNN-slug/`.
