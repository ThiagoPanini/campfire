# Implementation Plan: Campfire Backend Auth Slice (Identity)

**Branch**: `002-backend-auth-slice` | **Date**: 2026-04-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-backend-auth-slice/spec.md`

## Summary

Stand up the first backend service for Campfire as a Python 3.12 / FastAPI
modular monolith implementing **one** bounded context — `identity` (users,
sessions, preferences) — replacing the in-memory mock layer that powers
`apps/web/`. The slice is hexagonal: a framework-free domain layer; an
application layer of explicit use cases; and adapters for HTTP (FastAPI),
persistence (SQLAlchemy 2.x async on PostgreSQL 16 via `asyncpg`), password
hashing (`argon2-cffi`), and opaque token issuance. The wire contract is the
spec's authoritative shape (opaque access token in the JSON body, refresh
token in an `HttpOnly; Secure; SameSite=Lax` cookie, single-use rotation,
session-family revocation on reuse). The slice ships runnable locally
(`docker compose up postgres` + native `uvicorn --reload`), with seed
migration for `ada@campfire.test`, OpenAPI snapshot committed, frontend
fetch wiring (`apps/web/src/api/client.ts`, `auth.api.ts`,
`session.store.ts`) flipped from mocks to the real API, and Mintlify
backend pages added. Production target is AWS (Aurora Serverless v2 Postgres
is the leading candidate) but the specific managed service is deferred —
the application code is engine-agnostic so the choice is a Terraform
decision in a later infrastructure slice.

## Technical Context

**Language/Version**: Python 3.12 (CPython, async/await stdlib).
**Primary Dependencies**:
  - FastAPI `>=0.115,<0.116` — HTTP framework / ASGI router / OpenAPI generator.
  - Pydantic `>=2.9,<3` — request/response validation, settings.
  - `pydantic-settings` `>=2.5,<3` — typed settings provider with override hooks.
  - SQLAlchemy `>=2.0.36,<2.1` (async ORM, 2.x style).
  - `asyncpg` `>=0.30,<0.31` — async Postgres driver.
  - Alembic `>=1.13,<1.14` — schema migrations.
  - `argon2-cffi` `>=23.1,<24` — password hashing (memory-hard, OWASP-recommended).
  - `python-jose[cryptography]` `>=3.3,<4` — kept as a dependency (used only if a JWT-issuing helper is later needed for federation; access/refresh tokens in v1 are **opaque** server-issued strings, per FR-007).
  - `uvicorn[standard]` `>=0.32,<0.33` — ASGI server (dev: `--reload`).
  - `httpx` `>=0.28,<0.29` — async test client (in dev/test only).
  - `pytest` `>=8.3,<9`, `pytest-asyncio` `>=0.24,<0.25`, `pytest-anyio` (or `anyio[trio]`) — async test runtime.
  - `testcontainers[postgres]` `>=4.8,<5` — hermetic Postgres for integration tests.
  - `ruff` `>=0.7,<0.8` — lint + format.
  - `mypy` `>=1.13,<2` — typing (advisory in this slice; tightened in later slices).
**Storage**: PostgreSQL 16 (alpine image locally; `asyncpg` driver). UUID v7 PKs (with v4 fallback if `uuid-utils` not available); all timestamps `timestamptz` UTC. **No** Postgres extensions in this slice — UUID generation is application-side, hashing is application-side via `argon2-cffi`. (See "AWS readiness".)
**Testing**: `pytest` + `httpx.AsyncClient` against the FastAPI app. Integration tests hit a real Postgres via Testcontainers (preferred) or a `campfire_test` database in the Compose Postgres (WSL/CI fallback). Use-case unit tests run against fake repositories — no DB.
**Target Platform**: Linux server (containerized in production; native dev). Production target is AWS, exact service deferred (see ADR-003).
**Project Type**: Web application — Python API service (`apps/api/`) + existing Vite SPA (`apps/web/`). Modular monolith; one bounded context (`identity`) implemented in v1.
**Performance Goals**: Demo-grade. p95 < 200 ms for `/me`, `/auth/login`, `/auth/refresh` on a developer laptop with local Postgres. No load-testing gate in this slice (Principle IV — proportional rigor).
**Constraints**: Async all the way down (no sync DB calls in request path). No session-scoped Postgres state (`LISTEN/NOTIFY`, session-scoped advisory locks) — these break under RDS Proxy pinning and serverless cold starts. No per-process in-memory state that the contract depends on across requests *except* the v1 rate-limiter store (FR-011a) and that exception is documented in the spec.
**Scale/Scope**: Single-tenant, single-process dev; production sized for tens of users initially. The 7-table footprint of this slice (users, credentials, preferences, sessions, refresh_tokens, login_attempts, alembic_version) is intentionally tiny.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution: `.specify/memory/constitution.md` v1.0.1.

| Principle | Status | Evidence |
|---|---|---|
| **I. Narrow MVP Scope** | ✅ Pass | Slice implements only `identity`. Songs, groups, jam sessions, capabilities, recommendations, ratings, notes, real Google OAuth — all explicitly Out of Scope (see spec §Out of Scope). The `Out of Scope` section of this plan also explicitly excludes LocalStack, Terraform, observability stacks, and API containerization. |
| **II. Incremental Delivery** | ✅ Pass with deviation, justified | Constitution stipulates *frontend → backend → LocalStack → Terraform → CI/CD*. Frontend slice (`001-frontend-mvp-prototype`) shipped; this is the backend slice; LocalStack and Terraform remain ahead. **Deviation**: LocalStack is *deferred past* the backend slice (see ADR-005 and Complexity Tracking) — there is no AWS-service dependency in v1 that LocalStack would emulate, so introducing it now would be ceremony without payoff. The slice still produces something runnable on its own (`docker compose up postgres` + `uvicorn`). |
| **III. Boring, Proven Stack** | ✅ Pass | Python + `uv` + FastAPI + relational DB exactly per the constitution. Postgres 16. Hexagonal layering. No new languages or providers introduced. |
| **IV. Proportional Rigor** | ✅ Pass | Tests are scoped to: (a) integration tests for the auth flow (real DB, justified by SC-001/SC-002 — these paths are depended on by the frontend), (b) unit tests for use cases (cheap, deterministic). No metrics/tracing/load tests in v1 — Principle IV requires a real trigger first. |
| **V. Docs-as-Code, Continuously** | ✅ Pass | Slice ships `docs/backend/` pages (auth flow with sequence diagrams), updates `docs/docs.json` navigation in the same change set, and treats the FastAPI-generated OpenAPI snapshot at `specs/002-backend-auth-slice/contracts/openapi.json` as the contract source of truth. |

**Privacy by default (constitution V from the source-of-truth constitution at `specs/001-frontend-mvp-prototype/design-reference/project/uploads/constitution.md`)**: only `GET /me` and `PATCH /me/preferences` expose user data, both scoped to the authenticated caller (FR-025/FR-026). No listing, lookup, or admin endpoint.

**Architecture discipline**: domain layer imports nothing from FastAPI, SQLAlchemy, asyncpg, argon2, or python-jose. Adapters live at the edges. Routers MUST NOT `import sqlalchemy` (lint rule enforced — see "Architecture guard rails" below).

## Project Structure

### Documentation (this feature)

```text
specs/002-backend-auth-slice/
├── plan.md              # This file
├── spec.md              # Feature spec (already exists)
├── research.md          # Phase 0 output — tech choice rationale
├── data-model.md        # Phase 1 output — User, Credentials, Preferences, Session, RefreshToken, LoginAttempt
├── quickstart.md        # Phase 1 output — clone → up → migrate → seed → run → sign in
├── contracts/
│   └── openapi.json     # Phase 1 initial draft; regenerated from running app each commit (`make openapi-snapshot`)
├── adr/
│   ├── 0001-postgresql-as-engine.md
│   ├── 0002-sqlalchemy-async-asyncpg.md
│   ├── 0003-aws-target-service-deferred.md
│   ├── 0004-uuid-v7-timestamptz-no-pg-extensions.md
│   └── 0005-localstack-deferred.md
├── checklists/
│   └── requirements.md  # already exists
└── tasks.md             # /speckit.tasks output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
├── web/                                 # Existing — untouched except for fetch wiring (api/client.ts, features/auth/api/auth.api.ts, features/auth/session.store.ts) and .env.local.example
└── api/                                 # NEW — Python project, parallel to apps/web/
    ├── pyproject.toml                   # uv-managed; FastAPI, SQLAlchemy, Alembic, asyncpg, argon2-cffi, python-jose, pydantic, pytest, ruff, mypy
    ├── uv.lock
    ├── README.md
    ├── Makefile                         # run, test, migrate, seed, lint, format, openapi-snapshot
    ├── .env.example                     # DATABASE_URL, JWT_*, CORS_ORIGINS, GOOGLE_STUB_ENABLED, ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS
    ├── alembic.ini
    ├── alembic/
    │   ├── env.py                       # async-aware
    │   ├── script.py.mako
    │   └── versions/
    │       ├── 0001_identity_initial.py # users, credentials, preferences, sessions, refresh_tokens, login_attempts
    │       └── 0002_seed_ada.py         # idempotent seed migration (FR-020/FR-021)
    ├── src/
    │   └── campfire_api/
    │       ├── __init__.py
    │       ├── main.py                  # FastAPI app factory; CORS; request-id middleware; router includes
    │       ├── settings.py              # SettingsProvider port + EnvSettingsProvider adapter (rotation-aware seam)
    │       ├── contexts/
    │       │   └── identity/            # ONE bounded context in v1; structure leaves room for capability/, group/, jam_session/ siblings
    │       │       ├── __init__.py
    │       │       ├── domain/
    │       │       │   ├── entities.py          # User, Credentials, Preferences, Session, RefreshToken (pure dataclasses; no SQLAlchemy)
    │       │       │   ├── value_objects.py     # Email (normalized), DisplayName, PasswordHash, AccessTokenValue, RefreshTokenValue, CatalogId
    │       │       │   ├── events.py            # SessionRevoked, RefreshTokenReused (plain dataclasses; no broker yet)
    │       │       │   ├── catalogs.py          # frozen instruments/genres/contexts/goals/experience id sets — must equal frontend data-model
    │       │       │   └── ports.py             # UserRepository, SessionRepository, RefreshTokenRepository, PreferencesRepository, PasswordHasher, TokenIssuer, Clock, RateLimiter (Protocol classes)
    │       │       ├── application/
    │       │       │   ├── use_cases/
    │       │       │   │   ├── register_user.py
    │       │       │   │   ├── authenticate_user.py
    │       │       │   │   ├── refresh_session.py
    │       │       │   │   ├── sign_out.py
    │       │       │   │   ├── get_me.py
    │       │       │   │   ├── update_preferences.py
    │       │       │   │   └── google_stub_sign_in.py
    │       │       │   └── errors.py            # InvalidCredentials, EmailAlreadyRegistered, RefreshTokenReused, RateLimited, GoogleStubDisabled, UnknownCatalogId
    │       │       └── adapters/
    │       │           ├── http/
    │       │           │   ├── routers/
    │       │           │   │   ├── auth.py             # POST /auth/register, /auth/login, /auth/refresh, /auth/sign-out
    │       │           │   │   ├── me.py               # GET /me, PATCH /me/preferences
    │       │           │   │   ├── google_stub.py      # POST /auth/google-stub
    │       │           │   │   └── health.py           # GET /health
    │       │           │   ├── schemas.py              # Pydantic v2 models — request/response DTOs only
    │       │           │   ├── deps.py                 # FastAPI dependencies: settings, db_session, current_user, csrf_guard
    │       │           │   ├── csrf.py                 # double-submit / Authorization-pinning guard for /auth/refresh (FR-008a)
    │       │           │   └── error_mapping.py        # domain error → HTTP status
    │       │           ├── persistence/
    │       │           │   ├── models.py               # SQLAlchemy DeclarativeBase ORM models (UserRow, CredentialsRow, PreferencesRow, SessionRow, RefreshTokenRow, LoginAttemptRow)
    │       │           │   ├── engine.py               # async engine; DSN read from settings provider on each acquire (rotation-aware)
    │       │           │   ├── unit_of_work.py         # AsyncSession factory; transactional boundary
    │       │           │   ├── user_repository.py
    │       │           │   ├── session_repository.py
    │       │           │   ├── refresh_token_repository.py
    │       │           │   └── preferences_repository.py
    │       │           ├── security/
    │       │           │   ├── argon2_hasher.py        # PasswordHasher impl (argon2id, OWASP params)
    │       │           │   └── opaque_token_issuer.py  # TokenIssuer impl: cryptographic random + SHA-256 lookup hash
    │       │           ├── rate_limiting/
    │       │           │   └── in_memory_limiter.py    # 10 / rolling 5 min per (ip, email); v1 only
    │       │           └── clock/
    │       │               └── system_clock.py
    │       └── shared/
    │           ├── logging.py                          # stdlib logging, JSON formatter
    │           └── request_id.py                       # ASGI middleware
    └── tests/
        ├── conftest.py                                  # Testcontainers fixture (preferred) + Compose-DB fallback
        ├── unit/
        │   └── identity/                                # use-case tests against fake repositories
        ├── integration/
        │   └── identity/                                # httpx.AsyncClient against the real app + real Postgres
        └── contract/
            └── openapi_snapshot_test.py                 # diffs running app's OpenAPI against committed snapshot
