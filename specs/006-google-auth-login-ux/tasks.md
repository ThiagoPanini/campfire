# Tasks: Google Authentication and Login Experience Improvements

**Input**: Design documents from `/specs/006-google-auth-login-ux/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: REQUIRED — FR-035 enumerates the test matrix and the spec mandates contract/integration/unit coverage. Tasks below include test work per user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. Story labels map to spec.md user stories: `[US1]` Google sign-in/up · `[US2]` Email-confirmed traditional sign-up · `[US3]` Hardened email+password UX · `[US4]` Predictable redirects.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4); omitted for Setup/Foundational/Polish phases
- File paths are absolute from repository root

## Path Conventions

Web app monorepo (per plan.md §Project Structure):

- Backend: [apps/api/src/campfire_api/](apps/api/src/campfire_api/), tests in [apps/api/tests/](apps/api/tests/)
- Frontend: [apps/web/src/](apps/web/src/)
- Migrations: [apps/api/alembic/versions/](apps/api/alembic/versions/)
- Docs: [docs/](docs/)

> **Migration revision**: per data-model.md §2, the new migration is authored as `0003_identity_oauth_and_confirmation` with `down_revision = "0002_repertoire_initial"` — the current head, since the `0002` slot is already occupied by [apps/api/alembic/versions/0002_repertoire_initial.py](apps/api/alembic/versions/0002_repertoire_initial.py). Schema content matches data-model.md §2 verbatim.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project-level prep that is independent of any user story.

- [X] T001 Add `google-auth` to backend runtime deps in [apps/api/pyproject.toml](apps/api/pyproject.toml) and refresh [apps/api/uv.lock](apps/api/uv.lock) via `uv lock`; verify `httpx` remains pinned.
- [X] T002 [P] Extend `ruff per-file-ignores` (TID251) in [apps/api/pyproject.toml](apps/api/pyproject.toml) to allow `httpx` in [apps/api/src/campfire_api/contexts/identity/adapters/oauth/](apps/api/src/campfire_api/contexts/identity/adapters/oauth/) and `google-auth` in the same path; allow `httpx` in [apps/api/src/campfire_api/contexts/identity/adapters/messaging/](apps/api/src/campfire_api/contexts/identity/adapters/messaging/).
- [X] T003 [P] Extend the architecture purity test in [apps/api/tests/unit/test_architecture.py](apps/api/tests/unit/test_architecture.py) to assert `google-auth`, `httpx`, `argon2`, `sqlalchemy`, `fastapi`, `jose` cannot be imported from `domain/` or `application/`, and to whitelist the new adapter sub-packages `oauth/` and `messaging/`.
- [X] T004 [P] Declare the new env var **names** (no values, `sync: false` for secrets) in [render.yaml](render.yaml): `GOOGLE_OAUTH_ENABLED`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `WEB_BASE_URL`, `OAUTH_FLOW_HMAC_KEY`, `OAUTH_FLOW_TTL_SECONDS`, `EMAIL_CONFIRMATION_REQUIRED`, `EMAIL_CONFIRMATION_HMAC_KEY`, `EMAIL_CONFIRMATION_TTL_SECONDS`, `EMAIL_CONFIRMATION_MAX_ATTEMPTS`, `EMAIL_CONFIRMATION_RESEND_COOLDOWN_SECONDS`, `EMAIL_CONFIRMATION_RESEND_HOURLY_CAP`, `MAIL_BACKEND`, `MAIL_FROM`, `MAIL_OUTBOX_DIR`, `MAIL_HTTP_URL`, `MAIL_HTTP_API_KEY`. Default `GOOGLE_STUB_ENABLED=false`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, settings, ports, error hierarchy, and the extracted `IssueSession` use case. Every user story depends on these.

**⚠️ CRITICAL**: No user story work can begin until Phase 2 is complete.

### Settings & configuration

- [X] T005 Extend `EnvSettings` and `SettingsProvider` in [apps/api/src/campfire_api/settings.py](apps/api/src/campfire_api/settings.py) with the new fields from T004; add async accessors per backend invariant 7 (Settings as a port). `GOOGLE_STUB_ENABLED` default flips to `false`. **`EMAIL_CONFIRMATION_REQUIRED` semantics**: this flag exists *only* as an operational rollback escape hatch. Default is `true` in every environment; running with `false` is an abnormal, time-bounded incident-response state — the spec's FR-013 (confirmation MUST gate sign-up) is the steady-state contract. Document this in the field's docstring and in the runbook (T088); the application MUST log a startup `WARNING email_confirmation_required=false` so an operator never forgets the flag is off.
- [X] T006 [P] Add a `google_enabled()` derived helper to `SettingsProvider` that returns `True` only when `GOOGLE_OAUTH_ENABLED` is true AND `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `OAUTH_FLOW_HMAC_KEY` are all set. Unit-test in [apps/api/tests/unit/identity/test_settings.py](apps/api/tests/unit/identity/test_settings.py).

### Domain: value objects, entities, ports, errors

