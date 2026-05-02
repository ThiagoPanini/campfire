# Implementation Plan: Auth Hardening Wave 1

**Branch**: `007-auth-hardening-wave1` | **Date**: 2026-05-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-auth-hardening-wave1/spec.md`; audit evidence from `/AUDIT.md`

## Summary

Close the Wave-1 auth audit findings S-1, S-2, S-3, S-4, S-6, S-7, C-1, and Q-1 without adding new product surface. The implementation stays inside the existing `identity` bounded context and the existing auth frontend API type layer: delete stale password credentials when Google promotes an unconfirmed account, resolve auth rate-limit keys through trusted proxies, normalize registration password-rule failures, protect refresh/logout with an Origin allow-list dependency, rate-limit Google OAuth start, fail closed on missing production HMAC keys, align `/auth/config` with its documented nested shape, and restore email-confirmation repository writes to the request-level unit of work.

## Technical Context

**Language/Version**: Backend Python 3.12 managed by `uv`; frontend TypeScript 5.x with React 19 and Vite 8.
**Primary Dependencies**: Existing FastAPI 0.136, SQLAlchemy 2.x async, asyncpg, pydantic 2.9, pydantic-settings, argon2-cffi, google-auth, httpx, React 19. No new dependency is planned; S-2 uses stdlib `ipaddress`.
**Storage**: PostgreSQL 16 via existing SQLAlchemy models. No migration; all changes are runtime behavior or schema serialization changes.
**Testing**: Existing pytest unit/integration/contract suite plus OpenAPI snapshot regeneration; frontend `npm run typecheck` and build as already wired.
**Target Platform**: Render-hosted FastAPI service and static Vite SPA, with local Docker PostgreSQL.
**Project Type**: Web application monorepo (`apps/api` + `apps/web`).
**Performance Goals**: Preserve existing auth endpoint budgets. Trusted-proxy parsing is per-request and bounded by a short comma-separated CIDR/header list; no database changes are added to hot paths except the targeted credential delete during Google promotion.
**Constraints**: No new framework, language, hosting platform, queue, cache, or external service. Preserve refresh cookie attributes, existing refresh rotation semantics, existing no-enumeration guarantees, and deployment compatibility for active sessions. Domain/application layers remain free of FastAPI, SQLAlchemy, cloud SDKs, hashing libraries, and platform-specific config access.
**Scale/Scope**: Eight focused hardening fixes in one slice. No new pages, no new auth provider, no MFA/password reset, no Wave-2 audit items.

## Constitution Check

*GATE: PASS before Phase 0; re-evaluated after Phase 1 design with no new violations.*

| Principle / Invariant | Check | Notes |
|---|---|---|
| I. Narrow MVP Scope | PASS | Closes audit findings on existing auth user jobs; no new product surface. |
| II. Incremental Delivery | PASS | Eight focused commits inside one slice. Each finding is independently testable and revertable. |
| III. Boring, Proven Stack | PASS | No new dependencies. `ipaddress` is stdlib; no new framework, library, language, hosting platform, queue, or cache. |
| IV. Proportional Rigor | PASS | Every added test maps to a named audit finding; no speculative coverage. |
| V. Docs-as-Code | PASS | Contract docs, OpenAPI snapshot, and Mintlify pages (`identity/runbook-disable-google.mdx`, `identity/env-vars.mdx`, `operations/render-secrets.mdx`, plus auth Google/config notes) update with the code. |
| Backend invariant 1 — bounded context slicing | PASS | All backend changes remain in `contexts/identity` and shared app wiring; no new bounded context. |
| Backend invariant 2 — layer purity | PASS | New helper/dependency code lives in HTTP/settings adapters. Domain/application ports and errors stay framework-free and remain covered by `test_architecture.py`. |
| Backend invariant 3 — cross-context references | PASS | Identity-only work; no cross-context entities or repositories are introduced. |
| Backend invariant 4 — HTTP mapping at adapter boundary | PASS | S-3 introduces or reuses a domain `IdentityError`; FastAPI mapping remains in `error_mapping.py`. Use cases do not raise `HTTPException`. |
| Backend invariant 5 — explicit transaction boundary | PASS | S-2 keeps `client_ip` resolution in the HTTP adapter; S-7 lifespan validation is adapter-level app startup; Q-1 removes repository-level commits so `get_db_session` / `session_scope` owns the unit of work again. |
| Backend invariant 6 — validation at the protected layer | PASS | Pydantic keeps transport validation; `Password()` remains the domain password-rule authority and is invoked before registration branch decisions. |
| Backend invariant 7 — settings and time as ports | PASS | New settings (`TRUSTED_PROXIES`) are exposed through `SettingsProvider`; production validation reads settings through the provider in lifespan. No direct env reads in application/domain code. |

## Project Structure

### Documentation (this feature)

```text
specs/007-auth-hardening-wave1/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── auth-config.md
│   ├── auth-google.md
│   └── auth-changed.md
└── tasks.md             # Phase 2 output from /speckit.tasks, not created here
```

### Source Code (repository root)

```text
apps/api/src/campfire_api/
├── main.py                                             # S-7 prod fail-closed validation
├── settings.py                                         # S-2 TRUSTED_PROXIES, S-7 provider methods, C-1 config source
└── contexts/identity/
    ├── domain/
    │   └── ports.py                                    # S-1 CredentialsRepository.delete_for_user
    ├── application/
    │   ├── errors.py                                   # S-3 InvalidRegistration (or generic existing equivalent)
    │   └── use_cases/
    │       ├── complete_google_sign_in.py              # S-1 credential delete + notice
    │       └── register_user.py                        # S-3 early Password() validation
    └── adapters/
        ├── http/
        │   ├── deps.py                                 # S-2 trusted-proxy helper, S-4 Origin dependency, S-6 limiter reuse
        │   ├── error_mapping.py                        # S-3 HTTP 400 generic mapping
        │   ├── schemas.py                              # C-1 nested AuthConfigResponse
        │   └── routers/
        │       ├── auth.py                             # S-4 Depends reused for refresh/logout
        │       ├── config.py                           # C-1 response construction
        │       └── google_oauth.py                     # S-6 rate-limit check
        └── persistence/
            ├── credentials_repository.py               # S-1 delete_for_user implementation
            └── email_confirmation_repository.py        # Q-1 remove inline commits

