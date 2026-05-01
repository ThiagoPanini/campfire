# Implementation Plan: Google Authentication and Login Experience Improvements

**Branch**: `006-google-auth-login-ux` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-google-auth-login-ux/spec.md`

## Summary

Replace the deterministic `/auth/google-stub` endpoint with a real Google identity integration using a backend-owned OAuth 2.0 Authorization Code + PKCE redirect/callback flow, add server-issued email confirmation for traditional sign-up, and harden the email/password forms. The work extends the existing `identity` bounded context (Argon2 hashing, opaque access tokens, httpOnly refresh cookie scoped to `/auth/refresh`, in-memory rate limiter, SqlAlchemy adapters) by introducing two domain concepts (`ProviderLink`, `EmailConfirmation`) and one transient persistence concept (`OAuthFlowState`), plus a provider-agnostic `EmailSender` port. The backend verifies Google ID tokens server-side using `google-auth` (audience, issuer, signature, `email_verified`, freshness, nonce); CSRF/replay protection uses a per-attempt anti-forgery state plus PKCE verifier, both bound to the originating browser by an httpOnly `Path=/auth/google` cookie and stored server-side as hashes/HMAC. Sessions for confirmed password users and Google-authenticated users are issued through the same `IssueSession` service (extracted from `AuthenticateUser`) so cookie attributes, fingerprint storage, and revocation semantics are identical to today's login. The web client (Vite + React 19, custom router) gains a confirm-email page, a password-visibility toggle, stricter live validation, a same-origin `next=` redirect contract, and a runtime `/auth/config` probe that hides the Google button when credentials are unset.

## Technical Context

**Language/Version**: Backend Python 3.12 (managed by `uv`); Frontend TypeScript 5.x with React 19, Vite 8.
**Primary Dependencies**: FastAPI 0.136, SQLAlchemy 2.0 + Alembic, asyncpg, argon2-cffi, pydantic 2.9, pydantic-settings, httpx (already a dep, currently restricted), `google-auth` (NEW — minimal dep for OIDC ID-token verification with cached JWKS). Frontend: React 19, lucide-react, custom router (no React Router).
**Storage**: PostgreSQL 16 (Render managed in dev/prod, Docker locally). New tables: `provider_links`, `email_confirmations`, `oauth_flow_states`. New column on `users`: `email_confirmed_at TIMESTAMPTZ NULL`.
**Testing**: pytest with markers `unit | integration | contract` (existing). Integration uses testcontainers Postgres or `TEST_BACKEND=compose`. Frontend: `npm run typecheck` + `npm run build` (Vite); no test runner present today — none added by this feature (Constitution IV: proportional rigor). Backend purity guard at `apps/api/tests/unit/test_architecture.py`.
**Target Platform**: Render-hosted FastAPI service + static Vite SPA, Postgres 16; local Docker for the database. Browsers: evergreen + iOS/Android Safari.
**Project Type**: Web application (existing monorepo `apps/api` + `apps/web`).
**Performance Goals**: No new performance budget. Google ID-token verification reuses Google's JWKS cache (`google-auth` handles this); confirmation-code verification is a single indexed `SELECT` + HMAC compare (negligible). Auth endpoints stay under existing p95 envelope.
**Constraints**: No domain or application code may import `httpx`, `google-auth`, `sqlalchemy`, `fastapi`, `argon2`, or `jose` (enforced by `test_architecture.py` and `ruff TID251`). Refresh cookie scoping (`Path=/auth/refresh`, `HttpOnly`, `Secure`, `SameSite=none` in prod, cross-origin against the static web app) MUST remain at least as strict. Single-process in-memory rate limiter is the only abuse-prevention surface (no Redis); per-code/per-resend caps must therefore live in Postgres so they survive process restarts. No tokens, codes, passwords, or raw provider payloads in logs or responses.
**Scale/Scope**: Solo-built MVP. Render single instance per env. New surface: 4 new HTTP routes (`POST /auth/google/start`, `GET /auth/google/callback`, `POST /auth/confirm`, `POST /auth/confirm/resend`, `GET /auth/config`); 3 new tables; 1 column added to `users`. Frontend: 1 new page (`ConfirmEmailPage`), shared `PasswordField` with toggle, validation hardening, runtime config probe.

## Constitution Check

*Re-evaluated post-Phase 1 design — no new violations introduced. See Complexity Tracking for one tracked deviation (httpx use inside the identity context).*

| Principle / Invariant | Check | Notes |
|---|---|---|
| I. Narrow MVP Scope | PASS | Auth is foundational to all three core jobs; spec is bounded (Google only, no MFA, no password reset). |
| II. Incremental Delivery | PASS | Slices align with spec priorities P1 (Google), P1 (confirmation), P2 (UX), P2 (redirects). Each is independently shippable behind `GOOGLE_AUTH_ENABLED` / `EMAIL_CONFIRMATION_REQUIRED` flags. |
| III. Boring, Proven Stack | PASS w/ tracked deviation | Adds **one** library (`google-auth`) — official Google-maintained, narrow surface (ID-token verify with cached JWKS). httpx (already a dep) is reused for the token-exchange POST under a new per-file ruff exemption. No new framework, language, or hosting platform. |
| IV. Proportional Rigor | PASS | FR-035 enumerates the test matrix; we adopt it verbatim. No speculative tests. |
| V. Docs-as-Code | PASS | `docs/` updates ship in the same change set: setup guide, env reference, troubleshooting, runbook for disabling Google. |
| Backend invariant 1 — Bounded context slicing | PASS | All work extends `contexts/identity`; no new context. |
| Backend invariant 2 — Layer purity (test-enforced) | PASS | New ports (`GoogleIdentityProvider`, `EmailSender`, `EmailConfirmationRepository`, `ProviderLinkRepository`, `OAuthFlowStateRepository`, `ConfirmationCodeHasher`) live in `domain/ports.py`. `google-auth`/`httpx` are confined to new files under `adapters/oauth/` and `adapters/messaging/`, listed in `ruff per-file-ignores`. `test_architecture.py` extended to cover new adapter paths. |
| Backend invariant 3 — Cross-context refs | PASS | Identity context only. |
| Backend invariant 4 — Errors at adapter boundary | PASS | Extend `IdentityError` hierarchy with `GoogleSignInFailed`, `GoogleSignInUnavailable`, `EmailNotConfirmed`, `ConfirmationCodeInvalid`, `ConfirmationCodeExpired`, `ConfirmationResendCooldown`, `ConfirmationAttemptsExceeded`. All map to generic 4xx in the existing handler — no enumeration leakage. Use cases never raise `HTTPException`. |
| Backend invariant 5 — Persistence boundary | PASS | New repositories follow the existing `SqlAlchemy*Repository` pattern; transactions opened/closed by the FastAPI route adapter via the existing UoW. |
| Backend invariant 6 — Validation at the right layer | PASS | Pydantic schemas validate transport (`code: constr(pattern=r'^\d{6}$')`); domain VOs (`ConfirmationCode`, `Email`, `Password`) hold invariants. Password rules live in a single domain function reused by client validators via a small JSON schema export. |
| Backend invariant 7 — Settings & time as ports | PASS | All new env vars added to `EnvSettings`; new TTLs/limits exposed through `SettingsProvider` async methods. `Clock` used for all expiries. |

### Complexity Tracking

| Deviation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| `httpx` used inside `contexts/identity/adapters/oauth/` (currently restricted to the Deezer adapter via ruff TID251) | Google's token endpoint requires an HTTP POST to `https://oauth2.googleapis.com/token` with the authorization code and PKCE verifier; this is the one outbound call the OIDC flow needs. | Adding a separate HTTP client (e.g., `aiohttp`) duplicates a dependency we already have; using a higher-level OAuth library (`authlib`) pulls in a much wider surface area and an extra abstraction layer for a single endpoint. Granting a scoped per-file ruff exemption is the smaller diff. |
| One new dependency: `google-auth` | ID-token verification needs Google's JWKS, key rotation, audience/issuer/clock-skew checks. Hand-rolling on `python-jose` is error-prone (signature algorithm selection, JWKS caching, leeway) and a known footgun for OIDC. | `python-jose` alone leaves us responsible for JWKS fetching/caching/rotation; `authlib` is heavier and overlaps with our hand-built flow control. `google-auth` is the official Google-maintained, narrow-surface choice. |