- [X] T007 [P] Add `ConfirmationCode`, `ProviderSubject`, `OAuthState` value objects to [apps/api/src/campfire_api/contexts/identity/domain/value_objects.py](apps/api/src/campfire_api/contexts/identity/domain/value_objects.py) with the validation rules in data-model.md §3. Frozen dataclasses, no I/O.
- [X] T008 [P] Strengthen the `Password` VO in [apps/api/src/campfire_api/contexts/identity/domain/value_objects.py](apps/api/src/campfire_api/contexts/identity/domain/value_objects.py): require length ≥ 10, ≥ 3 of 4 char classes, reject a small embedded common-password blocklist. Existing-row authentication path MUST keep using the legacy verifier (no length re-check on login per FR-026).
- [X] T009 [P] Add `ProviderLink`, `EmailConfirmation`, `OAuthFlowState` entities (plus `GoogleIdentity` frozen dataclass) to [apps/api/src/campfire_api/contexts/identity/domain/entities.py](apps/api/src/campfire_api/contexts/identity/domain/entities.py); state machines per data-model.md §1.5/§1.6.
- [X] T010 Add new ports — `ProviderLinkRepository`, `EmailConfirmationRepository`, `OAuthFlowStateRepository`, `ConfirmationCodeHasher`, `GoogleIdentityProvider`, `EmailSender` — to [apps/api/src/campfire_api/contexts/identity/domain/ports.py](apps/api/src/campfire_api/contexts/identity/domain/ports.py) per data-model.md §4. All `async`. `EmailSender` MUST expose **both** `send_confirmation_code(to, code, locale, expires_at)` (used by sign-up + resend) and `send_duplicate_signup_notice(to, locale)` (used by FR-017's neutral notification path); both are awaited by use cases T053/T055. Depends on T007, T009.
- [X] T011 [P] Extend the `IdentityError` hierarchy in [apps/api/src/campfire_api/contexts/identity/application/errors.py](apps/api/src/campfire_api/contexts/identity/application/errors.py) with `GoogleSignInUnavailable`, `GoogleSignInFailed`, `ConfirmationCodeInvalid`, `ConfirmationCodeExpired`, `ConfirmationAttemptsExceeded`, `ConfirmationResendCooldown` (carries `retry_after`), `EmailNotConfirmed` (internal-only).

### Persistence: ORM + migration + repositories

- [X] T012 Add ORM models `ProviderLinkModel`, `EmailConfirmationModel`, `OAuthFlowStateModel` and the `email_confirmed_at` column on `UserModel` to [apps/api/src/campfire_api/contexts/identity/adapters/persistence/models.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/models.py) per data-model.md §1.
- [X] T013 Author Alembic migration **`0003_identity_oauth_and_confirmation`** under [apps/api/alembic/versions/0003_identity_oauth_and_confirmation.py](apps/api/alembic/versions/0003_identity_oauth_and_confirmation.py) with `down_revision = "0002_repertoire_initial"` (or current head): `email_confirmed_at` column + backfill `= created_at`, `provider_links`, `email_confirmations`, `oauth_flow_states` tables and indexes per data-model.md §2. Reverse op drops in dependency order. Depends on T012.
- [X] T014 [P] Implement `SqlAlchemyProviderLinkRepository` in [apps/api/src/campfire_api/contexts/identity/adapters/persistence/provider_link_repository.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/provider_link_repository.py); mappers in [apps/api/src/campfire_api/contexts/identity/adapters/persistence/mappers.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/mappers.py).
- [X] T015 [P] Implement `SqlAlchemyEmailConfirmationRepository` in [apps/api/src/campfire_api/contexts/identity/adapters/persistence/email_confirmation_repository.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/email_confirmation_repository.py) — including `count_resends_in_window` and `invalidate_pending_for`. Mappers in [apps/api/src/campfire_api/contexts/identity/adapters/persistence/mappers.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/mappers.py).
- [X] T016 [P] Implement `SqlAlchemyOAuthFlowStateRepository` in [apps/api/src/campfire_api/contexts/identity/adapters/persistence/oauth_flow_state_repository.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/oauth_flow_state_repository.py) with `consume_atomic` (single-row UPDATE…RETURNING; idempotent against double-callback). Mappers updated in [apps/api/src/campfire_api/contexts/identity/adapters/persistence/mappers.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/mappers.py).
- [X] T017 Update `UnitOfWork` in [apps/api/src/campfire_api/contexts/identity/adapters/persistence/unit_of_work.py](apps/api/src/campfire_api/contexts/identity/adapters/persistence/unit_of_work.py) to expose the three new repositories. Update FastAPI dependency wiring in [apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py](apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py).

### Security adapters

- [X] T018 [P] Implement `HmacConfirmationCodeHasher` in [apps/api/src/campfire_api/contexts/identity/adapters/security/hmac_code_hasher.py](apps/api/src/campfire_api/contexts/identity/adapters/security/hmac_code_hasher.py): HMAC-SHA256 keyed by `EMAIL_CONFIRMATION_HMAC_KEY`, constant-time compare. Unit-tested in [apps/api/tests/unit/identity/test_hmac_code_hasher.py](apps/api/tests/unit/identity/test_hmac_code_hasher.py).

### Shared session-issuance use case

- [X] T019 Extract `IssueSession` use case to [apps/api/src/campfire_api/contexts/identity/application/use_cases/issue_session.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/issue_session.py) by moving the session/refresh-token issuance currently inlined in `authenticate_user.py`. Refactor [apps/api/src/campfire_api/contexts/identity/application/use_cases/authenticate_user.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/authenticate_user.py) to call it. No behavior change for confirmed users.
- [X] T020 [P] Update existing unit test [apps/api/tests/unit/identity/test_authenticate_user.py](apps/api/tests/unit/identity/test_authenticate_user.py) to drive the refactored `AuthenticateUser`/`IssueSession` split. Verify session shape is unchanged.

### Test fakes & shared fixtures

- [X] T021 [P] Extend [apps/api/tests/unit/identity/fakes.py](apps/api/tests/unit/identity/fakes.py) with: `FakeProviderLinkRepository`, `FakeEmailConfirmationRepository` (clock-aware), `FakeOAuthFlowStateRepository`, `FakeGoogleIdentityProvider`, `FakeEmailSender` (records sends), `FakeConfirmationCodeHasher`. Drive all repos from a shared `FakeClock`.

**Checkpoint**: Foundation ready. User-story phases can now proceed in parallel.

---

## Phase 3: User Story 1 — Sign up and log in with Google (Priority: P1) 🎯 MVP

**Goal**: Replace `/auth/google-stub` with a real Google OAuth Authorization Code + PKCE flow; create or link an account; issue a normal Campfire session; hide the Google control when the env is unconfigured.

**Independent Test**: With Google credentials configured locally, complete "Continue with Google" from `/signup` and from `/signin`. Verify `/me` reflects the Google-provided email and a sensible display name; refresh cookie persists across reload; `GOOGLE_OAUTH_ENABLED=false` hides the button and makes `POST /auth/google/start` return 503.

### Tests for User Story 1 (write before implementation)

- [X] T022 [P] [US1] Unit test `start_google_sign_in.py` in [apps/api/tests/unit/identity/test_start_google_sign_in.py](apps/api/tests/unit/identity/test_start_google_sign_in.py): mints state row; sanitizes `next` (drops `//foo`, `https://x`, paths containing `://`); 503 when settings disabled.
- [X] T023 [P] [US1] Unit test `complete_google_sign_in.py` in [apps/api/tests/unit/identity/test_complete_google_sign_in.py](apps/api/tests/unit/identity/test_complete_google_sign_in.py): state-cookie/query mismatch → `GoogleSignInFailed`; consumed/expired row → `GoogleSignInFailed`; nonce mismatch → `GoogleSignInFailed`; `email_verified=false` → `GoogleSignInFailed`; success → returns `IssuedSession + return_to`.
- [X] T024 [P] [US1] Unit test account-linking matrix from auth-google.md §Behavior matrix in [apps/api/tests/unit/identity/test_account_linking.py](apps/api/tests/unit/identity/test_account_linking.py): hit-by-subject; miss-subject + hit-confirmed-email; miss-subject + hit-unconfirmed-email (invalidates pending confirmations); miss/miss creates new user.
- [X] T025 [P] [US1] Integration test [apps/api/tests/integration/identity/test_google_oauth.py](apps/api/tests/integration/identity/test_google_oauth.py): full happy-path against a fake Google provider + real Postgres; assert refresh cookie attributes match `Path=/auth/refresh`, `HttpOnly`, `Secure`, `SameSite` from settings.
- [X] T026 [P] [US1] Integration test [apps/api/tests/integration/identity/test_google_disabled_falls_back.py](apps/api/tests/integration/identity/test_google_disabled_falls_back.py): with `GOOGLE_OAUTH_ENABLED=false`, `GET /auth/config` → `google.enabled=false`; `POST /auth/google/start` → 503 `google sign-in unavailable`; password login still works.
- [X] T027 [P] [US1] OpenAPI snapshot test update in [apps/api/tests/contract/test_openapi_snapshot.py](apps/api/tests/contract/test_openapi_snapshot.py) for `POST /auth/google/start`, `GET /auth/google/callback` (302-only), `GET /auth/config`.

### Implementation for User Story 1

- [X] T028 [P] [US1] Implement `GoogleIdentityProvider` adapter in [apps/api/src/campfire_api/contexts/identity/adapters/oauth/google_identity_provider.py](apps/api/src/campfire_api/contexts/identity/adapters/oauth/google_identity_provider.py): `httpx` POST to `https://oauth2.googleapis.com/token` with code + PKCE verifier; `google.oauth2.id_token.verify_oauth2_token` for ID-token verification (audience, issuer, freshness, signature, JWKS via `google.auth.transport.requests`). Maps any failure (network, 4xx, jwt error, `email_verified=false`, audience/nonce mismatch) to `GoogleSignInFailed`. No raw bytes leak to logs.
- [X] T029 [US1] Implement `StartGoogleSignIn` use case in [apps/api/src/campfire_api/contexts/identity/application/use_cases/start_google_sign_in.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/start_google_sign_in.py): generates PKCE verifier, OIDC nonce, state secret; HMACs them; persists `OAuthFlowState`; sanitizes `next`; returns `authorize_url` + `state_cookie_value`. Raises `GoogleSignInUnavailable` when `settings.google_enabled() is False`. Depends on T010, T016, T006.
- [X] T030 [US1] Implement `CompleteGoogleSignIn` use case in [apps/api/src/campfire_api/contexts/identity/application/use_cases/complete_google_sign_in.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/complete_google_sign_in.py): validates state cookie + query state, calls `OAuthFlowStateRepository.consume_atomic`, calls `GoogleIdentityProvider.exchange_code`, applies the linking matrix from auth-google.md, calls `IssueSession`, returns `IssuedSession + return_to`. Depends on T010, T014, T016, T019, T028.
- [X] T031 [US1] Add HTTP schemas in [apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py](apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py): `GoogleStartRequest{intent, next?}`, `GoogleStartResponse{authorize_url}`, `AuthConfigResponse{google, password_sign_up}`.
- [X] T032 [US1] Implement router [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py) — `POST /auth/google/start` (sets `campfire_oauth_state` cookie with `Path=/auth/google; HttpOnly; Secure; SameSite=lax; Max-Age=600`) and `GET /auth/google/callback` (always 302; success → `${WEB}${return_to or /home}?auth=ok` + refresh cookie + clear state cookie; failure mapping per auth-google.md). Depends on T029, T030, T031.
- [X] T033 [US1] Implement router [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/config.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/config.py) — `GET /auth/config` (cache `public, max-age=60`); body shape per auth-config.md §200 Response. Depends on T006.
- [X] T034 [US1] Extend [apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py](apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py): `GoogleSignInUnavailable` → 503 `{"detail":"google sign-in unavailable"}`; `GoogleSignInFailed` → 302 to `${WEB}/signin?auth_error=google_failed` (callback router only — `start` raises and is mapped to 503 via the unavailable branch). Cancellation case (`?error=access_denied`) → `auth_error=google_cancelled` is handled inside the callback router.
- [X] T035 [US1] Wire the new routers + the existing `/auth/google-stub` (now defaulting off) into the FastAPI app in [apps/api/src/campfire_api/main.py](apps/api/src/campfire_api/main.py). Keep `google_stub_sign_in.py` and its router gated by `GOOGLE_STUB_ENABLED` (default `false`) for tests only.
- [X] T036 [US1] Structured logging for `event=google_oauth_failure reason=<short_code> request_id=…` per auth-google.md §Logged. No tokens/claims/emails. Add in [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py); shared helper if needed.

### Frontend for User Story 1

- [X] T037 [P] [US1] Extend [apps/web/src/features/auth/api/auth.api.ts](apps/web/src/features/auth/api/auth.api.ts) with `startGoogle({intent, next})` (POST `/auth/google/start`, returns `{authorizeUrl}`) and `getAuthConfig()` (GET `/auth/config`). Type the responses.
- [X] T038 [US1] Add a `useAuthConfig` (or equivalent) hook + lightweight cache in [apps/web/src/features/auth/](apps/web/src/features/auth/); render the "Continue with Google" button hidden when `google.enabled === false` in production builds, and visible+disabled with `title` in `import.meta.env.DEV` per auth-config.md §Frontend behavior. Update [apps/web/src/features/auth/components/SignInForm.tsx](apps/web/src/features/auth/components/SignInForm.tsx) and [apps/web/src/features/auth/components/SignUpForm.tsx](apps/web/src/features/auth/components/SignUpForm.tsx) accordingly. Depends on T037.
- [X] T039 [US1] Wire the Google button click to `startGoogle()` and perform a top-level navigation (`window.location.assign(authorizeUrl)`); guard against double-submit. **Inflight cross-control rule** (US3 Acceptance Scenario 5 / FR-025): while *any* auth submission on the form is in flight — password submit OR Google start — both the password submit button AND the Google button MUST be disabled until the call resolves or is cancelled by navigation; only navigation-style controls remain operable. Implement the shared inflight flag in [apps/web/src/features/auth/session.store.ts](apps/web/src/features/auth/session.store.ts) and consume it from both buttons. After the API callback redirects to `${WEB}${return_to}?auth=ok`, ensure [apps/web/src/features/auth/session.store.ts](apps/web/src/features/auth/session.store.ts) detects `?auth=ok`, calls `POST /auth/refresh`, sets the in-memory access token, and `history.replaceState`'s away the query param. Depends on T037, T038.
- [X] T040 [P] [US1] Add `en` and `pt` strings for Google flow ("Continue with Google", "Sign-in was cancelled. You can try again.", "We couldn't sign you in with Google. Please try again.", operator tooltip) to [apps/web/src/i18n/locales/en.ts](apps/web/src/i18n/locales/en.ts) and [apps/web/src/i18n/locales/pt.ts](apps/web/src/i18n/locales/pt.ts).

**Checkpoint**: User Story 1 fully functional, independently testable. MVP candidate.

---

## Phase 4: User Story 2 — Email-confirmed traditional sign-up (Priority: P1)

**Goal**: Sign-up creates an unconfirmed account, sends a 6-digit code, blocks login/protected access until confirmed; resend with cooldown + hourly cap; enumeration-resistant duplicate handling.

**Independent Test**: Sign up with a real address → 6-digit code arrives → enter it → land on home. Sign up again without confirming → protected route redirects to confirm page. Hit attempt and resend caps → generic refusal.

### Tests for User Story 2 (write before implementation)

- [X] T041 [P] [US2] Unit test [apps/api/tests/unit/identity/test_register_user.py](apps/api/tests/unit/identity/test_register_user.py) (UPDATE): brand-new email → unconfirmed user + pending confirmation; existing-unconfirmed → no second account, prior pending invalidated, fresh row, code sent (subject to caps); existing-confirmed → no code, `send_duplicate_signup_notice` called; result body identical in all three cases.
- [X] T042 [P] [US2] Unit test [apps/api/tests/unit/identity/test_confirm_email.py](apps/api/tests/unit/identity/test_confirm_email.py): success path issues session + sets `email_confirmed_at`; wrong code increments `attempt_count`; `>= MAX_ATTEMPTS` → invalidated; expired → expired; unknown email → `ConfirmationCodeInvalid`.
- [X] T043 [P] [US2] Unit test [apps/api/tests/unit/identity/test_resend_confirmation.py](apps/api/tests/unit/identity/test_resend_confirmation.py): cooldown < 60 s silent; > hourly cap silent; allowed → invalidates prior pending → inserts fresh → calls `EmailSender.send_confirmation_code`; unknown email silent; confirmed email triggers `send_duplicate_signup_notice` only.
- [X] T044 [P] [US2] Unit test [apps/api/tests/unit/identity/test_authenticate_user.py](apps/api/tests/unit/identity/test_authenticate_user.py) (UPDATE): correct password + unconfirmed → returns `UnconfirmedAccount(user_id)` typed result, no session; correct password + confirmed → unchanged.
- [X] T045 [P] [US2] Integration test [apps/api/tests/integration/identity/test_register_unconfirmed.py](apps/api/tests/integration/identity/test_register_unconfirmed.py): `POST /auth/register` returns `202 {"status":"confirmation_required"}`, no refresh cookie, no access token; DB has user with `email_confirmed_at IS NULL` + one `pending` row.
- [X] T046 [P] [US2] Integration test [apps/api/tests/integration/identity/test_confirm_email.py](apps/api/tests/integration/identity/test_confirm_email.py): full flow against fake mailer + real Postgres → `200 {accessToken,…}` + refresh cookie; subsequent `/me` reflects the user.
- [X] T047 [P] [US2] Integration test [apps/api/tests/integration/identity/test_login_blocks_unconfirmed.py](apps/api/tests/integration/identity/test_login_blocks_unconfirmed.py): correct password + unconfirmed user → `200 {"status":"confirmation_required"}` (no token, no cookie); wrong password → `401 invalid credentials` byte-identical.
- [X] T048 [P] [US2] Integration abuse-simulation in [apps/api/tests/integration/identity/test_confirm_abuse_caps.py](apps/api/tests/integration/identity/test_confirm_abuse_caps.py): 5 wrong submissions → invalidated; resend within 60 s silent; > 3 resends/hour silent; refusal body identical across all cap reasons (SC-008).
- [X] T049 [P] [US2] OpenAPI snapshot updates in [apps/api/tests/contract/test_openapi_snapshot.py](apps/api/tests/contract/test_openapi_snapshot.py) for `POST /auth/confirm`, `POST /auth/confirm/resend`, changed `POST /auth/register` (202), changed `POST /auth/login` (200 oneOf).

### Implementation for User Story 2

- [X] T050 [P] [US2] Implement `ConsoleEmailSender` in [apps/api/src/campfire_api/contexts/identity/adapters/messaging/console_email_sender.py](apps/api/src/campfire_api/contexts/identity/adapters/messaging/console_email_sender.py) implementing **both** `EmailSender` methods (`send_confirmation_code`, `send_duplicate_signup_notice`): writes the actual code (confirmation only — the duplicate notice MUST NOT contain a code) to `MAIL_OUTBOX_DIR/<ts>-<email>-<template>.txt`; logs `event=mail_sent template=… to_hash=…` to stdout — never the code, never the recipient address in plaintext. Co-located unit test [apps/api/tests/unit/identity/test_console_email_sender.py](apps/api/tests/unit/identity/test_console_email_sender.py) MUST assert (FR-019): the rendered confirmation body contains the 6-digit code and an expiry hint and NOTHING ELSE matching `password|token|user_id|confirmation_id|refresh|http(s)://`; the duplicate-notice body contains no 6-digit sequence and no internal identifier.
- [X] T051 [P] [US2] Implement `HttpEmailSender` in [apps/api/src/campfire_api/contexts/identity/adapters/messaging/http_email_sender.py](apps/api/src/campfire_api/contexts/identity/adapters/messaging/http_email_sender.py) implementing **both** `EmailSender` methods (`send_confirmation_code`, `send_duplicate_signup_notice`): vendor-agnostic JSON envelope to `MAIL_HTTP_URL` with bearer `MAIL_HTTP_API_KEY`; from `MAIL_FROM`; localized templates loaded from internal-only string tables (no DB, no FS lookup at runtime). Co-located unit test [apps/api/tests/unit/identity/test_http_email_sender.py](apps/api/tests/unit/identity/test_http_email_sender.py) MUST assert the same FR-019 body-content invariants as T050 against a recording fake transport, AND that the outbound JSON envelope never includes a Campfire `user_id`, `confirmation_id`, or refresh-token field.
- [X] T052 [US2] Wire `EmailSender` selection (`MAIL_BACKEND=console|http`) into [apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py](apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py); fail-fast in [apps/api/src/campfire_api/main.py](apps/api/src/campfire_api/main.py) on startup if `MAIL_BACKEND=http` and any required env var is missing.
- [X] T053 [US2] Refactor [apps/api/src/campfire_api/contexts/identity/application/use_cases/register_user.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/register_user.py) to: persist user with `email_confirmed_at=NULL`, persist `Credentials`, insert pending `EmailConfirmation` (HMAC-stored), call `EmailSender.send_confirmation_code`, return `RegistrationResult { user_id, confirmation_id }` (no session). For existing-confirmed: skip code, call `send_duplicate_signup_notice`. For existing-unconfirmed: invalidate prior pending, insert fresh (subject to resend caps). Depends on T010, T011, T015, T018.
- [X] T054 [US2] Implement `ConfirmEmail` use case in [apps/api/src/campfire_api/contexts/identity/application/use_cases/confirm_email.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/confirm_email.py): look up user, look up pending confirmation, constant-time HMAC compare, increment `attempt_count` on miss, transition states per data-model.md §1.5, call `IssueSession` on success, set `users.email_confirmed_at = now`. Depends on T010, T011, T015, T018, T019.
- [X] T055 [US2] Implement `ResendConfirmation` use case in [apps/api/src/campfire_api/contexts/identity/application/use_cases/resend_confirmation.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/resend_confirmation.py): cooldown + hourly-cap checks via `count_resends_in_window`, invalidate prior pending with reason `'resent'`, insert fresh pending, call `EmailSender.send_confirmation_code`. Silent caps (no error to caller). Depends on T010, T015, T018.
- [X] T056 [US2] Refactor [apps/api/src/campfire_api/contexts/identity/application/use_cases/authenticate_user.py](apps/api/src/campfire_api/contexts/identity/application/use_cases/authenticate_user.py): on correct password + `email_confirmed_at IS NULL` return `UnconfirmedAccount(user_id)` typed result; do NOT issue session. All other paths unchanged. Depends on T019.
- [X] T057 [US2] Add HTTP schemas in [apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py](apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py): `ConfirmRequest{email, code}`, `ConfirmResendRequest{email}`, `RegisterResponse` with the new `{"status":"confirmation_required"}` shape, `LoginResponse` as `oneOf({accessToken,...} | {"status":"confirmation_required"})`.
- [X] T058 [US2] Implement router [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/confirm.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/confirm.py): `POST /auth/confirm` and `POST /auth/confirm/resend` per auth-confirm.md (resend always 202; in-memory IP rate limit reuses existing limiter; DB caps silent). Sets refresh cookie on success with same attributes as login.
- [X] T059 [US2] Update [apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py](apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py) (or equivalent existing auth router): `POST /auth/register` returns `202 {"status":"confirmation_required"}` with no cookie/token; `POST /auth/login` returns `{"status":"confirmation_required"}` for the unconfirmed-but-correct-password case. Depends on T053, T056, T057.
- [X] T060 [US2] Extend [apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py](apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py): `ConfirmationCodeInvalid|Expired|AttemptsExceeded` → 400 `{"detail":"confirmation invalid"}`; `ConfirmationResendCooldown` → 429 `{"detail":"too many attempts"}` + `Retry-After`.
- [X] T061 [US2] Wire the confirm router into [apps/api/src/campfire_api/main.py](apps/api/src/campfire_api/main.py).

### Frontend for User Story 2

- [X] T062 [P] [US2] Extend [apps/web/src/features/auth/api/auth.api.ts](apps/web/src/features/auth/api/auth.api.ts) with `confirmEmail({email, code})`, `resendConfirmation({email})`, and update `register()`/`login()` discriminator handling for the new `{"status":"confirmation_required"}` body shape.
- [X] T063 [P] [US2] Implement `ConfirmEmailForm` in [apps/web/src/features/auth/components/ConfirmEmailForm.tsx](apps/web/src/features/auth/components/ConfirmEmailForm.tsx): email pre-fill, 6-digit numeric input (`inputMode="numeric"`, `autoComplete="one-time-code"`, `pattern="\d{6}"`), live validation, resend button with countdown, generic error wording.
- [X] T064 [US2] Implement `ConfirmEmailPage` at [apps/web/src/pages/ConfirmEmailPage.tsx](apps/web/src/pages/ConfirmEmailPage.tsx) hosting `ConfirmEmailForm`; on success navigates to `next` (sanitized) or `/home`.
- [X] T065 [US2] Add `'unconfirmed'` branch + `confirm`/`resend` actions to [apps/web/src/features/auth/session.store.ts](apps/web/src/features/auth/session.store.ts); on register/login response with `{"status":"confirmation_required"}`, transition to `unconfirmed` and route to `/confirm?email=…`. Depends on T062.
- [X] T066 [US2] Update routing in [apps/web/src/app/router/routes.ts](apps/web/src/app/router/routes.ts) (add `'confirm'`) and [apps/web/src/app/router/guards.tsx](apps/web/src/app/router/guards.tsx) (when state is `unconfirmed`, protected routes redirect to `/confirm?email=…`). Depends on T065.
- [X] T067 [US2] Update [apps/web/src/features/auth/components/SignUpForm.tsx](apps/web/src/features/auth/components/SignUpForm.tsx) to advance to the confirm step on `202 confirmation_required` (no token expected). Depends on T062.
- [X] T068 [US2] Update [apps/web/src/features/auth/components/SignInForm.tsx](apps/web/src/features/auth/components/SignInForm.tsx) to surface a "We sent you a confirmation code — resend it?" affordance only when the response shape is `{"status":"confirmation_required"}` (per US2 Acceptance Scenario 3); never reveal the unconfirmed state from a generic 401.
- [X] T069 [P] [US2] Add localized strings for confirmation flow (subject, code-entry copy, resend cooldown, generic refusal, success notice, "someone tried to sign up" notice mentions) to [apps/web/src/i18n/locales/en.ts](apps/web/src/i18n/locales/en.ts) and [apps/web/src/i18n/locales/pt.ts](apps/web/src/i18n/locales/pt.ts).

**Checkpoint**: User Story 2 functional + independently testable.

---

## Phase 5: User Story 3 — Hardened email + password login UX (Priority: P2)

**Goal**: Stricter live validation aligned with backend, password visibility toggle (focus-preserving, ARIA-announced), enumeration-safe error messaging, loading/disabled states.

**Independent Test**: Type invalid email → inline guidance; weak password → strength feedback + submission refused; toggle visibility → value readable, focus retained, screen reader announces; wrong password vs unknown email vs Google-only → identical message.

### Tests for User Story 3

- [X] T070 [P] [US3] Validation parity is enforced **on the backend** (no frontend test runner is added in this slice — see plan §Testing and Constitution IV). Author exhaustive cases for the email + password rules in [apps/api/tests/unit/identity/test_validation_rules.py](apps/api/tests/unit/identity/test_validation_rules.py) (covers `Email` VO whitespace/syntax cases and `Password` VO length ≥ 10, ≥ 3 of 4 char classes, common-pw blocklist hits) and have [apps/web/src/features/auth/validation.ts](apps/web/src/features/auth/validation.ts) consume the rules JSON exported in T075 so the client cannot drift from the server's truth. Manually verify on the live forms during T095.
- [X] T071 [P] [US3] Backend integration test `apps/api/tests/integration/identity/test_no_enumeration.py` (UPDATE existing if present, else create): `wrong-password`, `unknown-email`, `Google-only-no-credentials`, `unconfirmed-with-wrong-password` all produce **byte-identical** 401 body and headers (FR-024, SC-003).

### Implementation for User Story 3

- [X] T072 [P] [US3] Implement [apps/web/src/features/auth/components/PasswordField.tsx](apps/web/src/features/auth/components/PasswordField.tsx): `<input type="password|text">` with a `lucide-react` eye/eye-off toggle button; preserves focus + caret on toggle; toggle is keyboard-operable (`<button type="button">`, `aria-pressed`, `aria-label` localized); default state hidden.
- [X] T073 [P] [US3] Implement [apps/web/src/features/auth/components/PasswordStrengthHint.tsx](apps/web/src/features/auth/components/PasswordStrengthHint.tsx): live indicator driven by the rules in T074; ARIA-live polite.
- [X] T074 [US3] Strengthen [apps/web/src/features/auth/validation.ts](apps/web/src/features/auth/validation.ts): mirror backend `Email` (no leading/trailing whitespace, basic syntax, length 3–320) and `Password` rules (length ≥ 10, ≥ 3 of 4 char classes, common-pw blocklist) — kept in sync via a small JSON exported by the backend domain (see T075). Existing logged-in users are unaffected (server enforces only at sign-up). Depends on T008.
- [X] T075 [US3] Export password rules JSON from the backend domain at [apps/api/src/campfire_api/contexts/identity/domain/password_rules.py](apps/api/src/campfire_api/contexts/identity/domain/password_rules.py) and serve a small file or constant import for the SPA so client/server stay in lockstep. Depends on T008.
- [X] T076 [US3] Update [apps/web/src/features/auth/components/SignInForm.tsx](apps/web/src/features/auth/components/SignInForm.tsx) and [apps/web/src/features/auth/components/SignUpForm.tsx](apps/web/src/features/auth/components/SignUpForm.tsx): use `PasswordField` (and `PasswordStrengthHint` on sign-up); generic 401 wording; loading spinner on the active control; double-submit guarded. Both forms MUST consume the shared inflight flag from T039 so that a password submission disables the "Continue with Google" button and vice versa for the duration of the request (US3 Acceptance Scenario 5 / FR-025); navigation-style controls remain operable for cancel/navigate. Depends on T039, T072, T073, T074.
- [X] T077 [P] [US3] Add localized strings: validation messages, "Show password" / "Hide password" ARIA labels, generic credential error, loading text. [apps/web/src/i18n/locales/en.ts](apps/web/src/i18n/locales/en.ts) and [apps/web/src/i18n/locales/pt.ts](apps/web/src/i18n/locales/pt.ts).

**Checkpoint**: User Story 3 functional + independently testable.

---

## Phase 6: User Story 4 — Predictable redirects across the auth lifecycle (Priority: P2)

**Goal**: Same-origin `next=` redirect handling across sign-in, sign-up, Google callback, confirm, sign-out; deep-link return; reject unsafe targets.

**Independent Test**: Open a protected URL while logged out → after auth, return there. Sign out → land on `/`. Sign-up via Google or email+code → `/home`. `next=https://evil.com` → ignored.

### Tests for User Story 4

- [X] T078 [P] [US4] Same-origin sanitizer parity is enforced **on the backend** (no frontend test runner is added — see T070 note). The authoritative sanitizer test is the backend-side [apps/api/tests/unit/identity/test_next_sanitizer.py](apps/api/tests/unit/identity/test_next_sanitizer.py): accepts `/repertoire`; rejects `//evil.com`, `https://evil.com`, `javascript:…`, paths containing `://`, empty/`null`. Frontend [apps/web/src/features/auth/redirect.ts](apps/web/src/features/auth/redirect.ts) MUST mirror these rules byte-for-byte (manually verified during T095). Server is the source of truth — see FR-027.
- [X] T079 [P] [US4] Backend unit/integration test `apps/api/tests/integration/identity/test_google_next_param.py`: `POST /auth/google/start` with `next=//evil.com` → server-side dropped (callback redirects to `/home`, not `/evil.com`). With safe `next=/repertoire` → callback redirects to `${WEB}/repertoire?auth=ok`.

### Implementation for User Story 4

- [X] T080 [P] [US4] Implement [apps/web/src/features/auth/redirect.ts](apps/web/src/features/auth/redirect.ts): `sanitizeNext(raw: string|null|undefined): string | null` — same rules as the backend (`/`-prefix, no `//`, no `://`).
- [X] T081 [US4] In [apps/web/src/app/App.tsx](apps/web/src/app/App.tsx) (or wherever protected-route interception lives): when an unauthenticated user is bounced, capture the originally requested path via `sanitizeNext(location.pathname + location.search)` into `localStorage` AND, for the Google flow, pass it as `next` to `startGoogle({ next })`. After successful sign-in (any path), pop `localStorage` and navigate. Depends on T080.
- [X] T082 [US4] Confirm-email success destination uses `sanitizeNext` (from query param `?next=`) or `/home`. Update [apps/web/src/pages/ConfirmEmailPage.tsx](apps/web/src/pages/ConfirmEmailPage.tsx) accordingly. Depends on T080, T064.
- [X] T083 [US4] Sign-out: in [apps/web/src/features/auth/session.store.ts](apps/web/src/features/auth/session.store.ts) and the sign-out trigger, navigate to `/` after `POST /auth/logout` resolves; clear in-memory access token before navigation; ensure no flash of authenticated content (route guard re-checks before render).
- [X] T084 [US4] Server-side `next` re-validation lives in `StartGoogleSignIn` (T029) and the callback handler (T032) — verify both paths drop unsafe values. (No new file; cross-link to T079 fixture.)

**Checkpoint**: All four user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, no-secret-leakage verification, accessibility, deployment, regression coverage.

### Documentation

- [X] T085 [P] Update [docs/identity/overview.mdx](docs/identity/overview.mdx) with the new flows (Google + email confirmation) and the unchanged refresh-cookie scoping.
- [X] T086 [P] Author [docs/identity/google-oauth.mdx](docs/identity/google-oauth.mdx): local Google Cloud sandbox setup, redirect URIs, env vars, environment-per-project rule, troubleshooting; lifted from quickstart.md §2/§5/§9.
- [X] T087 [P] Author [docs/identity/email-confirmation.mdx](docs/identity/email-confirmation.mdx): code lifecycle, attempt/resend caps, mailer port + ConsoleEmailSender + HttpEmailSender, env vars, troubleshooting.
- [X] T088 [P] Author [docs/identity/runbook-disable-google.mdx](docs/identity/runbook-disable-google.mdx): one-flag rollback (`GOOGLE_OAUTH_ENABLED=false`); confirms password auth keeps working. Add a sibling section "Disabling email confirmation in an incident" describing `EMAIL_CONFIRMATION_REQUIRED=false` as an **incident-only, time-bounded** escape hatch that violates FR-013 by design — list re-enable steps, the startup `WARNING` to grep for, and the rule that the flag MUST be flipped back within the incident window.
- [X] T089 [P] Update [docs/identity/env-vars.mdx](docs/identity/env-vars.mdx) with all new vars from T004 and their defaults/format.
- [X] T090 [P] Update [docs/operations/render-secrets.mdx](docs/operations/render-secrets.mdx) with secret-management guidance for Google client secrets, mailer keys, and the two HMAC keys (per-environment, never shared).
- [X] T091 [P] Update [AGENTS.md](AGENTS.md) inside the `<!-- SPECKIT -->` markers to point at this plan/spec.

### No-secret-leakage + regression coverage

- [X] T092 [P] Update [apps/api/tests/integration/identity/test_no_secret_leakage.py](apps/api/tests/integration/identity/test_no_secret_leakage.py): assert no plaintext code, no Google id_token, no refresh token, no Google client secret, no HMAC key appears in any response body, header, or captured log line across the new + changed endpoints (FR-036).
- [X] T093 [P] Regression coverage: confirm `POST /auth/refresh`, `POST /auth/logout`, `GET /me`, repertoire-protected routes, and the seeded mock-user login still pass. Existing tests under [apps/api/tests/integration/](apps/api/tests/integration/) MUST continue green. Add [apps/api/tests/integration/identity/test_existing_users_unaffected.py](apps/api/tests/integration/identity/test_existing_users_unaffected.py) covering FR-026 + FR-030 + SC-005: (a) issue a refresh-token + access-token pair against the *pre-migration* schema (or a row whose `email_confirmed_at` is backfilled from `created_at`), run `alembic upgrade head` to apply `0003`, then assert `POST /auth/refresh` with the original cookie still mints a fresh access token and rotates the refresh family normally; (b) authenticate a pre-existing user with their original (potentially short, < 10 char) password and assert `200 IssuedSession` — the new password rules MUST NOT block existing-row login.

### Frontend regression + a11y

- [X] T094 [P] Run `npm run typecheck` and `npm run build` from [apps/web/](apps/web/); fix any type errors introduced by the new shapes; add a small build-check task to CI if not already present.
- [X] T094a [P] Add a static i18n-coverage check (SC-004): a small Node script under [apps/web/scripts/check-i18n.mjs](apps/web/scripts/check-i18n.mjs) that greps `t('…')` / `i18n('…')` call-sites under `apps/web/src/features/auth/` + `apps/web/src/pages/ConfirmEmailPage.tsx` and asserts every key resolves in **both** [apps/web/src/i18n/locales/en.ts](apps/web/src/i18n/locales/en.ts) and [apps/web/src/i18n/locales/pt.ts](apps/web/src/i18n/locales/pt.ts). Wire as `npm run check:i18n` and run alongside `npm run build` in T094 / CI. Failure mode: list the missing keys per locale and exit non-zero. No new test runner required.
- [ ] T095 Manually verify keyboard-only traversal + screen reader announcements on `/signin`, `/signup`, `/confirm`, post-logout `/`, and post-Google `?auth=ok`, plus a one-handed-reach + no-horizontal-scroll mobile-viewport sweep at 360×640 (covers FR-033). Run Lighthouse Accessibility against the same five surfaces and confirm score ≥ 95 (SC-007). Manual verification is acceptable here under Constitution IV (Proportional Rigor) — automating Lighthouse for a solo MVP is not justified. Capture screenshots and Lighthouse numbers in the PR description; if any surface scores < 95, file a follow-up task before merge.

### Deployment

- [ ] T096 Verify `render.yaml` declares all new vars from T004 with `sync: false` for secrets; manually populate values in Render dashboard for `dev` and `prod` environments per quickstart.md §8. Per-environment HMAC keys MUST be distinct.
- [X] T097 Run [apps/api/alembic/](apps/api/alembic/) `upgrade head` against a copy of staging data (or local snapshot) and confirm the backfill (`email_confirmed_at = created_at`) populates every existing row; run `downgrade -1` then `upgrade head` and confirm idempotency on the user column (pending confirmations / provider links not preserved on down — expected).
- [ ] T098 Validate quickstart.md §5 + §6 end-to-end against a local stack and a sandbox Render `dev` deploy; record observations in the PR.

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup) — no dependencies.
- Phase 2 (Foundational) — depends on Phase 1; **blocks all user stories**.
- Phase 3 (US1), Phase 4 (US2), Phase 5 (US3), Phase 6 (US4) — each depends on Phase 2; otherwise mutually independent and can run in parallel by separate implementers.
- Phase 7 (Polish) — depends on the user-story phases that ship in the cut.

