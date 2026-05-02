# Technical Audit Report — Campfire

## 1. Executive summary

**Overall state.** Campfire is in noticeably stronger shape than the average MVP at this stage. The hexagonal/DDD layout is real and enforced (architecture test, ruff banned-imports). Auth is opaque-token + rotated refresh + family-revocation + Argon2 + HMAC'd confirmation codes; OAuth uses PKCE + nonce + server-side state via `oauth_flow_states`. A complete CI/CD pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) is wired to Render, including health probes, branch policy, secrets scanning, and a promotion-PR flow. Specs/plans/contracts/quickstarts exist for the in-flight slice and are largely accurate.

**Main risks (most consequential first).**
1. **Account takeover via stale credentials**: a Google sign-in that promotes an unconfirmed password account to confirmed leaves the original `Credentials` row intact, so whoever knew the original (possibly attacker-set) password can later log in as the legitimate Google user. Matches the contract — but the contract is the bug.
2. **Reverse-proxy IP problem**: the rate limiter keys on `request.client.host`, which on Render is the proxy. All sign-in/register/confirm attempts share one bucket per deployment IP — neutralizing brute-force protection and turning the limiter into a DoS surface against legitimate users.
3. **Register-path enumeration**: the duplicate-confirmed branch in `RegisterUser` returns 202 *without* invoking domain `Password()` validation; the unknown-email branch does, and `ValueError` from the value object is uncaught. Different observable status codes for known-confirmed vs unknown email.
4. **CSRF on `/auth/refresh` in production**: cookie is `SameSite=none; Secure`, no Origin/CSRF token check on the endpoint. Cross-site fetch can rotate the refresh token and weaponize the legit user's stale token into a `revoke_family` reuse-detection → forced sign-out.
5. **Contract drift on `/auth/config` and error bodies**: backend ships `passwordSignUp: bool`; the contract documents an object with `requiresEmailConfirmation`. All errors return `{"message": …}` while every contract MD says `{"detail": …}`.

**Main opportunities.**
- Ship a small "auth hardening" round before the next feature: 5–8 focused commits closes 80% of the security risk above without expanding scope.
- Tighten the contract<->code feedback loop: the OpenAPI snapshot test still points at `specs/002-backend-auth-slice/contracts/openapi.json`. Move to per-slice subset tests + one canonical snapshot, and the drift on `/auth/config` would already have been caught.
- Memory and `DESIGN.md` are stale on the auth callback section and the active branch — easy fixes that meaningfully improve future agent runs.

**Recommendation.** Run **Wave 1 (essential hardening)** before adding new features. The slice is functionally complete and the architecture is sound; the open issues are concentrated in auth correctness/enumeration and would be expensive to retrofit after more features pile on top.

**Top 5 recommended actions.**
1. Drop or rotate `Credentials` when Google promotes an unconfirmed account; add an integration test for the takeover scenario.
2. Read `X-Forwarded-For` (with a trusted-proxy whitelist) for the rate-limiter key; add a test.
3. Validate `Password()` early in `RegisterUser` (or unify branches) and add an `IdentityError` for invalid passwords; eliminate the 202-vs-500 enumeration delta.
4. Add an `Origin`-header / CSRF-token check on `/auth/refresh` and `/auth/logout`.
5. Fix `/auth/config` shape to match the contract (or update the contract to match the code) and add a contract test for it.

---

## 2. Analyzed context

- **Branch requested**: `006-google-auth-login-ux` — exists locally and is the current `HEAD` (`fff98c66a7d7481381427f1bb49aef207f236eae`). No discrepancy.
- **Date**: 2026-05-01.
- **Documents read**: [`AGENTS.md`](AGENTS.md), [`DESIGN.md`](DESIGN.md), [`render.yaml`](render.yaml), [`docker-compose.yml`](docker-compose.yml), [`package.json`](package.json), [`.github/workflows/ci.yml`](.github/workflows/ci.yml), all 9 Serena `project/*` memory files, [`specs/006-google-auth-login-ux/plan.md`](specs/006-google-auth-login-ux/plan.md), all four `specs/006-google-auth-login-ux/contracts/*.md`, [`specs/006-google-auth-login-ux/quickstart.md`](specs/006-google-auth-login-ux/quickstart.md), backend identity context (settings, all routers, all use cases, all repos, all adapters), the 0003 migration, conftest, several integration tests (`test_google_oauth.py`, `test_no_enumeration.py`, `test_no_secret_leakage.py`, `test_login_blocks_unconfirmed.py`, `test_register.py`, `test_confirm_abuse_caps.py`), the `test_architecture.py` purity guard, the OpenAPI snapshot test, the frontend `App.tsx`, router/guards, `client.ts`, `auth.api.ts`, `session.store.ts`, `redirect.ts`, `validation.ts`, all auth components, en locale, DESIGN reference content, `apps/api/.env.example`.
- **Commands executed**: `git branch -a`, `git rev-parse HEAD`, `find` for source/test files, `grep` for selected patterns, `python3 -c "import json…"` to enumerate snapshot endpoints, `cat` of small config/example files.
- **Limitations**: Did not run the test suite or the dev server (read-only audit). Did not load every `pt.ts` string or every Mintlify page; sampled. The Serena project config has `languages: [bash]` per the tooling-quirks memory, so symbolic tools were skipped in favor of `Read`/`grep`.

---

## 3. Real architecture observed

```
campfire/
├── apps/
│   ├── api/        Python 3.12 FastAPI / SQLAlchemy 2.x async / Alembic
│   │   └── src/campfire_api/
│   │       ├── main.py                         create_app, CORS, request-id, lifespan
│   │       ├── settings.py                     SettingsProvider Protocol + EnvSettings
│   │       ├── shared/
│   │       │   ├── persistence/{base,engine,session,deps}.py
│   │       │   ├── logging.py                  JSON formatter
│   │       │   └── request_id.py               middleware + ContextVar
│   │       └── contexts/
│   │           ├── identity/                   ALL auth + sessions + Google + confirmation
│   │           │   ├── domain/{entities,value_objects,ports,events,catalogs,password_rules}.py
│   │           │   ├── application/{errors,use_cases/*}.py
│   │           │   └── adapters/{http,persistence,security,clock,oauth,messaging,rate_limiting}/
│   │           └── repertoire/                 song catalog + entries
│   │               └── adapters/{http,persistence,catalog,caching,rate_limiting}/
│   └── web/        TypeScript 6 / React 19 / Vite 8 SPA, plain CSS, no router lib
│       └── src/{app/{App.tsx,router/},pages/,features/{auth,repertoire},shared/,api/client.ts,i18n/}
├── specs/          Spec Kit, one folder per slice (001 → 006)
├── docs/           Mintlify
├── .github/workflows/{ci,deploy-develop,deploy-production}.yml
└── render.yaml     Develop + Production environments
```

**Critical flows.**
- **Password registration**: `POST /auth/register` → `RegisterUser` use case → mints `email_confirmations` row, sends 6-digit code via `EmailSender`, returns `202 confirmation_required`. **No session issued at register time.**
- **Email confirmation**: `POST /auth/confirm` → verify HMAC'd code → mark confirmation `verified`, set `users.email_confirmed_at`, then `IssueSession` (200 + access token + refresh cookie).
- **Password login**: `POST /auth/login` → if confirmed → `IssueSession`; if unconfirmed but credentials valid → `200 confirmation_required` (no session).
- **Google OAuth**: `POST /auth/google/start` mints an `oauth_flow_states` row + sets a path-scoped `campfire_oauth_state` cookie + returns the `accounts.google.com` URL. `GET /auth/google/callback` consumes the row atomically, exchanges the code via `httpx`, verifies the ID token via `google-auth`, links/creates the user, then `IssueSession` and 302s to `${WEB_BASE_URL}${return_to}?auth=ok`.
- **Refresh**: `POST /auth/refresh` reads `campfire_refresh` cookie (path `/auth/refresh`), atomically consumes via `consume_atomic`, on second-use detects reuse and revokes the family.
- **Frontend**: `useSessionStore` does a one-shot `/auth/refresh` on mount; `request<T>` retries once on 401 by calling refresh. Hand-rolled `pushState`/`popstate` router; auth-protected via `RequireAuth`.