## Project Structure

### Documentation (this feature)

```text
specs/006-google-auth-login-ux/
├── spec.md              # Feature specification (already exists)
├── plan.md              # This file
├── research.md          # Phase 0 — decisions + rationale
├── data-model.md        # Phase 1 — entities, schema deltas, state machines
├── quickstart.md        # Phase 1 — local-dev setup against a sandbox Google project
├── contracts/           # Phase 1 — HTTP contracts for new + changed endpoints
│   ├── auth-google.md
│   ├── auth-confirm.md
│   ├── auth-config.md
│   └── auth-changed.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
apps/api/
├── alembic/versions/
│   └── 0002_identity_oauth_and_confirmation.py        # NEW migration
├── src/campfire_api/
│   ├── settings.py                                     # extended: Google + mail + cookie settings
│   └── contexts/identity/
│       ├── domain/
│       │   ├── entities.py                             # add ProviderLink, EmailConfirmation
│       │   ├── value_objects.py                        # add ConfirmationCode, ProviderSubject, OAuthState
│       │   └── ports.py                                # add 6 new ports (see below)
│       ├── application/
│       │   ├── use_cases/
│       │   │   ├── issue_session.py                    # NEW — extracted from authenticate_user
│       │   │   ├── start_google_sign_in.py             # NEW
│       │   │   ├── complete_google_sign_in.py          # NEW
│       │   │   ├── register_user.py                    # CHANGED — issue confirmation, no session
│       │   │   ├── confirm_email.py                    # NEW
│       │   │   ├── resend_confirmation.py              # NEW
│       │   │   ├── authenticate_user.py                # CHANGED — block unconfirmed
│       │   │   └── google_stub_sign_in.py              # KEPT for tests, gated by GOOGLE_STUB_ENABLED
│       │   └── errors.py                               # extended hierarchy
│       └── adapters/
│           ├── http/
│           │   ├── routers/
│           │   │   ├── auth.py                         # CHANGED — register issues no session
│           │   │   ├── google_oauth.py                 # NEW (replaces stub at the surface)
│           │   │   ├── confirm.py                      # NEW
│           │   │   └── config.py                       # NEW — GET /auth/config
│           │   ├── schemas.py                          # extended
│           │   └── error_mapping.py                    # extended
│           ├── persistence/
│           │   ├── models.py                           # 3 new ORM models, 1 column
│           │   ├── provider_link_repository.py         # NEW
│           │   ├── email_confirmation_repository.py    # NEW
│           │   └── oauth_flow_state_repository.py      # NEW
│           ├── oauth/
│           │   └── google_identity_provider.py         # NEW (httpx + google-auth)
│           ├── messaging/
│           │   ├── console_email_sender.py             # NEW (dev/local)
│           │   └── http_email_sender.py                # NEW (prod, vendor-agnostic)
│           └── security/
│               └── hmac_code_hasher.py                 # NEW — HMAC-SHA256 over the code with server pepper
└── tests/
    ├── unit/identity/
    │   ├── test_start_google_sign_in.py
    │   ├── test_complete_google_sign_in.py
    │   ├── test_register_user.py                       # updated
    │   ├── test_confirm_email.py
    │   ├── test_resend_confirmation.py
    │   ├── test_authenticate_user.py                   # updated
    │   ├── test_account_linking.py
    │   ├── test_no_enumeration.py
    │   └── fakes.py                                    # add fake Google provider, fake mailer, fake clock-aware confirmation repo
    ├── integration/identity/
    │   ├── test_google_oauth.py
    │   ├── test_confirm_email.py
    │   ├── test_register_unconfirmed.py
    │   ├── test_login_blocks_unconfirmed.py
    │   ├── test_no_secret_leakage.py                   # updated
    │   └── test_google_disabled_falls_back.py
    ├── contract/
    │   └── test_openapi_snapshot.py                    # snapshot updated
    └── unit/test_architecture.py                       # extended to cover new adapter paths

apps/web/
└── src/
    ├── app/
    │   ├── App.tsx                                     # routing + redirect-after-auth + next= capture
    │   └── router/
    │       ├── routes.ts                               # add 'confirm', 'google-return'
    │       └── guards.tsx                              # support 'unconfirmed' state route
    ├── features/auth/
    │   ├── api/auth.api.ts                             # add startGoogle, completeConfirm, resend, getConfig
    │   ├── components/
    │   │   ├── PasswordField.tsx                       # NEW — visibility toggle, ARIA
    │   │   ├── PasswordStrengthHint.tsx                # NEW
    │   │   ├── SignInForm.tsx                          # CHANGED — uses PasswordField, generic errors, hide-google-when-disabled
    │   │   ├── SignUpForm.tsx                          # CHANGED — strict validation, advances to confirm step on success
    │   │   └── ConfirmEmailForm.tsx                    # NEW
    │   ├── session.store.ts                            # add 'unconfirmed' branch + confirm/resend actions
    │   ├── validation.ts                               # extend rules (length≥10, char-classes, common-pw blocklist)
    │   └── redirect.ts                                 # NEW — same-origin next= sanitizer
    ├── pages/
    │   └── ConfirmEmailPage.tsx                        # NEW
    └── i18n/locales/
        ├── en.ts                                       # add new keys
        └── pt.ts                                       # add new keys

docs/                                                   # Mintlify, updated alongside code
├── identity/
│   ├── overview.mdx                                    # CHANGED
│   ├── google-oauth.mdx                                # NEW
│   ├── email-confirmation.mdx                          # NEW
│   ├── runbook-disable-google.mdx                      # NEW
│   └── env-vars.mdx                                    # CHANGED
└── operations/
    └── render-secrets.mdx                              # CHANGED

render.yaml                                             # add new env vars (no values), per-environment GOOGLE_AUTH_ENABLED
```

