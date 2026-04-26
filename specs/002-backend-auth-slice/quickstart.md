# Quickstart — Campfire Backend Auth Slice

**Goal**: clone the repo, bring up Postgres, run migrations and seeds, start
the API natively, start the Vite dev server, and sign in with the seeded
account — first try, no extra steps.

This document is the contract for **SC-004**: a reviewer who follows it
once succeeds. If a step in this file does not work as written, that is a
bug — fix the step or fix the code.

---

## Prerequisites

Install once, on your machine:

| Tool | Version | Notes |
|---|---|---|
| `git` | any recent | |
| Docker engine + Compose v2 | recent | Compose runs **only** Postgres in this slice. |
| `uv` | `>= 0.5` | Python project manager. `curl -LsSf https://astral.sh/uv/install.sh \| sh`. |
| Node.js | `>= 20` | For the Vite dev server. `pnpm` is the package manager used by the web app. |
| `pnpm` | `>= 9` | `npm i -g pnpm` if you don't have it. |

You do **not** need Python installed locally — `uv` will manage Python
3.12 for you. You do **not** need Postgres installed locally — Docker runs
it.

---

## 1. Clone

```bash
git clone https://github.com/ThiagoPanini/campfire.git
cd campfire
```

## 2. Bring up Postgres

```bash
docker compose up -d postgres
```

This is the entirety of Compose for this slice. Postgres 16-alpine, on
`localhost:5432`. The default DSN is:

```text
postgresql+asyncpg://campfire:campfire@localhost:5432/campfire
```

Verify:

```bash
docker compose ps postgres        # should be "running"
docker compose exec postgres pg_isready -U campfire
```

## 3. Install API deps

```bash
cd apps/api
uv sync                           # installs Python 3.12 + all deps from uv.lock
```

Copy the env template:

```bash
cp .env.example .env              # adjust values only if you've changed defaults
```

## 4. Run migrations

```bash
make migrate
```

(Or, equivalently: `uv run alembic upgrade head`.)

This creates the six identity tables and applies the idempotent seed
migration that inserts `ada@campfire.test` (FR-020).

## 5. Seed (idempotent)

The seed lives in migration `0002_seed_ada.py`, so step 4 already ran it.
For a manual re-seed (e.g., after `make db-reset`):

```bash
make seed
```

Re-running `make seed` against an already-seeded DB is a no-op — no
duplicates, no preference reset, no hash rotation (FR-021 / SC-005).

## 6. Run the API natively

```bash
make run
# equivalent: uv run uvicorn campfire_api.main:app --reload --port 8000
```

`uvicorn --reload` for fast iteration and breakpoint debugging. **The API
itself is not containerized in this slice.**

Verify:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

## 7. Run the web app

In a second terminal, from the repo root:

```bash
cd apps/web
cp .env.local.example .env.local       # contains VITE_API_URL=http://localhost:8000
pnpm install
pnpm dev                                # Vite, on http://localhost:5173
```

## 8. Sign in

Open `http://localhost:5173`. Click **Sign in**. Submit:

- Email: `ada@campfire.test`
- Password: `campfire123`

You land on Home. The seeded preferences are visible. Reload the browser
— you stay signed in (this is **SC-002**, the deliberate behavior change
from the mock prototype). Sign out — your subsequent `/me` calls return
401 (this is **SC-003**).

---

## Daily workflow

| Task | Command (run from `apps/api/`) |
|---|---|
| Start API (reload) | `make run` |
| Start API (no reload) | `uv run uvicorn campfire_api.main:app --port 8000` |
| Run unit tests | `make test-unit` |
| Run integration tests (Testcontainers) | `make test-integration` |
| Run all tests | `make test` |
| Lint + format | `make lint` / `make format` |
| Apply migrations | `make migrate` |
| Roll back one migration | `uv run alembic downgrade -1` |
| Generate a new migration | `uv run alembic revision -m "<slug>"` (then **hand-edit**) |
| Refresh OpenAPI snapshot | `make openapi-snapshot` |
| Reset DB (drops, re-creates, re-seeds) | `make db-reset` |

### Frontend daily

| Task | Command (run from `apps/web/`) |
|---|---|
| Dev server | `pnpm dev` |
| Type check | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Build | `pnpm build` |

---

## Tests

This slice ships three test layers. The integration layer hits a real
Postgres (mocking is forbidden — see the spec's testing intent).

### Unit tests — fake repositories, no DB

```bash
make test-unit
```

### Integration tests — Testcontainers (preferred)

By default, `make test-integration` uses
[`testcontainers-python`](https://testcontainers-python.readthedocs.io/) to
spin up `postgres:16-alpine` for the pytest session. Each test gets a
clean truncate. This matches CI exactly.

Requires Docker on the host. On Linux this is the standard Docker engine.
On macOS / Windows it requires Docker Desktop with the API socket
exposed.

```bash
make test-integration
```

### Integration tests — Compose-DB fallback

Some environments can't run Testcontainers — the most common case in this
project is **WSL2 without Docker Desktop integration**. For those, point
the tests at the existing Compose Postgres using a dedicated database
named `campfire_test`.

One-time setup:

```bash
docker compose exec postgres createdb -U campfire campfire_test
```

Run with the fallback flag:

```bash
TEST_BACKEND=compose make test-integration
```

The fallback path:
- uses the same DSN you use for dev, with the database name swapped to
  `campfire_test`,
- runs migrations against `campfire_test` once at session start,
- truncates all identity tables between tests,
- is **functionally equivalent** to the Testcontainers path; it is not a
  reduced test surface.

### XSS / token storage trade-off (frontend)

The web app prefers **in-memory access token + httpOnly refresh cookie**.
If, in some environment, the cross-site cookie cannot be set
(e.g., a hosting setup that strips `Set-Cookie`), set
`VITE_AUTH_FALLBACK=session-storage` in `apps/web/.env.local`. In this
mode the refresh token is held in `sessionStorage` — readable by any XSS
on the page. **Use only for short-lived demos**; never for production.
The trade-off is documented in `apps/web/README.md`.

---

## Troubleshooting

- **`make migrate` errors with `connection refused`**: Postgres isn't up.
  `docker compose ps postgres`. If healthy, check `DATABASE_URL` in
  `apps/api/.env`.
- **`uv sync` is slow on first run**: it's downloading Python 3.12 once.
  Subsequent runs are cached.
- **CORS error in the browser console**: confirm `CORS_ORIGINS` in
  `apps/api/.env` contains `http://localhost:5173` (the Vite default).
  Production defaults are empty (FR-024).
- **Refresh doesn't survive reload**: the refresh cookie is host-only by
  default. Ensure you're hitting `http://localhost:8000` (not `127.0.0.1`)
  so the cookie's host matches across requests, and that the browser
  isn't blocking third-party cookies for `localhost`.
- **Seed migration ran but Ada can't sign in**: re-run `make db-reset`
  (drops everything, re-applies migrations including the seed). If the
  problem persists, the argon2 hash baked into `0002_seed_ada.py` may have
  drifted — regenerate via the helper at
  `apps/api/scripts/regenerate_ada_hash.py` and commit.