apps/api/tests/
├── integration/identity/
│   ├── test_account_takeover_after_google_promotion.py # S-1
│   ├── test_rate_limit_xff.py                          # S-2
│   ├── test_register_enumeration_matrix.py             # S-3
│   ├── test_refresh_csrf.py                            # S-4
│   ├── test_google_start_rate_limit.py                 # S-6
│   ├── test_lifespan_fail_closed.py                    # S-7
│   └── test_auth_config_shape.py                       # C-1
├── unit/identity/
│   └── test_email_confirmation_repository_no_inline_commit.py # Q-1
└── contract/
    └── test_openapi_snapshot.py                        # regenerated; still writes specs/002... in Wave 1

apps/web/src/features/auth/api/
└── auth.api.ts                                         # C-1 nested AuthConfig type

docs/
├── identity/
│   ├── google-oauth.mdx                                # S-1/S-6/S-7 note updates
│   ├── env-vars.mdx                                    # S-2/S-7/C-1 updates
│   └── runbook-disable-google.mdx                      # verify existing; update if present, create only if missing
└── operations/
    └── render-secrets.mdx                              # S-2/S-7 Render secret checklist

render.yaml                                             # S-2/S-7/C-1 env var declarations as needed
```

**Structure Decision**: Extend the existing web app and `identity` bounded context. No new domain files are expected; the only domain-level change is a port method on `CredentialsRepository`. Add small adapter helpers for trusted proxy IP resolution and Origin checking.

## Complexity Tracking

No deviations.

## Phase 0 — Research

See [research.md](./research.md). Research resolves all eight findings:

- S-1 deletes stale password credentials through `CredentialsRepository.delete_for_user(...)` during `CompleteGoogleSignIn`.
- S-2 resolves `client_ip` from `X-Forwarded-For` only through `TRUSTED_PROXIES`, using stdlib `ipaddress` and the rightmost-untrusted-hop rule.
- S-3 moves `Password()` validation to the top of `RegisterUser` and translates `ValueError` to an enumeration-safe domain error.
- S-4 uses a reusable FastAPI dependency for Origin checks on refresh/logout.
- S-6 reuses the existing in-memory limiter and global rate-limit settings with target `"google_start"`.
- S-7 validates production HMAC secrets in lifespan.
- C-1 ships the documented nested `AuthConfigResponse`.
- Q-1 removes repository commits instead of restructuring use cases.

## Phase 1 — Design & Contracts

### Data Model

See [data-model.md](./data-model.md). No database schema changes or migrations are planned. Existing entities are updated only in behavior and public serialization.

### Contracts

See [contracts/](./contracts/):

- [auth-config.md](./contracts/auth-config.md) documents the nested `/auth/config` response and frontend consumer update.
- [auth-google.md](./contracts/auth-google.md) documents stale credential deletion, promotion notice, and Google-start rate limit.
- [auth-changed.md](./contracts/auth-changed.md) documents register validation parity, refresh/logout Origin rejection, and rate-limit IP resolution.

`auth-confirm.md` from slice 006 is unchanged. The OpenAPI snapshot regeneration remains at `specs/002-backend-auth-slice/contracts/openapi.json`; Q-2 relocation is Wave 2 and out of scope.

### Quickstart

See [quickstart.md](./quickstart.md). It provides a manual verification path for each finding after implementation ships.

### Agent Context Update

`AGENTS.md` is updated between the Spec Kit markers to point to this plan.

## Phase 2 — Task Generation

Out of scope for `/speckit.plan`. Use `/speckit.tasks` after reviewing this plan, research, data model, contracts, and quickstart.