### User Story Dependencies

- US1 (Google) — depends only on Phase 2. Independent of US2/US3/US4.
- US2 (Email confirmation) — depends only on Phase 2. Independent of US1, but Phase 3's account-linking matrix (T030) consumes `EmailConfirmationRepository.invalidate_pending_for` — when both ship, US1's "miss-subject + hit-unconfirmed-email" path must be covered (T024 / T030). If US2 lands first, US1's linker still works against an empty confirmations table.
- US3 (Hardened password UX) — independent of US1/US2/US4 except for the shared `Password` VO strengthening (T008) which is foundational.
- US4 (Redirects) — independent; the same-origin sanitizer is consumed by US1's Google start/callback (already covered by T029/T032/T084). If US4 ships first, US1 picks up the sanitizer; if US1 ships first, the sanitizer is added retroactively as part of US4 with no behavior regression.

### Within Each User Story

- Tests are written and failing before implementation (per FR-035 + project's TDD-leaning convention).
- Domain VOs/entities → ports → adapters (security/messaging/oauth/persistence) → use cases → HTTP routers → frontend.
- No backwards-compat shims; old `/auth/google-stub` stays only because tests currently use it (default `false`).

### Parallel Opportunities

- All `[P]` tasks in Phase 1 and Phase 2 are file-disjoint and can run in parallel.
- All test tasks `[P]` within a user-story phase can be drafted in parallel.
- All four user stories can be staffed in parallel after Phase 2 completes (subject to the dependency notes above).
- Polish documentation tasks (T085–T091) are file-disjoint and parallelizable.

---

## Parallel Example: User Story 1

```bash
# After Phase 2 completes, kick off the US1 test suite in parallel:
#   T022 test_start_google_sign_in.py
#   T023 test_complete_google_sign_in.py
#   T024 test_account_linking.py
#   T025 test_google_oauth.py (integration)
#   T026 test_google_disabled_falls_back.py (integration)
#   T027 OpenAPI snapshot update
# Then in parallel:
#   T028 GoogleIdentityProvider adapter
#   T037 web auth.api.ts changes
#   T040 i18n strings
# Sequence the wiring:
#   T029 → T030 → T031 → T032 → T033 → T034 → T035 → T036
# Frontend wiring sequence:
#   T038 → T039
```

---

## Implementation Strategy

**MVP scope**: Phase 1 + Phase 2 + Phase 3 (US1) + the spec-mandated subset of Phase 4 needed to ship the account model coherently (per spec §User Story 2 priority note: "Confirmation must ship together with Google to keep the account model consistent"). In practice, ship Phases 1–4 together as the MVP; Phases 5–6 follow as quality-of-life increments; Phase 7 lands alongside the MVP cut.

**Incremental delivery**:

1. **Cut 1 (MVP)**: Phases 1–4 + the Polish items required for production readiness (T092, T093, T094, T096, T097). Behind `GOOGLE_OAUTH_ENABLED` and `EMAIL_CONFIRMATION_REQUIRED` flags so each can be toggled independently.
2. **Cut 2**: Phase 5 (hardened UX) — independently shippable.
3. **Cut 3**: Phase 6 (redirects) — independently shippable.
4. **Cut 4**: Remaining Phase 7 polish (docs, runbook, a11y signoff).

**Rollback**: `GOOGLE_OAUTH_ENABLED=false` removes the Google surface; `EMAIL_CONFIRMATION_REQUIRED=false` reverts register to legacy session issuance. Both are env-only, no redeploy code change.
