---
description: "Task list for the Campfire backend auth slice (identity context)"
---

# Tasks: Campfire Backend Auth Slice (Identity)

**Input**: Design documents from `/specs/002-backend-auth-slice/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.json, quickstart.md

**Tests**: Unit tests for the domain and the use-case layer are MANDATORY (per plan.md Phase 1 and Constitution Principle IV). Integration tests against a real Postgres are MANDATORY for every route (per the user request "Every task that adds a route MUST include both an integration test against a real Postgres AND an OpenAPI snapshot update").

**Organization**: Tasks are grouped by the eight delivery phases mandated in the feature prompt (bootstrap → domain → adapters → use cases → routers → frontend wiring → docs → acceptance). Use-case and router tasks carry user-story labels (`[US1]`–`[US4]`) so each frontend journey can be traced through the stack.

## User Stories Reference

- **US1** — Returning user signs in and lands on home (P1, demo-critical).
- **US2** — First-time user signs up, completes onboarding, and refresh survives reload (P1).
- **US3** — `Continue with Google` keeps working via a dev stub (P2).
- **US4** — Explicit sign-out invalidates the session server-side (P2).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel — different files, no incomplete dependencies.
- **[Story]**: Maps to a user story. Setup / foundational / polish tasks have no story label.
- File paths are absolute from the repo root.

## Path Conventions

- Backend: `apps/api/` (new in this slice).
- Frontend (existing): `apps/web/`.
- Docs: `docs/backend/`, `docs/docs.json`.
- Spec artefacts: `specs/002-backend-auth-slice/`.

---

## Phase 1: Bootstrap `apps/api/` (Setup)

**Purpose**: Stand up a runnable, lintable, testable, Postgres-connected FastAPI skeleton with Alembic, settings, health checks, CORS, and developer ergonomics.

**Constraint**: API is **not** containerized. Compose runs only Postgres. No LocalStack, S3, SQS, Cognito, Secrets Manager, Lambda, Terraform, or container images for the API.

- [X] T001 Create Python project skeleton at [apps/api/pyproject.toml](apps/api/pyproject.toml): uv-managed, Python 3.12, declare runtime deps (fastapi, pydantic, pydantic-settings, sqlalchemy, asyncpg, alembic, argon2-cffi, python-jose, uvicorn[standard], httpx) and dev deps (pytest, pytest-asyncio, anyio, testcontainers[postgres], ruff, mypy, uuid-utils). Generate `apps/api/uv.lock` via `uv sync`.
- [X] T002 [P] Configure ruff at [apps/api/pyproject.toml](apps/api/pyproject.toml) with `flake8-tidy-imports.banned-modules` mapping per plan.md Architecture guard rails: ban `sqlalchemy` from `**/adapters/http/**`, `**/domain/**`, `**/application/**`; ban `fastapi` from `**/domain/**`, `**/application/**`, `**/adapters/persistence/**`; ban `argon2`, `jose` from `**/domain/**`, `**/application/**`.
- [X] T003 [P] Configure pytest at [apps/api/pyproject.toml](apps/api/pyproject.toml): asyncio_mode=auto, testpaths=["tests"], markers (`unit`, `integration`, `contract`).
- [X] T004 Create FastAPI app factory at [apps/api/src/campfire_api/main.py](apps/api/src/campfire_api/main.py) returning a minimal `FastAPI()` with title and version pulled from settings. No routers wired yet.
- [X] T005 Create the `SettingsProvider` port + `EnvSettingsProvider` adapter at [apps/api/src/campfire_api/settings.py](apps/api/src/campfire_api/settings.py): pydantic-settings model loading `DATABASE_URL`, `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`, `CORS_ORIGINS`, `GOOGLE_STUB_ENABLED`, `RATE_LIMIT_PER_WINDOW`, `RATE_LIMIT_WINDOW_SECONDS`, `LOG_LEVEL`, `ENV`, `REFRESH_COOKIE_NAME`, `REFRESH_COOKIE_DOMAIN`. Expose async-friendly accessors (`database_url()`, etc.) so an `AwsSecretsManagerSettingsProvider` can slot in later without touching call sites.
- [X] T006 [P] Add [apps/api/.env.example](apps/api/.env.example) listing every env var documented in plan.md §Env var contract with their dev defaults.
- [X] T007 Author Compose file at [docker-compose.yml](docker-compose.yml) with **only** a `postgres:16-alpine` service: healthcheck (`pg_isready`), named volume, `POSTGRES_USER=campfire`, `POSTGRES_PASSWORD=campfire`, `POSTGRES_DB=campfire`, exposed on `localhost:5432`. The API is NOT a service in this file.
- [X] T008 Wire SQLAlchemy 2.x async engine at [apps/api/src/campfire_api/contexts/identity/adapters/persistence/engine.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/engine.py) using `asyncpg`, `pool_pre_ping=True`, DSN read from `SettingsProvider` lazily (rotation-aware seam, NOT `os.getenv` at import).
- [X] T009 Add async session factory + FastAPI dependency at [apps/api/src/campfire_api/contexts/identity/adapters/persistence/unit_of_work.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/unit_of_work.py) yielding an `AsyncSession` per request and committing/rolling back on exit.
- [X] T010 Initialise Alembic at [apps/api/alembic.ini](apps/api/alembic.ini) and [apps/api/alembic/env.py](apps/api/alembic/env.py): async-aware `env.py` using `engine.begin()` on `AsyncEngine`; reads DSN from `SettingsProvider`. Generate the empty baseline revision [apps/api/alembic/versions/0000_baseline.py](apps/api/alembic/versions/0000_baseline.py).
- [ ] T011 Verify `alembic upgrade head` succeeds against the Compose Postgres (manual gate; documented in [apps/api/README.md](apps/api/README.md)).
- [X] T012 [P] Implement the Aurora-extension allowlist guard at [apps/api/scripts/check_aurora_extensions.py](apps/api/scripts/check_aurora_extensions.py): scans `apps/api/alembic/versions/*.py` for `CREATE EXTENSION` and fails if the extension name is not on the Aurora-supported list (hard-coded allowlist constant). Wired as a make target (T020).
- [X] T013 [P] Add liveness + readiness routes at [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/health.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/health.py): `GET /healthz` returns `{"status":"ok"}` (no DB call); `GET /readyz` performs `SELECT 1` via the async session and returns 503 on failure. Include them in `main.py`.
- [X] T014 [P] Add structured logging at [apps/api/src/campfire_api/shared/logging.py](apps/api/src/campfire_api/shared/logging.py) (stdlib logging, JSON formatter, level from settings).
- [X] T015 [P] Add request-id middleware at [apps/api/src/campfire_api/shared/request_id.py](apps/api/src/campfire_api/shared/request_id.py): reads `X-Request-Id` header or generates a UUID v7; binds it to a contextvar so logs include it; echoes it back on the response. Register in `main.py`.
- [X] T016 Configure CORS in [apps/api/src/campfire_api/main.py](apps/api/src/campfire_api/main.py): allow-list driven by `CORS_ORIGINS`, default `http://localhost:5173` in dev, empty in prod. `allow_credentials=True`, `allow_headers=["Authorization","Content-Type","X-Request-Id"]`, all methods used by documented endpoints. Reject `*` when credentials are allowed (FR-023/FR-024).
- [X] T017 Add [apps/api/Makefile](apps/api/Makefile) with targets: `run`, `test`, `test-unit`, `test-integration`, `migrate`, `downgrade`, `seed`, `lint`, `format`, `openapi-snapshot`, `db-reset`, `check-aurora-extensions`. Each target wraps `uv run …`.
- [X] T018 Update [specs/002-backend-auth-slice/quickstart.md](specs/002-backend-auth-slice/quickstart.md) to document the `make` targets and confirm the `docker compose up -d postgres` → `uv sync` → `make migrate` → `make seed` → `make run` flow works end-to-end.

**Checkpoint**: API boots; `/healthz` returns 200; `/readyz` confirms DB connectivity; ruff and pytest run clean against an empty test suite; `make migrate` applies the empty baseline.

---

## Phase 2: Identity Domain (Foundational, pure Python — no FastAPI, no SQLAlchemy)

**Purpose**: Framework-free entities, value objects, and ports that every later phase consumes. Blocks everything downstream.

**Parallel rule**: Tasks within this phase that touch different files run in parallel; they all depend on T001/T004 from Phase 1.

- [X] T019 [P] Create value objects at [apps/api/src/campfire_api/contexts/identity/domain/value_objects.py](apps/api/src/campfire_api/contexts/identity/domain/value_objects.py): `Email` (normalized — lowercase + trim, length 3–320, regex check), `HashedPassword` (opaque wrapper), `DisplayName` (1–80 chars), `UserId` / `SessionId` / `RefreshTokenId` / `SessionFamilyId` (UUID v7 with v4 fallback), `AccessTokenValue` / `RefreshTokenValue` (opaque), `AccentPresetId`, `Language`.
- [X] T020 [P] Create the catalogs module at [apps/api/src/campfire_api/contexts/identity/domain/catalogs.py](apps/api/src/campfire_api/contexts/identity/domain/catalogs.py): frozen sets for instruments (12), genres (13), contexts (6), goals (6), experience (`beginner|learning|intermediate|advanced`). Values MUST equal the catalog ids in [apps/web/src/mocks/fixtures/user.ts](apps/web/src/mocks/fixtures/user.ts) and `specs/001-frontend-mvp-prototype/data-model.md`.
- [X] T021 [P] Create entities at [apps/api/src/campfire_api/contexts/identity/domain/entities.py](apps/api/src/campfire_api/contexts/identity/domain/entities.py) as plain dataclasses (no ORM, no Pydantic): `User`, `Credentials`, `PreferencesProfile`, `Session`, `RefreshToken`. Include the `firstLogin` flag on `User` and the `family_id` on `Session` / `RefreshToken`.
- [X] T022 [P] Create domain events at [apps/api/src/campfire_api/contexts/identity/domain/events.py](apps/api/src/campfire_api/contexts/identity/domain/events.py): `SessionRevoked`, `RefreshTokenReused` as dataclasses. No broker yet.
- [X] T023 Create repository ports at [apps/api/src/campfire_api/contexts/identity/domain/ports.py](apps/api/src/campfire_api/contexts/identity/domain/ports.py): `UserRepository`, `CredentialsRepository`, `PreferencesRepository`, `SessionRepository`, `RefreshTokenRepository` as `typing.Protocol` classes with async method signatures.
- [X] T024 [P] Add infrastructure ports to the same file (or [apps/api/src/campfire_api/contexts/identity/domain/ports.py](apps/api/src/campfire_api/contexts/identity/domain/ports.py)): `PasswordHasher`, `TokenIssuer`, `Clock`, `RateLimiter` (Protocols, no implementations).
- [X] T025 [P] Add domain errors at [apps/api/src/campfire_api/contexts/identity/application/errors.py](apps/api/src/campfire_api/contexts/identity/application/errors.py): `InvalidCredentials`, `EmailAlreadyRegistered`, `RefreshTokenInvalid`, `RefreshTokenReused`, `RateLimited`, `GoogleStubDisabled`, `UnknownCatalogId`, `SessionRevokedError`.
- [X] T026 Unit tests for entity invariants at [apps/api/tests/unit/identity/test_entities.py](apps/api/tests/unit/identity/test_entities.py): email format normalization, password length floor (8 chars on registration input, enforced via factory), preferences-id membership against `catalogs.py`, display-name derivation from email local-part.
- [X] T027 Architecture-guard test at [apps/api/tests/unit/test_architecture.py](apps/api/tests/unit/test_architecture.py): asserts via `importlib`/AST that no module under `domain/` or `application/` imports `fastapi`, `sqlalchemy`, `argon2`, or `jose`. Survives ruff config drift.

**Checkpoint**: `pytest -m unit` passes. Domain layer has zero infrastructure imports, verified twice (ruff config + the architecture test).

---

## Phase 3: Identity Adapters (Foundational)

**Purpose**: Concrete persistence + security adapters. Blocks the application/router phases.

- [X] T028 SQLAlchemy 2.x DeclarativeBase models at [apps/api/src/campfire_api/contexts/identity/adapters/persistence/models.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/models.py): `UserRow`, `CredentialsRow`, `PreferencesRow`, `SessionRow`, `RefreshTokenRow`. Match the schema in [data-model.md](specs/002-backend-auth-slice/data-model.md): UUID v7 PKs, `TIMESTAMPTZ` columns, `BYTEA` token fingerprints, `JSONB` preference arrays, all CHECK constraints, indexes (`ux_users_email`, `ux_sessions_access_token_fingerprint`, `ix_sessions_user_id`, `ix_sessions_family_id_active`, `ux_refresh_tokens_fingerprint`, `ix_refresh_tokens_family_id_active`, `ix_refresh_tokens_user_id`).
- [ ] T029 Generate Alembic migration via `uv run alembic revision --autogenerate -m "identity_initial"` then **hand-edit** [apps/api/alembic/versions/0001_identity_initial.py](apps/api/alembic/versions/0001_identity_initial.py): deterministic column order, explicit constraint names, CHECK clauses, indexes, both `upgrade()` and `downgrade()`. Verify `alembic upgrade head && alembic downgrade base && alembic upgrade head` succeeds.
- [X] T030 Confirm the migration adds zero Postgres extensions (the `check-aurora-extensions` make target must pass).
- [X] T031 [P] User repository impl at [apps/api/src/campfire_api/contexts/identity/adapters/persistence/user_repository.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/user_repository.py): async SQLAlchemy 2.x style, mapping rows ↔ domain `User`. Methods: `get_by_email`, `get_by_id`, `add`, `update`.
- [X] T032 [P] Credentials repository impl at [apps/api/src/campfire_api/contexts/identity/adapters/persistence/credentials_repository.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/credentials_repository.py): `get_by_user_id`, `add`.
- [X] T033 [P] Preferences repository impl at [apps/api/src/campfire_api/contexts/identity/adapters/persistence/preferences_repository.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/preferences_repository.py): `get_by_user_id`, `add`, `replace` (full replacement per FR-015).
- [X] T034 [P] Session repository impl at [apps/api/src/campfire_api/contexts/identity/adapters/persistence/session_repository.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/session_repository.py): `add`, `get_by_access_fingerprint`, `revoke`, `revoke_family` (sets `revoked_at`/`revoked_reason` for every active row in a family).
- [X] T035 [P] Refresh-token repository impl at [apps/api/src/campfire_api/contexts/identity/adapters/persistence/refresh_token_repository.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/refresh_token_repository.py): `add`, `get_by_fingerprint`, `consume_atomic` (single UPDATE … WHERE consumed_at IS NULL RETURNING — losers see no row and treat it as reuse), `revoke_family`.
- [X] T036 [P] Argon2 password hasher adapter at [apps/api/src/campfire_api/contexts/identity/adapters/security/argon2_hasher.py](apps/api/src/campfire_api/contexts/identity/adapters/security/argon2_hasher.py): argon2id with OWASP-recommended params; verify constant-time; never log plaintext.
- [X] T037 [P] Opaque token issuer adapter at [apps/api/src/campfire_api/contexts/identity/adapters/security/opaque_token_issuer.py](apps/api/src/campfire_api/contexts/identity/adapters/security/opaque_token_issuer.py): generate cryptographically random opaque strings, return `(plaintext, sha256_fingerprint)`. Reads access/refresh TTLs from `SettingsProvider`. Refresh tokens stored hashed (SHA-256), single-use, rotated on use.
- [X] T038 [P] System clock adapter at [apps/api/src/campfire_api/contexts/identity/adapters/clock/system_clock.py](apps/api/src/campfire_api/contexts/identity/adapters/clock/system_clock.py): UTC-only `now()`.
- [X] T039 [P] In-memory rate limiter adapter at [apps/api/src/campfire_api/contexts/identity/adapters/rate_limiting/in_memory_limiter.py](apps/api/src/campfire_api/contexts/identity/adapters/rate_limiting/in_memory_limiter.py): rolling 5-minute window, 10 attempts per `(client_ip, target_email)`, in-process dict (FR-011a). Per-process; documented in `quickstart.md`.
- [X] T040 Idempotent seed migration at [apps/api/alembic/versions/0002_seed_ada.py](apps/api/alembic/versions/0002_seed_ada.py): inserts `ada@campfire.test` (display name `Ada`, `firstLogin=false`), credentials with the argon2id hash of `campfire123` (computed once and committed verbatim), and preferences taken bit-for-bit from [apps/web/src/mocks/fixtures/user.ts](apps/web/src/mocks/fixtures/user.ts). All inserts use `ON CONFLICT DO NOTHING` (FR-021/SC-005).
- [X] T041 Seed wrapper script at [apps/api/scripts/seed.py](apps/api/scripts/seed.py) invoked by `make seed`: re-runs `alembic upgrade head` (which idempotently applies `0002_seed_ada.py`) and prints a one-line confirmation. The Google-stub fixture user (`google.member@campfire.test`) is **NOT** seeded here — it is upserted lazily by the `google_stub_sign_in` use case on first invocation with the sign-up intent (FR-019, [data-model.md](specs/002-backend-auth-slice/data-model.md)).
- [X] T042 [P] Helper at [apps/api/scripts/regenerate_ada_hash.py](apps/api/scripts/regenerate_ada_hash.py) referenced from quickstart troubleshooting: prints a fresh argon2id hash of `campfire123` for pasting into `0002_seed_ada.py` if it ever needs rotation.

**Checkpoint**: `make migrate && make seed` produces a database where `ada@campfire.test` exists with one credentials row + one preferences row, and `google.member@campfire.test` exists with no credentials row. Re-running both is a no-op.

---

## Phase 4: Application Use Cases (per user story)

**Purpose**: Pure-application logic against ports. Each use case is exercised with fake repositories in unit tests (no DB).

### Use cases for User Story 2 — Sign-up + preferences (P1)

- [X] T043 [US2] `RegisterUser` use case at [apps/api/src/campfire_api/contexts/identity/application/use_cases/register_user.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/register_user.py): normalize email, enforce 8-char minimum, hash password via `PasswordHasher`, persist `User` + `Credentials` + empty `Preferences`, derive display name from local-part, set `first_login=true`, raise `EmailAlreadyRegistered` on conflict.
- [X] T044 [P] [US2] `UpdatePreferences` use case at [apps/api/src/campfire_api/contexts/identity/application/use_cases/update_preferences.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/update_preferences.py): validate every id against `catalogs.py` (raise `UnknownCatalogId` on miss; full-request fail), full-replace the preferences row, flip `first_login=false`.

### Use cases for User Story 1 — Returning sign-in (P1)

- [X] T045 [US1] `AuthenticateUser` use case at [apps/api/src/campfire_api/contexts/identity/application/use_cases/authenticate_user.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/authenticate_user.py): normalize email, look up credentials, verify hash, raise generic `InvalidCredentials` on any failure (no email-existence leak — FR-011), open a `Session` + issue access token + refresh token (delegated to `TokenIssuer`).
- [X] T046 [P] [US1] `GetCurrentUser` use case at [apps/api/src/campfire_api/contexts/identity/application/use_cases/get_me.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/get_me.py): given a `UserId`, return `User` + `PreferencesProfile`. (Bearer-token validation lives in the HTTP `current_user` dependency.)

### Use cases shared by US1 + US2 — Refresh-on-reload (P1)

- [X] T047 [US1] `RefreshSession` use case at [apps/api/src/campfire_api/contexts/identity/application/use_cases/refresh_session.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/refresh_session.py): atomic consume-and-rotate (per `consume_atomic` semantics in T035); on reuse-detection, revoke the family and raise `RefreshTokenReused`.

### Use cases for User Story 4 — Sign-out (P2)

- [X] T048 [US4] `RevokeSession` use case at [apps/api/src/campfire_api/contexts/identity/application/use_cases/sign_out.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/sign_out.py): mark the current session and refresh token revoked (`signed_out`), idempotent.

### Use cases for User Story 3 — Google stub (P2)

- [X] T049 [US3] `ContinueWithGoogleStub` use case at [apps/api/src/campfire_api/contexts/identity/application/use_cases/google_stub_sign_in.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/google_stub_sign_in.py): if disabled, raise `GoogleStubDisabled`; otherwise upsert `google.member@campfire.test` with no credentials row + empty preferences (sign-up intent) or look up the seeded user (sign-in intent), and mint a session.

### Use-case unit tests (fake repositories, no DB)

- [X] T050 [P] [US2] Unit tests at [apps/api/tests/unit/identity/test_register_user.py](apps/api/tests/unit/identity/test_register_user.py): happy path, duplicate email, password too short.
- [X] T051 [P] [US2] Unit tests at [apps/api/tests/unit/identity/test_update_preferences.py](apps/api/tests/unit/identity/test_update_preferences.py): happy path (flips `first_login`), unknown id rejection, nullable shapes accepted.
- [X] T052 [P] [US1] Unit tests at [apps/api/tests/unit/identity/test_authenticate_user.py](apps/api/tests/unit/identity/test_authenticate_user.py): happy path returns access+refresh, wrong password returns generic error, unknown email returns the **same** generic error.
- [X] T053 [P] [US1] Unit tests at [apps/api/tests/unit/identity/test_get_me.py](apps/api/tests/unit/identity/test_get_me.py): returns user + preferences; missing user raises.
- [X] T054 [P] [US1] Unit tests at [apps/api/tests/unit/identity/test_refresh_session.py](apps/api/tests/unit/identity/test_refresh_session.py): happy rotation, single-use enforcement, reuse-detection revokes the family.
- [X] T055 [P] [US4] Unit tests at [apps/api/tests/unit/identity/test_sign_out.py](apps/api/tests/unit/identity/test_sign_out.py): revokes session + refresh token; second call is a no-op.
- [X] T056 [P] [US3] Unit tests at [apps/api/tests/unit/identity/test_google_stub.py](apps/api/tests/unit/identity/test_google_stub.py): disabled flag raises; sign-up intent creates the fixture once; sign-in intent returns seeded user.

**Checkpoint**: `make test-unit` passes; every use case has at least one happy and one failure test.

---

## Phase 5: HTTP Routers (FastAPI, per user story)

**Purpose**: Thin adapter mapping requests → use cases → typed responses. Pydantic v2 only; ORM models MUST NOT leak into responses.

**Mandatory per route**:
1. Pydantic v2 request/response schemas in [apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py](apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py).
2. An integration test against a real Postgres in `apps/api/tests/integration/identity/`.
3. The OpenAPI snapshot at [specs/002-backend-auth-slice/contracts/openapi.json](specs/002-backend-auth-slice/contracts/openapi.json) is regenerated via `make openapi-snapshot` and committed.

### Cross-cutting plumbing for routers

- [X] T057 Pydantic v2 schemas at [apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py](apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py): `RegisterRequest`, `LoginRequest`, `TokenResponse` (`{accessToken, tokenType, expiresIn}`), `MeResponse` (`{displayName, email, firstLogin, preferences}`), `PreferencesPayload`, `GoogleStubRequest` (`{intent: "sign-up"|"sign-in"}`), `ErrorResponse`. ORM rows MUST NOT appear in responses.
- [X] T058 FastAPI dependencies at [apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py](apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py): `get_settings`, `get_db_session`, `get_current_user` (validates bearer token via `SessionRepository.get_by_access_fingerprint`, returns 401 for missing/invalid/revoked/expired).
- [X] T059 CSRF guard at [apps/api/src/campfire_api/contexts/identity/adapters/http/csrf.py](apps/api/src/campfire_api/contexts/identity/adapters/http/csrf.py) for `/auth/refresh` (FR-008a): require both the refresh cookie AND the current `Authorization: Bearer <access>` header (Authorization-pinning); 401 on either missing.
- [X] T060 Domain-error → HTTP-status mapping at [apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py](apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py): `InvalidCredentials`/`RefreshTokenInvalid`/`RefreshTokenReused`/`SessionRevokedError` → 401 generic; `EmailAlreadyRegistered` → 409; `UnknownCatalogId` → 422; `RateLimited` → 429 with `Retry-After`; `GoogleStubDisabled` → 503 generic. Logs MUST NOT include passwords, hashes, or token values (FR-027).
- [X] T060a Wire the `RateLimiter` into the auth router at [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py): add a FastAPI dependency that calls `RateLimiter.check(client_ip, target_email)` for `POST /auth/register` and `POST /auth/login` only. On `RateLimited`, return 429 with `Retry-After` (FR-011a). `/auth/refresh` and `/auth/google-stub` are exempt — do NOT apply the dependency to those routes.
- [X] T061 Integration-test scaffolding at [apps/api/tests/conftest.py](apps/api/tests/conftest.py): Testcontainers Postgres fixture (preferred) + `TEST_BACKEND=compose` fallback pointing at the existing Compose `campfire_test` DB; per-test truncate; `httpx.AsyncClient` against the real ASGI app.

### User Story 1 — Sign-in + /me (P1)

- [X] T062 [US1] `POST /auth/login` at [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py): 200 returns `TokenResponse`; sets refresh cookie (`HttpOnly; Secure in prod; SameSite=Lax`, scoped to `/auth/refresh`); 401 generic on bad credentials; 429 on rate-limit.
- [X] T063 [US1] `GET /me` at [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/me.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/me.py): 200 returns `MeResponse`; 401 without bearer or with invalid/revoked bearer.
- [X] T064 [US1] Integration tests at [apps/api/tests/integration/identity/test_login.py](apps/api/tests/integration/identity/test_login.py) covering 200 (seeded creds), 401 (bad password and unknown email — same error body), 422 (malformed payload), 429 (after 11 attempts in window).
- [X] T065 [US1] Integration tests at [apps/api/tests/integration/identity/test_me.py](apps/api/tests/integration/identity/test_me.py): 200 with seeded preferences, 401 without/with-malformed/with-expired/with-revoked bearer.

### User Story 2 — Sign-up + preferences + refresh-on-reload (P1)

- [X] T066 [US2] `POST /auth/register` at [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py): 201 returns the user (no tokens — user must call `/auth/login` next, mirrors frontend flow); 409 on duplicate email; 422 on validation; 429 on rate-limit.
- [X] T067 [US2] `POST /auth/refresh` at [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py): 200 returns rotated `TokenResponse` and rotated refresh cookie; 401 if cookie missing/invalid/revoked OR CSRF guard fails; family-revocation on reuse (FR-009).
- [X] T068 [US2] `PATCH /me/preferences` at [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/me.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/me.py): 200 returns updated `MeResponse` with `firstLogin=false`; 422 on unknown catalog id (no partial apply); 401 without bearer.
- [X] T069 [US2] Integration tests at [apps/api/tests/integration/identity/test_register.py](apps/api/tests/integration/identity/test_register.py): 201 happy path, 409 duplicate, 422 short password / malformed email, 429 over-limit.
- [X] T070 [US2] Integration tests at [apps/api/tests/integration/identity/test_refresh.py](apps/api/tests/integration/identity/test_refresh.py): 200 rotation, 401 missing cookie, 401 reused cookie revokes the entire family (subsequent `/me` and `/auth/refresh` both return 401).
- [X] T071 [US2] Integration tests at [apps/api/tests/integration/identity/test_preferences.py](apps/api/tests/integration/identity/test_preferences.py): 200 happy path, 422 unknown id (zero rows changed), nullable shapes accepted, full-replacement semantics.
- [X] T071a [US2] FR-026 authorization-scope test at [apps/api/tests/integration/identity/test_authorization_scope.py](apps/api/tests/integration/identity/test_authorization_scope.py): authenticate as user A, submit `PATCH /me/preferences` with an extra `userId` field referencing user B in the body. Assert (a) user A's preferences updated, (b) user B's preferences unchanged, (c) the response surface contains no reference to user B.

### User Story 3 — Google stub (P2)

- [X] T072 [US3] `POST /auth/google-stub` at [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_stub.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_stub.py): same response shape as `/auth/login`; honours `GOOGLE_STUB_ENABLED`; supports `intent: "sign-up"|"sign-in"`.
- [X] T073 [US3] Integration tests at [apps/api/tests/integration/identity/test_google_stub.py](apps/api/tests/integration/identity/test_google_stub.py): 200 sign-in intent returns seeded user; 200 sign-up intent creates the managed user once; 503 (or documented error) when disabled.

### User Story 4 — Sign-out (P2)

- [X] T074 [US4] `POST /auth/logout` at [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py): 204; revokes the session + refresh token; clears the refresh cookie (`Max-Age=0`); idempotent.
- [X] T075 [US4] Integration tests at [apps/api/tests/integration/identity/test_logout.py](apps/api/tests/integration/identity/test_logout.py): 204 happy path; subsequent `/me` returns 401; subsequent `/auth/refresh` returns 401; second logout is also 204 (idempotent).
- [X] T075a Secret-leakage test at [apps/api/tests/integration/identity/test_no_secret_leakage.py](apps/api/tests/integration/identity/test_no_secret_leakage.py): drives every documented endpoint (register, login, refresh, logout, google-stub, GET /me, PATCH /me/preferences, /healthz, /readyz) and asserts the captured response bodies AND captured log records contain none of: the seeded password `campfire123`, the substring `$argon2id$`, the issued access-token plaintext, the issued refresh-token plaintext (extracted from the `Set-Cookie` header). Implements SC-007 / FR-027.

### Snapshot

- [X] T076 Wire all routers into [apps/api/src/campfire_api/main.py](apps/api/src/campfire_api/main.py).
- [X] T077 Run `make openapi-snapshot` to regenerate [specs/002-backend-auth-slice/contracts/openapi.json](specs/002-backend-auth-slice/contracts/openapi.json) locally and confirm `pytest tests/contract/test_openapi_snapshot.py` passes against the live FastAPI schema. **Do not commit yet** — T087 in Phase 7 is the single committing task for the snapshot.
- [X] T078 [P] Contract test at [apps/api/tests/contract/test_openapi_snapshot.py](apps/api/tests/contract/test_openapi_snapshot.py): diffs the live FastAPI schema against the committed snapshot; fails CI on drift.

**Checkpoint**: Every endpoint listed in plan.md is reachable, returns the documented status codes, and has an integration test against a real Postgres covering 200/201/204 happy paths plus relevant 401/409/422/429 paths. The OpenAPI snapshot is committed.

---

## Phase 6: Frontend Wiring (`apps/web/`)

**Purpose**: Replace the in-memory mock surface with real fetch calls. Page and component code MUST NOT change — only the API/store boundary.

- [X] T079 Implement real fetch in [apps/web/src/api/client.ts](apps/web/src/api/client.ts): reads `import.meta.env.VITE_API_URL`; attaches the in-memory access token as `Authorization: Bearer …`; on 401 triggers a single `/auth/refresh` attempt and replays the original request; raises a typed `ApiError`. `credentials: "include"` for `/auth/refresh` and `/auth/logout` so the cookie flows.
- [X] T080 Replace mock impls in [apps/web/src/features/auth/api/auth.api.ts](apps/web/src/features/auth/api/auth.api.ts) with real `client.*` calls. Preserve every exported function signature so `SignInPage`, `SignUpPage`, `OnboardingPage`, `HomePage` remain untouched. Keep the `seededCredentials` export.
- [X] T081 Update [apps/web/src/features/auth/session.store.ts](apps/web/src/features/auth/session.store.ts): on app load call `POST /auth/refresh`; on success hydrate `currentUser` from `GET /me`; on 401 leave the user signed out. Document the new behaviour change vs the mock (refresh-after-reload now keeps the user signed in — SC-002) in the file header comment.
- [X] T082 Cookie / fallback handling in [apps/web/src/api/client.ts](apps/web/src/api/client.ts): default = in-memory access token + httpOnly refresh cookie. Fallback = `sessionStorage` refresh token, gated by `import.meta.env.VITE_AUTH_FALLBACK === "session-storage"`, with an explicit comment about the XSS trade-off.
- [X] T083 [P] Add [apps/web/.env.local.example](apps/web/.env.local.example) with `VITE_API_URL=http://localhost:8000` and a commented-out `VITE_AUTH_FALLBACK=session-storage`.
- [ ] T084 Manual smoke test of the four frontend journeys (sign-up → onboarding → home; sign-in → home; google → home; update preferences) against the running backend. Record outcome (pass/fail per journey) in the PR description.

**Checkpoint**: All four journeys succeed against the real backend with no changes to page or component files.

---

## Phase 7: Documentation

- [X] T085 [P] Author the four backend doc pages per plan.md §Docs-as-code: [docs/backend/overview.mdx](docs/backend/overview.mdx) (slice scope + what's deferred + Aurora-readiness checklist), [docs/backend/auth-flow.mdx](docs/backend/auth-flow.mdx) (Mermaid sequence diagrams for register / login / refresh / logout), [docs/backend/contracts.mdx](docs/backend/contracts.mdx) (link to the committed OpenAPI snapshot + error-shape summary + env var reference), [docs/backend/local-dev.mdx](docs/backend/local-dev.mdx) (reader-friendly mirror of quickstart.md).
- [X] T086 Update [docs/docs.json](docs/docs.json) navigation: add a `BACKEND` group under the existing Docs tab pointing at the four pages above.
- [X] T087 [P] Commit the final OpenAPI snapshot to [specs/002-backend-auth-slice/contracts/openapi.json](specs/002-backend-auth-slice/contracts/openapi.json) (re-run `make openapi-snapshot` once if any router changed since T077).
- [X] T088 [P] Commit ADRs 0001–0005 under [specs/002-backend-auth-slice/adr/](specs/002-backend-auth-slice/adr/): `0001-postgresql-as-engine.md`, `0002-sqlalchemy-async-asyncpg.md`, `0003-aws-target-service-deferred.md`, `0004-uuid-v7-timestamptz-no-pg-extensions.md`, `0005-localstack-deferred.md`.

**Checkpoint**: Mintlify renders the new pages locally; `docs/docs.json` validates; ADRs are committed; OpenAPI snapshot reflects the running app.

---

## Phase 8: Acceptance

**Purpose**: Prove every contract claim with the existing manual acceptance script and the full automated suite.

- [ ] T089 Re-run every manual journey from [specs/001-frontend-mvp-prototype/quickstart.md](specs/001-frontend-mvp-prototype/quickstart.md) end-to-end against the real backend (mocks removed). Verify each acceptance criterion below and record outcomes in the PR:
    - sign-up routes from `/signup` → onboarding → home;
    - seeded sign-in (`ada@campfire.test` / `campfire123`) routes straight to home with seeded preferences hydrated;
    - Google stub from sign-in routes to home as the seeded user; from sign-up routes to home as `google.member@campfire.test` with `firstLogin=true`;
    - update-preferences round-trips to the backend and re-renders the home panel;
    - browser refresh after sign-in keeps the user signed in (NEW behaviour — log it in the spec change log per SC-002);
    - sign-out invalidates the refresh token; subsequent `/me` returns 401 (SC-003).
- [ ] T090 Run `make test-integration` against a fresh Testcontainers Postgres AND with `TEST_BACKEND=compose make test-integration` against the Compose fallback. Both runs must pass with zero failures.
- [X] T091 Verify `make check-aurora-extensions` passes against the final migration set (`0001_identity_initial.py`, `0002_seed_ada.py`).
- [X] T092 Document the spec change log entry for SC-002 (refresh survives reload) in [specs/002-backend-auth-slice/spec.md](specs/002-backend-auth-slice/spec.md) under a new `## Change Log` section, dated 2026-04-26.

**Checkpoint**: Slice ships. SC-001 through SC-008 demonstrably hold.

---

## Dependencies & Execution Order

### Phase Dependencies (linear, per the user-mandated order)

1. Bootstrap (Phase 1) — no dependencies.
2. Identity Domain (Phase 2) — depends on T001 (project skeleton) only.
3. Identity Adapters (Phase 3) — depends on Phase 2 (ports) and Phase 1 (engine + Alembic).
4. Use Cases (Phase 4) — depends on Phase 2 (ports + entities + errors) and Phase 3 (adapters injectable).
5. Routers (Phase 5) — depends on Phase 4 (use cases) + Phase 3 (deps).
6. Frontend Wiring (Phase 6) — depends on Phase 5 (real endpoints exist).
7. Docs (Phase 7) — depends on Phase 5 (final OpenAPI shape) and Phase 6 (env vars finalised).
8. Acceptance (Phase 8) — depends on every prior phase.

### Within each phase

- Tests for the use case / route MUST be written and asserted against the implementation in the same phase (no story is "done" without its tests passing).
- Models before repositories before use cases before routers before frontend wiring before docs.

### Parallel opportunities

- All `[P]`-marked tasks within a phase can run in parallel (different files, no incomplete dependencies).
- Across phases, parallelism is constrained by the linear ordering above — domain work (Phase 2) and adapter scaffolding (Phase 3) can technically begin in parallel for `[P]` tasks once T001 (skeleton) lands, but routers (Phase 5) cannot start before Phase 4 use cases exist.

### User-story parallelism within Phase 4 + Phase 5

- Once foundational adapters exist, US1, US2, US3, US4 work can be split across developers:
    - Developer A → US1 tasks (T045, T046, T052, T053, T062, T063, T064, T065).
    - Developer B → US2 tasks (T043, T044, T047, T050, T051, T054, T066, T067, T068, T069, T070, T071).
    - Developer C → US3 tasks (T049, T056, T072, T073).
    - Developer D → US4 tasks (T048, T055, T074, T075).
- T076 (router wiring) and T077 (snapshot) MUST run after all router tasks merge.

---

## Parallel Example: Phase 2 (Identity Domain)

```bash
# All independent files — launch in parallel:
Task: "Create value objects in apps/api/src/campfire_api/contexts/identity/domain/value_objects.py"
Task: "Create catalogs module in apps/api/src/campfire_api/contexts/identity/domain/catalogs.py"
Task: "Create entities in apps/api/src/campfire_api/contexts/identity/domain/entities.py"
Task: "Create domain events in apps/api/src/campfire_api/contexts/identity/domain/events.py"
Task: "Create application errors in apps/api/src/campfire_api/contexts/identity/application/errors.py"
```

## Parallel Example: Phase 3 (Adapters, after T028 + T029 land)

```bash
Task: "User repository impl"
Task: "Credentials repository impl"
Task: "Preferences repository impl"
Task: "Session repository impl"
Task: "Refresh-token repository impl"
Task: "Argon2 password hasher adapter"
Task: "Opaque token issuer adapter"
Task: "System clock adapter"
Task: "In-memory rate limiter adapter"
```

---

## Implementation Strategy

### MVP slice (US1 + US2 demo path)

1. Phases 1 → 2 → 3 → 4 (US1 + US2 use cases) → 5 (US1 + US2 routers).
2. Wire `apps/web/` (Phase 6) for sign-in / sign-up / preferences / refresh-on-reload.
3. Smoke-test the seeded-sign-in journey + sign-up-to-home journey.
4. **Stop and validate** before US3 / US4.

### Incremental delivery

1. MVP (US1 + US2) → demo.
2. Add US4 (sign-out) — small surface, immediate value.
3. Add US3 (Google stub) — completes the four buttons.
4. Phase 7 (docs) → Phase 8 (acceptance).

### Constraints recap (do **not** violate)

- No LocalStack, S3, SQS, Cognito, Secrets Manager, Lambda, Terraform, or container images for the API in this slice.
- No domain models for Song, Capability, Group, JamSession.
- Every route adds an integration test against a real Postgres AND triggers an OpenAPI snapshot regen.
- Final task is the manual acceptance pass (T089) re-running the existing `apps/web/` script with mocks removed.

---

## Notes

- `[P]` tasks touch different files and have no incomplete dependencies.
- `[US?]` labels trace tasks to the spec's user stories — useful when splitting across developers.
- Commit per task (or per logical group of `[P]` tasks).
- The integration suite is the source of truth for SC-001 / SC-002 / SC-003. The OpenAPI snapshot is the source of truth for SC-008.
- Token plaintext is never persisted; only SHA-256 fingerprints sit in `sessions.access_token_fingerprint` and `refresh_tokens.token_fingerprint`. Logs and error responses MUST NOT include any token value (FR-027 / SC-007).