**Persistence wiring.** A single `Base` lives in `shared/persistence/base.py`; both contexts re-import it. Sessions opened/closed by `session_scope` (in `shared/persistence/session.py`) with one `commit()` on the happy path. **However**, two methods in `email_confirmation_repository.py` call `session.commit()` explicitly inside the repo — see Finding Q-1 — which breaks UoW.

**Areas with the highest technical risk.**
1. The four-branch `RegisterUser` use case with diverging side-effects and validation order (enumeration + uncaught `ValueError`).
2. `CompleteGoogleSignIn` account-linking branch when an unconfirmed local user exists (stale `Credentials`).
3. `client_ip(request)` returning the proxy IP (rate-limit nullification under Render).
4. Cookie/CSRF posture on `/auth/refresh` in production (`SameSite=none`).
5. Contract↔code drift on `/auth/config` and on error envelope shape.

---

## 4. Prioritized findings

| ID | Area | Severity | Impact | Effort | Finding | Evidence | Recommendation |
|---|---|---|---|---|---|---|---|
| S-1 | Security / Auth | Critical | High | M | Google promotion of an unconfirmed password account does not invalidate the existing `Credentials`, enabling later login with the original (potentially attacker-set) password. | [apps/api/src/campfire_api/contexts/identity/application/use_cases/complete_google_sign_in.py:92-98](apps/api/src/campfire_api/contexts/identity/application/use_cases/complete_google_sign_in.py#L92-L98); [contracts/auth-google.md:99-105](specs/006-google-auth-login-ux/contracts/auth-google.md#L99-L105) | When promoting via Google, also delete (or rotate to an unusable hash) the `Credentials` row and force a password reset for that path. Add an integration test covering the takeover. |
| S-2 | Security / Rate limiting | High | High | S | `client_ip(request)` returns `request.client.host` — the Render proxy IP — so all login/register/confirm attempts share one rate-limit bucket per deployment. | [apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py:160-161](apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py#L160-L161); [render.yaml:121-123](render.yaml#L121-L123) (deployed behind Render edge) | Read `X-Forwarded-For` with a trusted-proxy allow-list (Render docs) and pick the leftmost untrusted hop. Document the trusted-proxy assumption in settings. |
| S-3 | Security / Enumeration | High | High | S | `RegisterUser` skips `Password(password)` for the duplicate-confirmed branch (returns 202) but invokes it later for unknown emails; `ValueError` from the VO is uncaught → 500. Status delta leaks account existence for a 10+-char weak password. | [apps/api/src/campfire_api/contexts/identity/application/use_cases/register_user.py:75-78](apps/api/src/campfire_api/contexts/identity/application/use_cases/register_user.py#L75-L78); [apps/api/src/campfire_api/contexts/identity/domain/value_objects.py:52-66](apps/api/src/campfire_api/contexts/identity/domain/value_objects.py#L52-L66); [apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py:22-58](apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py#L22-L58) (no `ValueError` handler) | Validate `Password(password)` once at the top of `RegisterUser`. Translate `ValueError` to a domain `InvalidRegistration` mapped to a constant 4xx, identical body for all three branches. Add a no-enumeration integration test that exercises *valid pydantic, weak domain* passwords against known-confirmed, known-unconfirmed, and unknown emails. |
| S-4 | Security / CSRF | High | Medium | S | `/auth/refresh` is reachable cross-site under the production cookie (`SameSite=none; Secure`) with no Origin/CSRF check; the half-hearted `Authorization` check in `csrf.py` triggers only when the header is present. Cross-site forced rotation eventually weaponizes legit reuse-detection → forced sign-out (and possibly worse if attacker can race the legit token). | [apps/api/src/campfire_api/contexts/identity/adapters/http/csrf.py:1-14](apps/api/src/campfire_api/contexts/identity/adapters/http/csrf.py#L1-L14); [render.yaml:29-33,123-127](render.yaml#L29-L33); [apps/api/src/campfire_api/contexts/identity/application/use_cases/refresh_session.py:33-37](apps/api/src/campfire_api/contexts/identity/application/use_cases/refresh_session.py#L33-L37) | Reject `/auth/refresh` (and `/auth/logout`) when `Origin` is set and not in `CORS_ORIGINS`. Optionally add a small CSRF token (set in a JS-readable cookie + required header) for double-submit. |
| S-5 | Security / Performance | Medium | Medium | S | `id_token.verify_oauth2_token` is synchronous and uses blocking `requests.Request()` inside an async route; blocks the event loop on JWKS fetch under a free Render plan with one worker. | [apps/api/src/campfire_api/contexts/identity/adapters/oauth/google_identity_provider.py:36-39](apps/api/src/campfire_api/contexts/identity/adapters/oauth/google_identity_provider.py#L36-L39) | Wrap the verify call in `asyncio.to_thread(...)` (or use `google.oauth2.id_token` in a background pool). |
| S-6 | Security / Abuse | Medium | Medium | S | `POST /auth/google/start` has no rate limiter; contract specifies `429`. Anyone can spam DB rows in `oauth_flow_states`. | [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py:37-57](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py#L37-L57); [contracts/auth-google.md:42-46](specs/006-google-auth-login-ux/contracts/auth-google.md#L42-L46) | Add an `(client_ip, "google_start")`-keyed limiter (smaller bucket than login). Add a periodic cleanup of expired `oauth_flow_states` (cron or on-write garbage collection). |
| S-7 | Security / Config | Medium | High | S | `get_code_hasher` falls back to a hardcoded HMAC key `"dev-email-confirmation-key"` when `EMAIL_CONFIRMATION_HMAC_KEY` is unset — the same string would silently apply in prod if the env var is missing. | [apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py:84-88](apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py#L84-L88) | Fail closed in `prod` (raise on startup if `ENV=prod` and key is unset). The `lifespan` already validates `MAIL_HTTP_*`; mirror that for HMAC keys (`OAUTH_FLOW_HMAC_KEY`, `EMAIL_CONFIRMATION_HMAC_KEY`). |
| C-1 | Contract drift | Medium | Medium | S | `/auth/config` returns `{ google: {enabled}, passwordSignUp: bool }`; contract documents `passwordSignUp: { enabled, requiresEmailConfirmation }`. Frontend matches code, so the contract MD is the lie. | [apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py:81-83](apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py#L81-L83); [contracts/auth-config.md:18-36](specs/006-google-auth-login-ux/contracts/auth-config.md#L18-L36); [apps/web/src/features/auth/api/auth.api.ts:36-39](apps/web/src/features/auth/api/auth.api.ts#L36-L39) | Pick one. Recommended: ship the documented object shape (frontend already wants `requiresEmailConfirmation` for the rollback flag the spec promises). Update the OpenAPI snapshot at the same time. |
| C-2 | Contract drift | Medium | Low | S | Error envelope is `{"message": "…"}` everywhere; every contract MD says `{"detail": "…"}`. Frontend client tolerates both, but the OpenAPI snapshot ships the `message` shape, so external consumers reading the contracts will be wrong. | [apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py:58](apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py#L58); [apps/api/src/campfire_api/contexts/identity/adapters/http/csrf.py:11](apps/api/src/campfire_api/contexts/identity/adapters/http/csrf.py#L11); [contracts/auth-confirm.md:38-44](specs/006-google-auth-login-ux/contracts/auth-confirm.md#L38-L44) | Standardize on `{"detail": "…"}` (FastAPI default; matches contracts) or update the contract MDs. Don't keep the divergence. |
| Q-1 | Persistence / UoW | Medium | Medium | S | `email_confirmation_repository.update()` and `.invalidate_pending_for()` call `session.commit()` directly, breaking the unit-of-work pattern owned by `session_scope`. | [apps/api/src/campfire_api/contexts/identity/adapters/persistence/email_confirmation_repository.py:54-67](apps/api/src/campfire_api/contexts/identity/adapters/persistence/email_confirmation_repository.py#L54-L67); [apps/api/src/campfire_api/shared/persistence/session.py:14-23](apps/api/src/campfire_api/shared/persistence/session.py#L14-L23) | Drop `await self.session.commit()` from both methods. The dep `get_db_session` already commits at scope exit. Add a unit test that asserts a downstream failure rolls back the confirmation update. |
| S-8 | Frontend / Data leak | Medium | Medium | S | `apps/web/src/mocks/fixtures/user.ts` exports `seededUser` with a real test password; it's imported transitively by `auth.api.ts` (`seededCredentials`). The dev test email (`ada@campfire.test`) is the default value of the email input on `SignInForm`. | [apps/web/src/mocks/fixtures/user.ts:1-13](apps/web/src/mocks/fixtures/user.ts#L1-L13); [apps/web/src/features/auth/components/SignInForm.tsx:19](apps/web/src/features/auth/components/SignInForm.tsx#L19); [apps/web/src/features/auth/api/auth.api.ts:167-170](apps/web/src/features/auth/api/auth.api.ts#L167-L170) | Remove the default email from `SignInForm`. Move test-only fixtures behind `import.meta.env.DEV` and ensure they're tree-shaken from production bundles (or move `seededUser` to a `.test.ts`-namespaced fixture). |
| S-9 | UX / OAuth UX | Medium | Medium | S | `next=` redirect is honored on Google but ignored on password sign-in/up. Deep-linked users always land on `/home` after password auth. | [apps/web/src/app/App.tsx:68-73,84-89](apps/web/src/app/App.tsx#L68-L89); [apps/web/src/features/auth/session.store.ts:128-140](apps/web/src/features/auth/session.store.ts#L128-L140) | Read `sessionStorage["campfire.auth.next"]` (sanitized) on password sign-in too; navigate there instead of `/home`. |
| Q-2 | Tests / Snapshot | Medium | Medium | S | The OpenAPI snapshot test compares against `specs/002-backend-auth-slice/contracts/openapi.json` — slice 002 owns the full-app snapshot. Slice 006 has no `openapi.json` snapshot of its own. Future slice authors who forget to regen `002/...openapi.json` will break a slice they didn't touch. | [apps/api/tests/contract/test_openapi_snapshot.py:11-19](apps/api/tests/contract/test_openapi_snapshot.py#L11-L19); [specs/002-backend-auth-slice/contracts/openapi.json](specs/002-backend-auth-slice/contracts/openapi.json) (paths include 006's new endpoints) | Move the canonical full-app snapshot to a stable location (`apps/api/tests/contract/openapi.snapshot.json`) and use per-slice MD subset assertions, or add a slice-006 subset test as the architecture-invariants memory described. |
| S-10 | Security / Headers | Medium | Low | S | No security-headers middleware (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-Robots-Tag, COOP/COEP for the API). | [apps/api/src/campfire_api/main.py:49-65](apps/api/src/campfire_api/main.py#L49-L65) (only CORS + request-id) | Add a minimal middleware setting HSTS in prod and `X-Content-Type-Options: nosniff`; leave CSP for the static site to Render's defaults or a nginx header. |
| S-11 | Auth / Sessions | Low | Medium | M | `RefreshSession.consume_atomic` has no grace window — concurrent refreshes (browser tab restore, double-submit) trigger family revocation = forced sign-out. | [apps/api/src/campfire_api/contexts/identity/application/use_cases/refresh_session.py:33-37](apps/api/src/campfire_api/contexts/identity/application/use_cases/refresh_session.py#L33-L37) | Add a 5-second grace window: if `consumed_at` is within `now - 5s`, return the most recently issued session instead of revoking the family. |
| S-12 | Auth / OAuth | Low | Low | S | OAuth state cookie is not deleted on callback failure paths; it lingers until `max-age=600`. | [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py:99-101](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py#L99-L101) | Call `response.delete_cookie("campfire_oauth_state", path="/auth/google")` on the failure 302 too. |
| S-13 | Frontend / UX | Low | Low | S | `confirmEmail` swallows all errors and returns null — the user can't tell `429 too many attempts` from `400 confirmation invalid`. | [apps/web/src/features/auth/api/auth.api.ts:109-120](apps/web/src/features/auth/api/auth.api.ts#L109-L120) | Surface `ApiError.status` in the result; show a distinct rate-limit message and `Retry-After` countdown. |
| Q-3 | Frontend / Routing | Low | Low | S | `routes.ts` keeps `STALE_ONBOARDING_PATH` and `LEGACY_HOME_PATH` redirects for compatibility. Onboarding is no longer a routed slice but the redirect remains. | [apps/web/src/app/router/routes.ts:14-31](apps/web/src/app/router/routes.ts#L14-L31) | After 006 lands and is stable, drop the stale onboarding redirect; document the legacy `/home` path in routes.ts as the canonical route for direct links. |
| Q-4 | Backend / Misnamed helper | Low | Low | S | `bad_request` in `deps.py` returns HTTP 401 — the name is misleading. | [apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py:164-166](apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py#L164-L166) | Rename to `unauthorized` or remove if unused; `grep` shows no callers in the routers we audited. |
| D-1 | Docs / Memory | Low | Medium | S | `project/overview` memory says active slice is `003-repertoire-song-entry` and lists onboarding as shipped; `project/tooling-quirks` says "No CI configured yet". | (Serena project memory) | Refresh `project/overview` (active slice = 006, drop onboarding), and `project/tooling-quirks` (CI is now extensive — point to `.github/workflows/ci.yml`). |
| D-2 | Docs / Design | Low | Low | S | DESIGN.md §9 says "Auth callback is out of scope for the current Claude-derived frontend MVP. Do not implement…", but slice 006 *did* introduce a callback handoff. | [DESIGN.md:244-256](DESIGN.md#L244-L256) | Mark §9 as historical (frontend-only era) and replace with the calm transfer-back UI guidance the same section already drafts. |
| C-3 | Contract / Header | Low | Low | S | `auth-google.md` says the success redirect's `Set-Cookie` for the refresh cookie uses `SameSite=…`; tests (`test_google_oauth_happy_path_sets_refresh_cookie`) assert `SameSite=lax`. In prod the env forces `SameSite=none`. The contract MD doesn't mention the env-driven attribute. | [contracts/auth-google.md:67-72](specs/006-google-auth-login-ux/contracts/auth-google.md#L67-L72); [render.yaml:30-33](render.yaml#L30-L33) | Add a one-line note that cookie attributes are env-driven (`REFRESH_COOKIE_SECURE`, `REFRESH_COOKIE_SAMESITE`) and reference `apply_refresh_cookie`. |
| Q-5 | Tests / Coverage | Low | Medium | S | `test_register_rate_limit` uses `password="short"` which fails Pydantic `min_length=10` *before* the limiter runs — the test doesn't actually verify a 429. | [apps/api/tests/integration/identity/test_register.py:32-40](apps/api/tests/integration/identity/test_register.py#L32-L40) | Use a 10+-char strong password and assert `last.status_code == 429`. |

Severity legend: **Critical** = exploitable account takeover or universal auth bypass. **High** = enumeration, abuse mitigations bypassed, or contract divergence affecting integrations. **Medium** = exploitable in narrow conditions, observability/correctness, or UX-significant. **Low** = polish, hardening, or test debt.

---

## 5. Security

### What appears to be well handled

- **Argon2id** with sensible parameters; passwords never logged ([test_no_secret_leakage.py](apps/api/tests/integration/identity/test_no_secret_leakage.py)).
- **Opaque tokens with sha256 fingerprint** (no JWT footguns); refresh-token rotation with **family revocation on reuse** ([refresh_session.py:33-37](apps/api/src/campfire_api/contexts/identity/application/use_cases/refresh_session.py#L33-L37)).
- **Refresh cookie** is `HttpOnly`, path-scoped to `/auth/refresh`, `Secure` resolved from `ENV=prod`.
- **OAuth flow** has PKCE S256 + nonce hash + state stored server-side and consumed atomically; `email_verified` enforced; provider subject is the linkage key ([complete_google_sign_in.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/complete_google_sign_in.py)).
- **Confirmation codes** are HMAC-SHA256-stored; constant-time compare; max-attempt invalidation; partial unique index ensures one pending row per user ([models.py:152-176](apps/api/src/campfire_api/contexts/identity/adapters/persistence/models.py#L152-L176)).
- **Login enumeration**: byte-identical 401s for wrong password, missing email, Google-only-no-password, and new-unconfirmed-with-wrong-password ([test_no_enumeration.py](apps/api/tests/integration/identity/test_no_enumeration.py)).
- **CORS**: rejects `*` when credentials are enabled ([settings.py:188-196](apps/api/src/campfire_api/settings.py#L188-L196)); explicit method/header allow-list.
- **Architecture purity**: `test_architecture.py` bans `google` alongside `fastapi/sqlalchemy/argon2/jose/httpx` in `domain/` and `application/`.
- **Diff-based secrets scan + .env-example validation** in CI ([.github/workflows/ci.yml:281-339](.github/workflows/ci.yml#L281-L339)).

### Findings

#### S-1 — Account takeover via stale credentials when Google promotes an unconfirmed account
- **Severity**: Critical. **Priority**: production-blocking.
- **Evidence**: [complete_google_sign_in.py:92-98](apps/api/src/campfire_api/contexts/identity/application/use_cases/complete_google_sign_in.py#L92-L98) sets `email_confirmed_at=now` and inserts a `ProviderLink` but never touches `Credentials`.
- **Risk**: Attacker registers `victim@example.com` (unconfirmed; the real victim never receives the code because the attacker-set address goes to the real owner). Real owner later signs in with Google. Promotion path runs: confirmation invalidated, `email_confirmed_at` set, ProviderLink created. The attacker's `Credentials` row is still there. From now on, `POST /auth/login` with the attacker's password succeeds (account is confirmed) → attacker logs in as the legitimate Google-owned user.
- **Scenario**: identical to several known SaaS vulns (e.g., the GitLab CVE-2017-0907 family).
- **Recommendation**: at promotion, either (a) `DELETE FROM credentials WHERE user_id = …`, or (b) rotate `password_hash` to a sentinel that fails all `verify` calls, or (c) require the user to re-set a password before allowing password login post-promotion. Option (a) is the smallest diff and matches the contract intent ("upgraded by Google").
- **Suggested test**: integration — register password account, then complete Google sign-in for the same email, then assert `POST /auth/login` with the original password returns 401. Add to `test_account_linking.py`.

#### S-2 — Reverse-proxy IP not honored, rate limiter neutralized
- **Severity**: High. **Priority**: production-blocking before any open-signup launch.
- **Evidence**: [deps.py:160-161](apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py#L160-L161). On Render, `request.client.host` is the proxy.
- **Risk**: All sign-in/register/confirm attempts collapse into one bucket → (a) brute-force against any single account is far easier than the documented "10 in 5 minutes" suggests, (b) any one attacker can DoS legitimate users by burning the global bucket.
- **Recommendation**: parse `X-Forwarded-For` with a configurable trusted-proxy list (`TRUSTED_PROXIES` env var). On Render, default the list to RFC1918 + Render's edge ranges, and pick the rightmost untrusted hop (or leftmost if you trust Render's normalization). Never honor it locally without the env opt-in.
- **Suggested test**: integration — set `X-Forwarded-For: 1.2.3.4`, verify the limiter buckets by `1.2.3.4`; without the trusted list, the header is ignored.

#### S-3 — Register-path enumeration via Password() validation order
- **Severity**: High. **Priority**: production-blocking.
- **Evidence**: [register_user.py:75-78,97-104](apps/api/src/campfire_api/contexts/identity/application/use_cases/register_user.py#L75-L104). The duplicate-confirmed path returns 202 *before* `Password(password)` runs; the new-user and unconfirmed-existing paths invoke it. `Password.__post_init__` raises `ValueError`; no global handler ([error_mapping.py only handles `IdentityError`](apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py#L62-L64)).
- **Risk**: `POST /auth/register {email: known-confirmed, password: "abcdefghij"}` → 202. Same with unknown email → ValueError → 500 (or whatever generic FastAPI returns). Status delta = enumeration.
- **Recommendation**: validate `Password(password)` once at the top of `RegisterUser` (after rate-limit, before any branch). Wrap the `ValueError` and surface a domain-level `InvalidRegistration(IdentityError)` mapped to a stable 4xx. Alternatively, normalize the duplicate-confirmed branch to also raise the same exception when the password fails domain rules.
- **Suggested test**: extend `test_no_enumeration.py` (or add a register variant) — for valid-pydantic-but-domain-weak passwords, assert `POST /auth/register` returns the same status code and body across {known confirmed, known unconfirmed, unknown} emails.

#### S-4 — CSRF on `/auth/refresh` (and `/auth/logout`) under SameSite=none
- **Severity**: High. **Priority**: production-blocking once Google sign-in is enabled in prod.
- **Evidence**: [csrf.py:1-14](apps/api/src/campfire_api/contexts/identity/adapters/http/csrf.py#L1-L14) — only checks an Authorization header *if present*; an attacker omits it. Cookie attributes from [render.yaml:29-33](render.yaml#L29-L33).
- **Risk**: cross-site `fetch` rotates the refresh token; the legit user's browser still holds the old one. On the legit user's next `/auth/refresh`, `consume_atomic` returns None → `revoke_family("reuse_detected")` → forced sign-out for the victim. With short `ACCESS_TOKEN_TTL_SECONDS=900`, this surfaces within minutes. There is also a narrow race where the attacker's response (which they cannot read due to CORS) updates server state in ways the user can't roll back from.
- **Recommendation**: enforce `Origin` (or `Referer` fallback) ∈ `CORS_ORIGINS` on `/auth/refresh` and `/auth/logout`. As a smaller hammer, require a custom request header (e.g., `X-Refresh-Request: 1`) — cross-site `fetch` cannot set custom headers without CORS preflight, which the API doesn't allow for arbitrary origins.
- **Suggested test**: integration — send `/auth/refresh` with an `Origin: https://evil.example` header and assert 403.

#### S-5 — Blocking JWKS verification inside async route
- **Severity**: Medium. **Priority**: recommended, not blocking.
- **Evidence**: [google_identity_provider.py:36-39](apps/api/src/campfire_api/contexts/identity/adapters/oauth/google_identity_provider.py#L36-L39). `google.auth.transport.requests.Request()` is synchronous.
- **Risk**: under low concurrency and a single uvicorn worker (Render free tier), this blocks the loop for ~10ms–100ms per fresh JWKS fetch. JWKS rotation can spike to a couple of seconds.
- **Recommendation**: `await asyncio.to_thread(id_token.verify_oauth2_token, …)` or use `google.auth.transport.aiohttp_requests` (adds a dep — heavier).

#### S-6 — `/auth/google/start` lacks rate limiting
- **Severity**: Medium. **Priority**: recommended.
- **Evidence**: [google_oauth.py:37-57](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py#L37-L57). The contract documents 429 ([auth-google.md:42-46](specs/006-google-auth-login-ux/contracts/auth-google.md#L42-L46)).
- **Risk**: spammable endpoint; each call inserts a row in `oauth_flow_states`. With `OAUTH_FLOW_TTL_SECONDS=600` and no GC, table growth is bounded but unnecessary.
- **Recommendation**: add a `(client_ip, "google_start")`-keyed limiter; consider a periodic cleanup of expired rows.

#### S-7 — Hardcoded fallback HMAC key
- **Severity**: Medium. **Priority**: production-blocking when prod env config is sloppy.
- **Evidence**: [deps.py:84-88](apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py#L84-L88) — `key or "dev-email-confirmation-key"`.
- **Risk**: if `EMAIL_CONFIRMATION_HMAC_KEY` is missing in prod, all confirmations are HMAC'd with a known-public string. Render env shows `sync: false` (manual entry) — easy to forget.
- **Recommendation**: in `lifespan`, when `ENV=prod`, raise on startup if any of `EMAIL_CONFIRMATION_HMAC_KEY` / `OAUTH_FLOW_HMAC_KEY` is unset (mirror the `MAIL_BACKEND=http` validation at [main.py:37-46](apps/api/src/campfire_api/main.py#L37-L46)).

#### S-8 — Test fixture leaks into production bundle
- **Severity**: Medium. **Priority**: recommended.
- **Evidence**: `seededUser` exported from `mocks/fixtures/user.ts`, imported by `auth.api.ts`, default in `SignInForm`. `displayNameFromEmail` is also re-exported through this fixture file.
- **Risk**: production bundles ship with a real test password string. If credentials are ever stolen along with the app, that string is a known seed for the dev database. Low blast radius, but unprofessional and fixable.
- **Recommendation**: move `seededUser` to a test-only path (`apps/web/src/__tests__/fixtures/user.ts` or behind `import.meta.env.DEV`); inline `displayNameFromEmail` into `@features/auth`. Remove the default email in `SignInForm`.

#### S-9 — Password sign-in ignores `next` redirect
- **Severity**: Medium (UX). **Priority**: recommended.
- **Evidence**: [App.tsx:68-73,84-89](apps/web/src/app/App.tsx#L68-L89); [session.store.ts:128-140](apps/web/src/features/auth/session.store.ts#L128-L140) — only Google flow reads `campfire.auth.next`.
- **Risk**: deep-linked password sign-in always lands on `/home`, ignoring the captured path.
- **Recommendation**: in `App.tsx` `case "signin"` and `case "signup"`, read and sanitize `sessionStorage["campfire.auth.next"]` and navigate there on `result === "authenticated"`.

#### S-10 — Missing security headers on the API
- **Severity**: Medium. **Priority**: recommended.
- **Evidence**: [main.py:49-65](apps/api/src/campfire_api/main.py#L49-L65) — only CORS + RequestId.
- **Recommendation**: minimal middleware adding `Strict-Transport-Security: max-age=31536000` (in `prod`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Cache-Control: no-store` on auth responses.

#### S-11 — Refresh-token rotation has no grace window
- **Severity**: Low. **Priority**: defer until UX complaints surface.
- **Evidence**: [refresh_session.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/refresh_session.py).
- **Recommendation**: 5-second grace window where a re-presented refresh token whose `consumed_at` is recent returns the most recent issued session instead of revoking the family.

#### S-12 — OAuth state cookie not deleted on failure
- **Severity**: Low.
- **Recommendation**: clear the cookie in the failure 302 to keep the cookie jar tidy.

#### S-13 — Confirmation UX swallows distinct error classes
- **Severity**: Low (UX-tinged security finding because rate-limit and wrong-code look identical).
- **Recommendation**: surface `ApiError.status` (and `Retry-After` if present) — the user can stop guessing.

---

## 6. UX/UI and journey

### Authentication and entry
- **What works**: typography, layout, and accent system match DESIGN.md tokens. Forms are accessible (labels, `aria-pressed` on the password toggle, `aria-live="polite"` on countdown), the Google button respects the brand mark, and the `/confirm` page has a clear count-down + resend cooldown.
- **Issues**:
  - Default email on sign-in is `ada@campfire.test` — leaking dev defaults (S-8). **Fix**: empty the default; let `autoFocus` attract the cursor.
  - `next=` is captured but only Google honors it (S-9).
  - `googleEnabled=false` until `/auth/config` resolves → button briefly hidden, then appears. **Fix**: render the button skeleton (disabled) during `authConfig === null` instead of hiding it.
  - On sign-up success in the rollback path (`EMAIL_CONFIRMATION_REQUIRED=false`), the frontend now performs a *second* request to `/auth/login` ([auth.api.ts:84-91](apps/web/src/features/auth/api/auth.api.ts#L84-L91)). If that second call fails (race, transient 5xx), the user sees a generic error after just having "registered". **Fix**: have the server issue the session in the rollback branch (response shape `TokenResponse`) so the SPA doesn't make two requests for one mental step.

### Home / Repertoire
- Both pages match DESIGN.md spec; loading states are explicit. No issues found in the auth audit scope; defer detailed repertoire UX review to a separate pass.

### Error / loading / empty states
- Confirm page: clear "code expired" copy, disabled submit, retry path. Strong.
- Sign-in/up: error messaging doesn't enumerate, but a 429 `RateLimited` from the server surfaces as `t.validation.account` (`Couldn't create an account. Try again.`) with no `Retry-After` countdown. **Fix**: parse `Retry-After`, render a countdown.
- `confirmEmail` collapses every server error to "code is not valid" (S-13). **Fix**: branch on status.

### Accessibility
- Visible focus states preserved (DESIGN.md mandates the orange border).
- Password toggle is keyboard-reachable, has `aria-pressed`, swaps `aria-label` to `Show password` / `Hide password` ([PasswordField.tsx:43-51](apps/web/src/features/auth/components/PasswordField.tsx#L43-L51)).
- Countdown uses `aria-live="polite"` ([ConfirmEmailForm.tsx:108-114](apps/web/src/features/auth/components/ConfirmEmailForm.tsx#L108-L114)).
- **Gaps**: no `aria-describedby` linking error text to inputs (the errors are siblings, screen readers may not associate them). **Fix**: pass `aria-describedby` from `TextInput` to its error.

### Responsiveness
- DESIGN.md and the implementation rely on `clamp()` + fluid layouts. Auth lane caps at 400px which still works at 320px. Acceptable.

### Visual consistency and design system
- Tokens are honored; `--cf-accent` is set from the session store ([App.tsx:33-35](apps/web/src/app/App.tsx#L33-L35)).
- DESIGN.md §9 still describes auth callback as out-of-scope (D-2).

### Copy and user trust
- "Alpha" tone preserved.
- Password requirements message in EN: `Use 10+ characters, at least 3 character types, and avoid common passwords.` Clear.
- Generic Google error: `We couldn't sign you in with Google. Please try again.` — does not lean on Google; aligned with "no enumeration of provider failure mode".

---

## 7. Testing

### Perceived current coverage
- **Unit (backend)**: 17 files under `tests/unit/identity/` covering register, authenticate, confirm, resend, Google start/complete, account linking, no-enumeration, sign-out, validation rules, HMAC code hasher, settings. Strong.
- **Integration (backend)**: 16 files; covers Google OAuth happy path + unsafe `next`, register (incl. duplicate, validation, rate-limit), login (incl. unconfirmed branch), confirm + abuse caps + silent resend caps, logout, secret-leak guard, refresh, authorization scope, /me, existing-users-unaffected, Google disabled fallback, no-enumeration on login.
- **Contract**: full-app OpenAPI snapshot (Q-2) + repertoire snapshot.
- **Architecture**: walks `contexts/*/{domain,application}` and forbids 6 banned imports.
- **Frontend**: typecheck + build only (Constitution IV); no test runner.

### Critical gaps
1. No test for **register-path enumeration** with valid-pydantic-but-domain-weak passwords (S-3).
2. No test for **stale credentials after Google promotion** (S-1).
3. No test that **rate limiter handles `X-Forwarded-For`** (S-2) — currently couldn't because the code doesn't read it.
4. No test for **`/auth/refresh` cross-origin behavior** (S-4) — the only existing CSRF-ish check is the half-hearted Authorization-header heuristic.
5. No test that **Google start enforces a rate limit** (S-6) — would currently fail.
6. No test that **email-confirmation repository writes are part of the route's transaction** (Q-1) — would currently fail because the repo commits inline.
7. The existing `test_register_rate_limit` doesn't actually test rate-limiting (Q-5).

### Highest-ROI tests to add (before new features)
| Test | Type | File / location | Why |
|---|---|---|---|
| Register enumeration matrix (3 emails × valid-but-weak password) | Integration | `tests/integration/identity/test_no_enumeration.py` | Closes S-3 |
| Google promotion drops/rotates credentials | Integration | `tests/integration/identity/test_account_linking.py` | Closes S-1 |
| `X-Forwarded-For` honored only when proxy is trusted | Integration | new `test_rate_limit_xff.py` | Closes S-2 |
| `/auth/refresh` rejects cross-origin | Integration | new `test_refresh_csrf.py` | Closes S-4 |
| `/auth/google/start` rate-limited | Integration | new `test_google_start_rate_limit.py` | Closes S-6 |
| Repository commit isolation: failing post-update rolls back confirmation | Unit (in-memory + transactional fake) | `tests/unit/identity/test_confirm_email.py` | Closes Q-1 |
| Fix `test_register_rate_limit` to use a strong password | Integration | `tests/integration/identity/test_register.py` | Closes Q-5 |

### Tests not worth adding now
- Frontend Playwright/Cypress — Constitution IV defers; the manual quickstart is the gate.
- Load tests — no traffic to justify them at MVP.
- Property-based tests for password validation — value-add too small for the effort.
- Mutation testing — same.

### Suggested minimum regression matrix
Before any new feature merges, run:
1. `make lint` (architecture + ruff banned-imports).
2. `make test-unit` + `make test-integration` (Postgres testcontainer).
3. `make openapi-snapshot` and confirm zero diff (or intentional, reviewed diff).
4. Manual quickstart from `specs/006-google-auth-login-ux/quickstart.md` end-to-end at 360px and 1440px (Constitution IV gate).

---

## 8. Backend and code construction

### Architecture
- Hexagonal/DDD layout is real: `domain/`, `application/`, `adapters/{http,persistence,security,clock,oauth,messaging,rate_limiting}/`. Layer purity is enforced by `test_architecture.py` and ruff TID251.
- Cross-context surface stays narrow (UserId only, per the architecture-invariants memory).
- Settings + clock + every IO concern is a Protocol port. Good.

### Domain / use cases
- Use cases are single-purpose dataclasses with a `__call__`; mostly clean.
- **Issue**: `RegisterUser` mixes four branches in one body. Refactor into smaller helpers (e.g., `RegisterNew`, `ResendForExistingUnconfirmed`, `NotifyDuplicateForExistingConfirmed`) — but only after S-3 is fixed; otherwise a refactor without the validation-order fix risks regressing.
- **Issue**: `RegisterUser` accepts `confirmations`, `code_hasher`, `email_sender` as `Optional`, with a "no-confirmation rollback" code path that only triggers when all three are `None`. That's a confusing way to model the rollback. **Fix**: keep the dependencies always provided; let the rollback be `confirmation_required=False` only.

### Persistence / migrations
- Migration `0003_identity_oauth_and_confirmation.py` is well-formed: creates 3 tables, adds 1 column, backfills `email_confirmed_at`, has a complete `downgrade()`. Uses partial unique indexes (one pending confirmation per user; active refresh tokens by family). Good.
- **Issue**: `email_confirmation_repository.update()` and `.invalidate_pending_for()` call `session.commit()` (Q-1). The other repos don't. Drop the inline commits — the dep already commits.
- **Minor**: `_uuid()` helper is duplicated; lift to `shared/persistence/`.

### Configuration
- `EnvSettings` + `EnvSettingsProvider` + `SettingsProvider` Protocol pattern is consistent and correct.
- `cors_origins_sync()` exists because Starlette middleware must be wired during `create_app`. Reasonable workaround.
- **Issue**: HMAC fallback in `get_code_hasher` (S-7).
- **Issue**: `lifespan` validates `MAIL_BACKEND=http` config but doesn't validate that HMAC keys are set in `prod` (S-7).

### Errors / logs
- Single `IdentityError` hierarchy mapped to HTTP at the adapter boundary. Use cases never raise `HTTPException`.
- **Issue**: `ValueError` from value-object construction inside use cases is *not* caught by `register_identity_error_handlers` (S-3).
- **Issue**: Error envelope is `{"message": …}`, not `{"detail": …}` (C-2). FastAPI's default uses `detail`; you can keep `message` but document it.
- Logs are JSON via `JsonFormatter`; `request_id` propagates via ContextVar. Good.

### Transactions / concurrency
- Refresh token rotation is atomic via `consume_atomic` returning the row. **Issue**: no grace window (S-11).
- OAuth flow consumption is atomic via `consume_atomic`. Good.
- **Issue**: `ResendConfirmation` checks the hourly cap with a `count_resends_in_window` SELECT followed by inserts; not atomic. Two concurrent resend requests (both within cooldown) could both bypass the cap. Low impact in practice (other gates also fire), but worth a `SELECT ... FOR UPDATE` or an atomic UPDATE-with-WHERE.

### Recommended refactors (in order)
1. Centralize `Password()` validation in `RegisterUser` (S-3).
2. Drop `session.commit()` from `email_confirmation_repository` (Q-1).
3. Pull `_uuid()` to `shared/persistence/`.
4. Extract a `request_origin_check` dependency for `/auth/refresh` and `/auth/logout` (S-4).
5. Add a 5-second grace window to `RefreshSession.consume_atomic` (S-11).

### Refactors to avoid for now
- Splitting `RegisterUser` into multiple use cases before fixing S-3 — the validation-order fix is the actual bug; structural split is style.
- Replacing `httpx` with `aiohttp` for one POST.
- Introducing a CSRF-token middleware library — a 10-line Origin check is enough.

---

## 9. Frontend and integration

### Session state
- `useSessionStore` is the single source of truth for `currentUser`, `authReady`, `unconfirmedEmail`, `confirmationTimings`, `language`, `accent`, `authConfig`, and `authSubmitting`. Plain hook-based store, per project conventions.
- **Issue**: every page load triggers `/auth/refresh` regardless of whether the user has a session ([session.store.ts:58-70](apps/web/src/features/auth/session.store.ts#L58-L70)). For unauthenticated users this is a constant 401. Acceptable but noisy.

### API client
- Bearer + automatic refresh-on-401 + cookie path-scoping is correct.
- `parse<T>` tolerates `body?.message ?? body?.detail?.message ?? body?.detail` to absorb shape drift (C-2).
- **Issue**: `shouldIncludeCredentials(path)` is `path.startsWith("/auth/")` — fine for now, but if `/me` ever needs the cookie, it'll silently break. Document.

### Routing
- Hand-rolled `pushState`/`popstate` works. `RequireAuth` guard is correct.
- **Issue**: legacy/stale path redirects (Q-3); `next=` ignored on password sign-in (S-9).

### Validations
- Frontend rules mirror domain rules (10+ chars, 3 char classes, common-password blocklist). Shared common-password set is duplicated between [`validation.ts`](apps/web/src/features/auth/validation.ts) and [`value_objects.py`](apps/api/src/campfire_api/contexts/identity/domain/value_objects.py). For MVP, fine; long term a JSON-schema export from the domain (per the plan) would be cleaner.

### i18n
- EN keys present; `pt.ts` not audited line-by-line but `npm run check:i18n` script exists.
- **Note**: `translate(language)` does not fall back to EN on missing keys (per `tooling-quirks` memory), so any drift breaks UI silently.

### Typing
- `AuthConfig.passwordSignUp: boolean` matches the (incorrect) backend shape (C-1). Either fix the backend (preferred) and update the type, or update the contract MD.
- `AuthOutcome` discriminated union is clean.

### Componentization
- `PasswordField` and `PasswordStrengthHint` are well factored.
- `SignInForm` and `SignUpForm` duplicate the Google-button rendering block; trivial extraction.

### Fragile flows
- The double-step "register → 202 → SPA calls /auth/login" path (auth.api.ts:78-91) is brittle in the rollback case (`EMAIL_CONFIRMATION_REQUIRED=false`). Fix server-side to issue the session in that case.
- `ConfirmEmailForm` countdowns rely on `Date.now()` and `issuedAt` (client clock). Acceptable for visual countdown but not for security gating; server is the gate.

---

## 10. DevOps, CI/CD, and deployment

### Pipeline gaps
- CI is comprehensive: frontend typecheck + build, backend lint/mypy/unit/integration/contract, migrations check, branch policy, env-example validation, docs nav validation, secrets scan, deploy + probes for develop and prod, automated promotion PR. Strong.
- **Gap**: the OpenAPI snapshot test points at slice 002's path (Q-2). Minor cleanup.
- **Gap**: mypy is `continue-on-error: true`; documented as "non-blocking until backend type cleanup is complete". Track an explicit target date or it stays soft forever.
- **Gap**: no dependency vulnerability scan beyond Dependabot (which is configured).
- **Gap**: CI doesn't run a backend `make check-aurora-extensions` (mentioned in `suggested-commands` memory but not in the workflow). May not be critical given Render Postgres.

### Deployment readiness
- Render config has `autoDeployTrigger: "off"` + GitHub Actions deploy hooks. Solid, intentional pattern.
- Both `develop` and `production` have proper environment variables. `sync: false` on every secret. Health checks point at `/readyz`. Good.
- **Issue**: dev runs `alembic upgrade head` inside `startCommand`; prod uses `preDeployCommand`. The dev pattern means the API doesn't accept traffic until migrations succeed (good), but on rollback there's no Alembic downgrade automation — manual.

### Environment variables
- `.env.example` is comprehensive and matches `EnvSettings`.
- `render.yaml` matches `.env.example` set, with the right `sync: false` set for secrets.
- **Issue**: dev `MAIL_BACKEND=console` in `render.yaml` writes the confirmation code to disk inside the container — fine for dev but only persisted in the running container's filesystem. Consider documenting this or pointing to logs.

### Health / readiness
- Both are wired and probed by GitHub Actions ([scripts/ci/probe-url.sh](scripts/ci/probe-url.sh)).

### Migrations
- Hand-written Alembic; both `upgrade()` and `downgrade()` complete. The 0002→0003 (identity oauth & confirmation) migration backfills `email_confirmed_at = created_at` for existing users — matches the plan.

### Rollback
- No automated rollback. The contract for emergency rollback (`EMAIL_CONFIRMATION_REQUIRED=false`, `GOOGLE_OAUTH_ENABLED=false`) is via env-var changes + Render redeploy. Documented in `docs/identity/runbook-disable-google.mdx` per the plan.
- **Recommendation**: write a one-page runbook that says "to roll back this slice, run X env-var changes and Y migration step"; verify it works in dev.

### Observability
- Logs are JSON with `request_id`. No metrics or traces. Acceptable for MVP; document the gap.

---

## 11. Documentation and specs

### Reliable docs
- [`specs/006-google-auth-login-ux/plan.md`](specs/006-google-auth-login-ux/plan.md) is accurate and detailed.
- `data-model.md`, `research.md`, `quickstart.md` — sampled and consistent.
- `.github/workflows/ci.yml` is the canonical pipeline description.

### Obsolete or misaligned
- **DESIGN.md §9 — historical-but-not-marked**: says "Auth callback is out of scope". Slice 006 ships an auth callback. Mark §9 as historical and replace with the *calm transfer-back* guidance the section already drafts. (D-2)
- **Memory `project/overview`**: says active slice = `003-repertoire-song-entry`, lists `onboarding/` as shipped. Both stale. (D-1)
- **Memory `project/tooling-quirks`**: says "No CI configured yet" — stale. (D-1)
- **Contract MDs `auth-google.md`, `auth-confirm.md`, `auth-config.md`, `auth-changed.md`**: all use `{"detail": "…"}` for error bodies; code uses `{"message": "…"}`. (C-2)
- **Contract `auth-config.md`**: documents `passwordSignUp: { enabled, requiresEmailConfirmation }`; code returns `passwordSignUp: bool`. (C-1)
- **OpenAPI snapshot location**: `specs/002-backend-auth-slice/contracts/openapi.json` (Q-2).

### Historical specs that should be marked
- `specs/001-frontend-mvp-prototype/` is fine as-is; the per-slice memory already calls it "superseded by real backend". No action.
- DESIGN.md needs the §9 update (D-2).

### Contracts that need updates
- `auth-google.md` — clarify cookie attributes are env-driven (C-3).
- `auth-config.md` — pick one shape and align (C-1).
- All four `auth-*.md` — error envelope (C-2).

### Docs-as-code recommendations
- Add a small CI step that diffs contract MDs against the OpenAPI snapshot (jsonschema sanity check on response shapes). Constitution Principle V already mandates docs-in-the-same-changeset; a CI gate would catch drift earlier.
- Add a `docs/identity/runbook-disable-google.mdx` if it isn't there yet (the plan promises it; verify in a follow-up).

---

## 12. Recommended action plan

### Wave 1 — Essential hardening before new features

**1. Drop credentials when Google promotes an unconfirmed account (S-1)**
- **Objective**: eliminate the account-takeover path described in S-1.
- **Rationale**: Critical-severity exploit; attacker controls a real user's account after the legitimate owner uses Google sign-in.
- **Likely files**: [complete_google_sign_in.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/complete_google_sign_in.py); add `delete_for_user` to `CredentialsRepository` (port + adapter); update `auth-google.md` behavior matrix.
- **Acceptance criteria**: integration test — register password account, complete Google sign-in for the same email, then `POST /auth/login` with the original password returns 401; no `Credentials` row exists for that user.
- **Recommended tests**: integration in `test_account_linking.py`.

**2. Honor `X-Forwarded-For` with a trusted-proxy allow-list (S-2)**
- **Objective**: real per-attacker rate limiting on Render.
- **Rationale**: today's limiter is a per-deployment bucket; brute force is essentially unprotected.
- **Likely files**: [deps.py:160-161](apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py#L160-L161); add `TRUSTED_PROXIES` env var to `EnvSettings`/`SettingsProvider`/`.env.example`/`render.yaml`.
- **Acceptance criteria**: with `TRUSTED_PROXIES` set to the test IP, `X-Forwarded-For: 1.2.3.4` buckets by `1.2.3.4`; without it, the header is ignored.
- **Recommended tests**: integration `test_rate_limit_xff.py`.

**3. Validate password early in RegisterUser, kill the enumeration delta (S-3)**
- **Objective**: identical observable response across {known confirmed, known unconfirmed, unknown} for any input that fails the password rules (or doesn't).
- **Likely files**: [register_user.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/register_user.py); [errors.py](apps/api/src/campfire_api/contexts/identity/application/errors.py); [error_mapping.py](apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py).
- **Acceptance criteria**: integration test asserts byte-identical response across the 3-email × valid-pydantic-but-domain-weak-password matrix.
- **Recommended tests**: extend `test_no_enumeration.py`.

**4. CSRF / Origin check on `/auth/refresh` and `/auth/logout` (S-4)**
- **Objective**: cross-origin POST cannot rotate refresh tokens.
- **Likely files**: [csrf.py](apps/api/src/campfire_api/contexts/identity/adapters/http/csrf.py); add a small dep that reads `Origin` and validates against `cors_origins`.
- **Acceptance criteria**: cross-origin `Origin: https://evil.example` POST to `/auth/refresh` returns 403; same-origin POST works; no header → also rejected (or allowed when `SameSite=lax/strict` is in effect — pick one consistently).
- **Recommended tests**: integration `test_refresh_csrf.py`.

**5. Fix `/auth/config` shape to match the contract (C-1)**
- **Objective**: ship the documented `{ google: {enabled}, passwordSignUp: { enabled, requiresEmailConfirmation } }` shape; align frontend type.
- **Likely files**: [schemas.py](apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py); [config.py router](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/config.py); [auth.api.ts](apps/web/src/features/auth/api/auth.api.ts); update OpenAPI snapshot.
- **Acceptance criteria**: response matches `auth-config.md`; frontend uses `requiresEmailConfirmation` (even if always `true` for now); contract test passes.
- **Recommended tests**: integration `test_auth_config.py` asserting exact shape.

**6. Fail closed on missing HMAC keys in prod (S-7)**
- **Objective**: prod startup raises if `EMAIL_CONFIRMATION_HMAC_KEY` or `OAUTH_FLOW_HMAC_KEY` is unset.
- **Likely files**: [main.py lifespan](apps/api/src/campfire_api/main.py#L32-L47); [deps.py](apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py#L84-L88).
- **Acceptance criteria**: `ENV=prod` + missing key → `RuntimeError` on startup; dev unaffected.
- **Recommended tests**: unit test on `lifespan`.

**7. Rate limit `/auth/google/start` (S-6)**
- **Objective**: block scripted state-row creation.
- **Likely files**: [google_oauth.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py); add a dedicated limiter or reuse the existing `InMemoryRateLimiter` keyed by `(client_ip, "google_start")`.
- **Acceptance criteria**: 11th call from the same IP returns 429; resets after window.
- **Recommended tests**: integration `test_google_start_rate_limit.py`.

**8. Drop `session.commit()` from `email_confirmation_repository` (Q-1)**
- **Objective**: keep UoW boundary at `session_scope`.
- **Likely files**: [email_confirmation_repository.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/email_confirmation_repository.py).
- **Acceptance criteria**: existing integration tests still pass; new test asserts that an exception after `update()` rolls back the status change.

### Wave 2 — Quality and consistency

**9. Standardize error envelope on `{"detail": …}` (C-2)** — update routers, csrf, error_mapping; regen OpenAPI snapshot; update contracts.
**10. Move OpenAPI snapshot out of slice 002 (Q-2)** — `apps/api/tests/contract/openapi.snapshot.json`; per-slice subset asserts.
**11. Honor `next=` on password sign-in (S-9)**.
**12. Remove `seededUser` default email from SignInForm; gate fixtures behind DEV (S-8)**.
**13. Distinguish 429 from 400 in confirmation UI (S-13)** — show retry timer.
**14. Add minimal security headers middleware (S-10)**.
**15. Add a 5s refresh grace window (S-11)**.
**16. Refresh stale memories and DESIGN.md §9 (D-1, D-2)**.

### Wave 3 — Future evolution

**17. Wrap blocking JWKS verification (S-5)** — small win, defer until perf matters.
**18. Atomic resend hourly-cap update (concurrency) — `SELECT … FOR UPDATE` or atomic UPSERT** — defer until measured churn.
**19. Add a CI step that diffs contract MDs vs. OpenAPI snapshot** — small but compounding value.
**20. Track mypy "non-blocking" debt to a deadline** — pick a date; flip `continue-on-error` off after.
**21. Centralize the common-password blocklist** — single source via JSON-schema export.
**22. Add observability beyond JSON logs** — once traffic justifies it.

For each Wave 1 item, expect S effort (≤ ½ day) except S-1 and S-3 which are M (1–1½ days because of test additions).

---

## 13. Open questions

These decisions need explicit human confirmation before Wave 1 can be considered closed:

1. **Production policy on the rollback flag `EMAIL_CONFIRMATION_REQUIRED=false`** — does the team want this kept indefinitely as a runtime escape hatch, or removed entirely once the slice stabilizes? It complicates the register flow.
2. **Behavior on Google promotion of an unconfirmed account (S-1)** — when we drop credentials, should the user be told (transactional email saying "your password account was upgraded to Google")?
3. **CSRF strategy** — Origin-check (S-4) only, or also a JS-readable double-submit token? The Origin check is enough for browsers; the token is needed only if non-browser clients ever start hitting the API cross-origin.
4. **Trusted proxy list for Render** — is the team comfortable hard-coding Render edge ranges, or should we use a config var listing CIDR blocks?
5. **MVP trade-off on `seededUser`** — keep the dev fixture and tree-shake aggressively, or move it behind `import.meta.env.DEV`?
6. **Password sign-in `next=` (S-9)** — is "always land on /home after password auth" intentional UX or oversight?
7. **Production single-process rate limiter** — is a single Render instance the intended steady state? If horizontal scaling is on the roadmap (even one extra dyno), the in-memory limiter has to move to Postgres or Redis.
8. **`/auth/config` shape** — keep code shape and update the contract, or fix code to match the contract? The latter aligns with the documented `requiresEmailConfirmation` rollback toggle.

---

## 14. Conclusion

Campfire is an unusually disciplined MVP for its size: clean DDD boundaries, real test coverage, working CI/CD into Render, and a feature-spec → plan → contracts → tests → code chain that mostly holds together. The 006 slice extends the identity context cleanly and the OAuth flow itself is implemented carefully (PKCE, nonce, state-cookie, atomic consume).

The risks worth pausing for are not architectural — they are concentrated in **a small set of auth correctness decisions** (S-1, S-2, S-3, S-4, S-7) that compound badly if a future slice builds on top of them. None of these requires invasive refactoring; the diff is small and the tests are obvious. The contract drift on `/auth/config` and on the error envelope is mostly cosmetic but signals that the docs↔code feedback loop has slack in it.

**Most strategic recommendation**: do **Wave 1** as a single small slice (call it `007-auth-hardening` or fold it into the slice 006 closeout). Skip Wave 2/3 until after the next feature in the queue. The MVP doesn't need enterprise hardening; it does need these specific fixes before "Google login" graduates from "shipped" to "production-grade".

**Most sensible next step**: open a Spec Kit slice scoped tightly to S-1, S-2, S-3, S-4, S-6, S-7, Q-1, C-1 — eight commits, ≈1 week, one PR — and run the existing CI matrix. After it merges, the project is genuinely ready for the next user-facing feature.