**Structure Decision**: Web application monorepo, extending the existing `identity` bounded context inside `apps/api` and the existing `features/auth` slice inside `apps/web`. No new context, no new app, no new top-level directory — every new file slots into the established Clean / Hex / DDD layout.

## Phase 0 — Research

See [research.md](./research.md). All `NEEDS CLARIFICATION` items raised during planning are resolved there. Highlights:

- **OAuth flow shape**: backend-owned authorization code + PKCE; callback hits the API at `${API_BASE_URL}/auth/google/callback`, sets the existing refresh cookie, then 302s to `${WEB_BASE_URL}${next or /home}` where the SPA mounts `useSessionStore`, calls `POST /auth/refresh`, and gets its access token. No tokens or codes ever appear in URLs.
- **State/nonce/PKCE**: server-side `oauth_flow_states` row keyed by a random `state_id`; the row holds the HMAC of the state token, the PKCE verifier, the OIDC nonce, the captured `next` path, the intent (`sign-in | sign-up`), and `expires_at`. The state token itself rides in an httpOnly cookie scoped to `Path=/auth/google`. Mismatch → generic Google failure.
- **Account linking**: link by Google subject; if subject is unknown, link by verified email to the existing user (confirmed or unconfirmed); never request the existing password inside the Google flow. Pending email confirmations are invalidated when an unconfirmed account is upgraded by Google sign-in.
- **Confirmation codes**: 6-digit numeric, HMAC-SHA256 stored (key = `EMAIL_CONFIRMATION_HMAC_KEY` from settings), 15-minute expiry, ≤5 attempts/code, ≤3 resends/hour, 60 s minimum between resends — all caps live in Postgres so they survive process restarts.
- **Mailer**: provider-agnostic `EmailSender` port; `ConsoleEmailSender` for local dev (writes a redacted line — never the code itself — to logs and the actual code to a `tmp/mail/` outbox readable by developers); `HttpEmailSender` for prod, configured via `MAIL_API_URL` / `MAIL_API_KEY` / `MAIL_FROM` and a JSON envelope shape compatible with Resend / Postmark / Mailgun (vendor selected by ADR; the port is what matters).
- **Frontend redirect capture**: same-origin sanitizer rejects absolute URLs, protocol-relative (`//`), and any path containing `://`. `next` flows through the OAuth state row (server-validated again on callback) and through `localStorage` for the password path.
- **Disabled-feature fallback**: `GET /auth/config` returns `{ google: { enabled: bool } }`. Web hides the Google button when `enabled=false`. Calls to `POST /auth/google/start` with the flag off return `503 google sign-in unavailable` with the existing generic body.
- **Existing-session compatibility**: feature does NOT invalidate active access tokens or refresh-token families on deploy. The `0002` migration backfills `users.email_confirmed_at = users.created_at` so every pre-existing user is treated as confirmed.