```

**Structure Decision**: Web application with two parallel apps under `apps/`. The `apps/api/` tree uses a `contexts/<bounded-context>/{domain,application,adapters}` layout. Today only `contexts/identity/` exists; the layout is identical to the future `contexts/capability/`, `contexts/group/`, `contexts/jam_session/` so adding a context is a sibling folder, not a refactor. The HTTP adapter is the only place where FastAPI is imported; the persistence adapter is the only place where SQLAlchemy/asyncpg are imported. Routers must not import SQLAlchemy (enforced by ruff `flake8-tidy-imports.banned-modules`).

### Architecture guard rails (codified)

- `ruff` `flake8-tidy-imports.banned-modules`:
  - `sqlalchemy` banned in `**/adapters/http/**` and in `**/domain/**` and in `**/application/**`.
  - `fastapi` banned in `**/domain/**` and `**/application/**` and `**/adapters/persistence/**`.
  - `argon2` and `jose` banned in `**/domain/**` and `**/application/**`.
- A unit test (`tests/unit/architecture_test.py`) asserts the same with `importlib`/AST so the rule survives a ruff config drift.

### Migration strategy

- **Tool**: Alembic, async-aware `env.py` (uses `engine.begin()` on `AsyncEngine`).
- **Policy**:
  - **Hand-written** for any migration that creates, drops, or alters tables in this slice. Autogenerate may *propose* a diff but the human commits a reviewed, hand-edited file. Rationale: autogenerated migrations routinely miss indexes, server defaults, enum ordering, and constraint names — and the cost of a wrong migration in identity is high.
  - **Idempotent seeds** (`0002_seed_ada.py`) use `INSERT … ON CONFLICT DO NOTHING` so re-running the migration against a populated DB is a no-op (FR-021).
  - All migration files include both `upgrade()` and `downgrade()`; downgrade is best-effort but committed.
- **Naming**: `NNNN_<slug>.py`. Revision ids are short hashes; `down_revision` is explicit.
- **Schema discipline**: every migration commits the full DDL it intends; no relying on database-side autoincrement, no relying on Postgres extensions for defaults (UUIDs are computed application-side — see ADR-004).

### Env var contract

| Variable | Required | Default (dev) | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | `postgresql+asyncpg://campfire:campfire@localhost:5432/campfire` | Async DSN. Read via `SettingsProvider`, **not** at import time. Production seam: swap `EnvSettingsProvider` for an `AwsSecretsManagerSettingsProvider` later. |
| `ACCESS_TOKEN_TTL_SECONDS` | no | `900` (15 min) | Per FR-007. |
| `REFRESH_TOKEN_TTL_SECONDS` | no | `1209600` (14 days) | Per FR-007. |
| `JWT_SECRET` | no (this slice) | unset | Reserved key — included in `.env.example` as a placeholder for the future federation slice. v1 tokens are **opaque**, not signed. |
| `CORS_ORIGINS` | yes | `http://localhost:5173` | Comma-separated allow-list; `*` is rejected when credentials are allowed (FR-023/FR-024). Production default is empty. |
| `GOOGLE_STUB_ENABLED` | no | `true` (dev), `false` (prod) | FR-018. |
| `RATE_LIMIT_PER_WINDOW` | no | `10` | FR-011a. |
| `RATE_LIMIT_WINDOW_SECONDS` | no | `300` | FR-011a. |
| `LOG_LEVEL` | no | `INFO` | Stdlib logging. |
| `ENV` | no | `dev` | Drives prod-vs-dev defaults (Google stub, CORS empty default). |
| `REFRESH_COOKIE_NAME` | no | `campfire_refresh` | Fixed in v1; configurable to ease cross-environment cookie scoping. |
| `REFRESH_COOKIE_DOMAIN` | no | unset (host-only) | Set in production once a public hostname is chosen. |

### `apps/web/` changes (in this slice)

- `apps/web/src/api/client.ts`: replace stub with a real `fetch`-based client. `VITE_API_URL` base; `credentials: "include"` for `/auth/refresh` and `/auth/sign-out` so the cookie flows; access token kept in memory and attached as `Authorization: Bearer <token>`.
- `apps/web/src/features/auth/api/auth.api.ts`: replace mock impls with calls through `client`. **Function signatures unchanged** so call sites in pages don't move. `seededCredentials` export stays (used by the seeded sign-in path).
- `apps/web/src/features/auth/session.store.ts`: on app load, call `POST /auth/refresh` once; if it returns 200, hydrate the in-memory access token + user; if it returns 401, leave the user signed out (matches the FR captured in the spec for SC-002).
- `apps/web/.env.local.example`: add `VITE_API_URL=http://localhost:8000`.
- Token storage: in-memory access token + httpOnly refresh cookie (preferred path). Fallback (sessionStorage with explicit XSS-risk note) is documented in `quickstart.md` and `apps/web/README.md`, used only if a hosting environment rejects the cross-site cookie setup.

### Docs-as-code

New pages under `docs/backend/`:
- `docs/backend/overview.mdx` — what the identity slice is, what's deferred.
- `docs/backend/auth-flow.mdx` — register / login / refresh / sign-out sequence diagrams (Mermaid).
- `docs/backend/contracts.mdx` — link to the committed OpenAPI snapshot, summary of error shapes.
- `docs/backend/local-dev.mdx` — mirrors quickstart.md but tailored for readers.

`docs/docs.json` gains a `BACKEND` group under the existing Docs tab.

### AWS readiness (load-bearing)

These rules keep the slice portable to Aurora Postgres / Aurora Serverless v2 without an application rewrite. They are non-negotiable in this slice:

1. **Postgres-only**, no SQLite, no MySQL, no NoSQL. Both dev and any future deployment target a Postgres-compatible engine.
2. **`asyncpg` driver** end-to-end. No `psycopg2`. Async pool sizes tuned with RDS Proxy in mind (small per-pod pool; pgbouncer-friendly).
3. **DSN via `SettingsProvider`**, not a one-shot `os.getenv` at boot. The provider is queried lazily so a future `AwsSecretsManagerSettingsProvider` can refresh credentials on rotation without a process restart. Concrete contract: `SettingsProvider.database_url() -> str` is awaited each time the engine is (re)created or its credentials are believed stale.
4. **No session-scoped Postgres state**. `LISTEN/NOTIFY`, session-scoped advisory locks, and temp tables are banned. RDS Proxy pinning and serverless cold starts make these unreliable.
5. **No Postgres extensions in this slice**. The implementation does not use `pg_trgm`, `citext`, `pgcrypto`, `uuid-ossp`, or `pg_stat_statements` directly. UUIDs are generated application-side (UUID v7 via `uuid-utils`, fallback v4). Email normalization is application-side (lowercase + trim) instead of `citext`. Password hashing is application-side via `argon2-cffi` instead of `pgcrypto`. **Extension allowlist (for future slices)**: any extension introduced later MUST be on the [Aurora Postgres supported-extensions list](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraPostgreSQLReleaseNotes/AuroraPostgreSQL.Extensions.html) and the PR adding it MUST cite that page; if it isn't, pick a different mechanism.
6. **Timestamps are `timestamptz` UTC**. No naïve `timestamp`, no app-server-local time math.
7. **Connection lifecycle is per-request**. No global open transactions, no per-app singletons that cache row data.
8. **Deployment-shape neutrality**. Neither the application code nor the migrations assume a specific managed offering. The choice between RDS Postgres / Aurora Postgres / Aurora Serverless v2 is a Terraform decision in a later slice (ADR-003).

A short checklist with these rules is appended to `docs/backend/overview.mdx` so reviewers can spot drift in future PRs.

## Phase 0: Outline & Research

See [research.md](./research.md). Each technology choice is paired with at least one alternative considered:

- FastAPI vs. Litestar / Starlette-only / Flask-async.
- SQLAlchemy 2.x async vs. Tortoise ORM / SQLModel / raw asyncpg.
- `asyncpg` vs. `psycopg` async (psycopg3 async).
- Alembic vs. yoyo-migrations / hand-rolled SQL files.
- `argon2-cffi` vs. `bcrypt` / `passlib`.
- `python-jose` vs. `PyJWT` / `authlib`.
- PostgreSQL vs. SQLite (rejected — see ADR-001) / MySQL.
- Testcontainers vs. ephemeral schema-per-test on a shared DB / `pytest-postgresql`.
- `uv` vs. Poetry / pip-tools / Hatch.

**Output**: research.md with no NEEDS CLARIFICATION markers remaining.

## Phase 1: Design & Contracts

- **Data model** ([data-model.md](./data-model.md)): six tables — `users`, `credentials`, `preferences`, `sessions`, `refresh_tokens`, `login_attempts` (rate limiter audit; in-memory in v1, table sketched for the future shared-store slice). Indexes, integrity rules, lifecycle transitions, and the family-revocation rule are all documented there.
- **Contracts** ([contracts/openapi.json](./contracts/openapi.json)): initial OpenAPI 3.1 draft committed; regenerated from the running app via `make openapi-snapshot`. Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/sign-out`, `POST /auth/google-stub`, `GET /me`, `PATCH /me/preferences`, `GET /health`. A contract test (`tests/contract/openapi_snapshot_test.py`) fails CI if the live schema drifts from the committed snapshot.
- **Quickstart** ([quickstart.md](./quickstart.md)): clone → `docker compose up -d postgres` → `uv sync` → `make migrate` → `make seed` → `make run` → `pnpm --filter @campfire/web dev` → sign in with seeded creds.
- **ADRs** under [adr/](./adr/): five one-pagers (PostgreSQL engine, SQLAlchemy 2.x async + asyncpg, AWS target deferred, UUID v7 + timestamptz / no extensions, LocalStack deferred).
- **Agent context update**: this plan replaces the `001-frontend-mvp-prototype/plan.md` reference inside the `<!-- SPECKIT START --> … <!-- SPECKIT END -->` markers in `AGENTS.md` (and its `CLAUDE.md` symlink) with this file's path.

**Post-design constitution re-check**: ✅ All gates still pass after design — no new principle violations introduced. The single deviation (LocalStack deferred) is captured below in Complexity Tracking and in ADR-005.

## Out of Scope (this slice)

- **LocalStack** — no AWS service in v1 needs emulation. Deferred per ADR-005.
- **Real Google OAuth** — `/auth/google-stub` is a deliberate dev-only placeholder.
- **Domain models for Song, Capability, Group, JamSession** — siblings under `contexts/` in future slices.
- **Deployment infrastructure** — no Terraform, no ECS, no CloudFront, no GitHub Actions deploy pipeline.
- **Observability stack** — beyond stdlib logging + a `request-id` middleware. No metrics, no tracing, no error reporting integration.
- **Containerizing the API itself** — only Postgres lives in Compose; the API runs natively under `uvicorn --reload` for fast iteration and debugger support.
- **Multi-process rate-limiter store** — v1 limiter is in-process (FR-011a). A shared store is a later-slice concern.
- **Account recovery, email verification, MFA, password-strength scoring** — out per spec §Out of Scope.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| LocalStack deferred (deviates from constitution Principle II's stated build order) | This slice has zero AWS-service dependencies. Postgres is local. The Google "OAuth" is a stubbed endpoint. There is nothing to emulate. | Introducing LocalStack now would be ~250 MB of Compose surface area, a second runtime to keep healthy, and a learning tax for new contributors — all to emulate services we do not call. ADR-005 documents the deferral and the trigger that would reverse it (the first slice that integrates with S3 / SQS / Cognito / Secrets Manager / SES). |
| Two storage representations (domain entities vs. SQLAlchemy ORM rows) | Hexagonal layering requires the domain layer to be framework-free; SQLAlchemy types leak metaclass machinery and lazy-load semantics that make pure-domain reasoning harder. | Letting routers and use cases consume SQLAlchemy rows directly would couple the application layer to the ORM and violate FR-028/FR-029. The mapping cost is small (six entities) and pays for itself the first time we swap repository implementations (e.g., for an in-memory test fake or a future read-replica). |