**Output**: research.md with all decisions + rationale + alternatives considered.

## Phase 1 — Design & Contracts

### Data model

See [data-model.md](./data-model.md). Adds `ProviderLink`, `EmailConfirmation`, `OAuthFlowState` entities plus `email_confirmed_at` on `User`. State machines for `EmailConfirmation` (`pending → verified | expired | invalidated`) and `OAuthFlowState` (`issued → consumed | expired`) are documented there.

### Contracts

See [contracts/](./contracts/). One file per surface:

- `auth-google.md` — `POST /auth/google/start`, `GET /auth/google/callback`, error redirects.
- `auth-confirm.md` — `POST /auth/confirm`, `POST /auth/confirm/resend`.
- `auth-config.md` — `GET /auth/config`.
- `auth-changed.md` — diff against `POST /auth/register`, `POST /auth/login` (now blocks unconfirmed with the same generic credential error).

The OpenAPI snapshot test (`tests/contract/test_openapi_snapshot.py`) is updated to reflect these contracts; no other contract changes.

### Quickstart

See [quickstart.md](./quickstart.md). Covers: creating a sandbox Google Cloud project, configuring authorized redirect URIs (`http://localhost:8000/auth/google/callback` + Render dev/prod), generating an `EMAIL_CONFIRMATION_HMAC_KEY`, running with `MAIL_BACKEND=console`, smoke-testing the flow end to end, and the rollback path (clear `GOOGLE_CLIENT_ID` → button disappears, password auth keeps working).

### Agent context update

`AGENTS.md` (which `CLAUDE.md` symlinks to) is updated to point at this plan inside the `<!-- SPECKIT -->` markers.

## Phase 2 — Task generation

Out of scope for `/speckit.plan`. Tasks will be generated by `/speckit.tasks` from this plan's research.md, data-model.md, and contracts/.
