# Tasks: Auth Hardening Wave 1

**Input**: Design documents from `/specs/007-auth-hardening-wave1/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by the feature specification and the user-provided Wave 1 grouping. Test tasks are placed after the implementation they verify unless they are pure contract/docs checks.

**Organization**: Dependency-ordered by plumbing group and independently testable user story. Audit IDs are included in descriptions for traceability but do not control ordering.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel after prerequisites because it touches isolated files or behavior.
- **[Story]**: Maps to the user stories in `spec.md`.
- Setup, foundational, and polish tasks do not carry story labels.
- Every task includes exact file paths.

## Phase 1: Setup - Settings and Lifespan Plumbing

**Purpose**: Add configuration surface and fail-closed startup checks before behavior depends on them.

- [X] T001 Add `trusted_proxies()` to `SettingsProvider` in `apps/api/src/campfire_api/settings.py`
- [X] T002 Add `TRUSTED_PROXIES` parsing to `EnvSettings` and `EnvSettingsProvider` with an empty-list default and CIDR/IP normalization in `apps/api/src/campfire_api/settings.py`
- [X] T003 [P] Add unit coverage for empty, comma-separated, IPv4, IPv6, and invalid `TRUSTED_PROXIES` values in `apps/api/tests/unit/test_settings.py`
- [X] T004 Add `TRUSTED_PROXIES=` to local development env examples in `apps/api/.env.example`
- [X] T005 Add or explicitly document the Render develop `TRUSTED_PROXIES` setting for `campfire-api-dev` in `render.yaml`
- [X] T006 Add or explicitly document the Render production `TRUSTED_PROXIES` setting for `campfire-api-prod` in `render.yaml`
- [X] T007 Add production lifespan validation for missing `EMAIL_CONFIRMATION_HMAC_KEY` in `apps/api/src/campfire_api/main.py`
- [X] T008 Add production lifespan validation for missing `OAUTH_FLOW_HMAC_KEY` in `apps/api/src/campfire_api/main.py`

**Checkpoint**: Settings flow through the existing provider boundary, local defaults trust no proxy, and production startup can reject missing HMAC secrets.

## Phase 2: Foundational - Adapter Helpers

**Purpose**: Shared HTTP adapter behavior used by multiple findings.

**Critical**: Complete Phase 1 before Phase 2. Complete Phase 2 before US2 and US4.

- [X] T009 Implement the settings-aware `client_ip(request, settings)` resolver with stdlib `ipaddress` in `apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py`
- [X] T010 Add unit coverage for `client_ip` direct peer fallback, empty trusted proxy list, trusted immediate peer, untrusted immediate peer, malformed `X-Forwarded-For`, and all-trusted chain fallback in `apps/api/tests/unit/identity/test_http_deps.py`
- [X] T011 Update login/register rate-limit calls to pass settings into `client_ip` in `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py`
- [X] T012 Update confirm/resend rate-limit calls to pass settings into `client_ip` in `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/confirm.py`
- [X] T013 Implement `require_same_origin` against parsed `cors_origins` with 403 and the existing error envelope in `apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py`
- [X] T014 Document the absent-Origin and same-origin heuristic in the `require_same_origin` code comment or docstring in `apps/api/src/campfire_api/contexts/identity/adapters/http/deps.py`
- [X] T015 Wire `require_same_origin` into `POST /auth/refresh` while preserving `require_refresh_cookie` in `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py`
- [X] T016 Wire `require_same_origin` into `POST /auth/logout` while preserving `require_refresh_cookie` in `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/auth.py`

**Checkpoint**: Shared request IP and Origin helpers are ready for story-specific behavior.

## Phase 3: User Story 1 - Prevent Google Account Impersonation (Priority: P1)

**Goal**: A verified Google sign-in safely promotes an unconfirmed password account and makes the former password unusable.

**Independent Test**: Register an unconfirmed password account, complete Google sign-in for the same verified email, then assert the original password fails, the credentials row is absent, and one promotion notice was sent.

- [X] T017 [US1] Add `CredentialsRepository.delete_for_user(user_id)` to the domain port in `apps/api/src/campfire_api/contexts/identity/domain/ports.py`
- [X] T018 [US1] Implement `delete_for_user(user_id)` in `apps/api/src/campfire_api/contexts/identity/adapters/persistence/credentials_repository.py`
- [X] T019 [US1] Add `delete_for_user(user_id)` to identity test fakes in `apps/api/tests/unit/identity/fakes.py`
- [X] T020 [US1] Add a transactional Google-promotion notice method to `EmailSender` in `apps/api/src/campfire_api/contexts/identity/domain/ports.py`
- [X] T021 [US1] Implement the Google-promotion notice method in `apps/api/src/campfire_api/contexts/identity/adapters/messaging/console_email_sender.py`
- [X] T022 [US1] Implement the Google-promotion notice method in `apps/api/src/campfire_api/contexts/identity/adapters/messaging/http_email_sender.py`
- [X] T023 [US1] Inject credentials and email sender dependencies into `CompleteGoogleSignIn` construction in `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py`
- [X] T024 [US1] Delete stale credentials inside the unconfirmed promotion branch in `apps/api/src/campfire_api/contexts/identity/application/use_cases/complete_google_sign_in.py`
- [X] T025 [US1] Send exactly one transactional promotion notice after successful unconfirmed promotion in `apps/api/src/campfire_api/contexts/identity/application/use_cases/complete_google_sign_in.py`
- [X] T026 [P] [US1] Add unit coverage for credential deletion and promotion notice in `apps/api/tests/unit/identity/test_complete_google_sign_in.py`
- [X] T027 [P] [US1] Add `test_account_takeover_after_google_promotion` integration coverage in `apps/api/tests/integration/identity/test_account_takeover_after_google_promotion.py`

**Checkpoint**: US1 is independently verifiable and old password credentials cannot authenticate after Google promotion.

## Phase 4: User Story 2 - Preserve Per-Attacker Rate Limits (Priority: P1)

**Goal**: Auth rate limits use resolved client IPs only through trusted proxies, and Google OAuth start is rate-limited.

**Independent Test**: Configure `TRUSTED_PROXIES`, send simulated `X-Forwarded-For` chains, verify independent budgets, then verify the 11th Google-start call returns 429 with `Retry-After`.

- [X] T028 [US2] Add integration coverage for trusted-proxy rate-limit separation in `apps/api/tests/integration/identity/test_rate_limit_xff.py`
- [X] T029 [US2] Add integration coverage for ignoring spoofed `X-Forwarded-For` when the immediate peer is untrusted in `apps/api/tests/integration/identity/test_rate_limit_xff.py`
- [X] T030 [US2] Add rate-limit dependency plumbing to `POST /auth/google/start` in `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py`
- [X] T031 [US2] Key Google-start rate limiting by `(client_ip(request, settings), "google_start")` using the existing `InMemoryRateLimiter` in `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py`
- [X] T032 [P] [US2] Add Google-start 429 and `Retry-After` integration coverage in `apps/api/tests/integration/identity/test_google_start_rate_limit.py`

**Checkpoint**: US2 is independently verifiable without adding a new limiter or new settings.

## Phase 5: User Story 3 - Keep Registration Enumeration-Safe (Priority: P1)

**Goal**: Domain-weak passwords produce controlled, byte-identical registration responses for known confirmed, known unconfirmed, and unknown emails.

**Independent Test**: Submit the same valid-Pydantic but domain-weak password across the three-email matrix and compare status codes and response bytes.

- [X] T033 [US3] Add an `InvalidRegistration` domain error or equivalent registration-safe identity error in `apps/api/src/campfire_api/contexts/identity/application/errors.py`
- [X] T034 [US3] Map the registration-safe identity error to HTTP 400 with the existing generic confirmation-required body shape in `apps/api/src/campfire_api/contexts/identity/adapters/http/error_mapping.py`
- [X] T035 [US3] Validate `Password(password)` before any `RegisterUser` branch decisions in `apps/api/src/campfire_api/contexts/identity/application/use_cases/register_user.py`
- [X] T036 [US3] Translate `Password()` `ValueError` into the registration-safe identity error in `apps/api/src/campfire_api/contexts/identity/application/use_cases/register_user.py`
- [X] T037 [P] [US3] Add `test_register_enumeration_matrix` for known confirmed, known unconfirmed, and unknown emails in `apps/api/tests/integration/identity/test_register_enumeration_matrix.py`

**Checkpoint**: US3 preserves no-enumeration behavior and prevents password-rule `ValueError` from escaping.

## Phase 6: User Story 4 - Block Cross-Origin Session Mutation (Priority: P1)

**Goal**: Hostile origins cannot rotate refresh tokens or revoke sessions through cookie-backed refresh/logout requests.

**Independent Test**: Cross-origin `POST /auth/refresh` and `POST /auth/logout` return 403 before mutation; allowed-origin requests still work.

- [X] T038 [US4] Add cross-origin refresh rejection coverage that proves no rotation occurs in `apps/api/tests/integration/identity/test_refresh_csrf.py`
- [X] T039 [US4] Add cross-origin logout rejection coverage that proves no session or family revocation occurs in `apps/api/tests/integration/identity/test_refresh_csrf.py`
- [X] T040 [P] [US4] Add allowed-origin refresh/logout coverage to protect existing behavior in `apps/api/tests/integration/identity/test_refresh_csrf.py`

**Checkpoint**: US4 is verified against the Phase 2 Origin dependency.

## Phase 7: User Story 5 - Fail Closed on Unsafe Production Configuration (Priority: P1)

**Goal**: Production startup refuses missing email-confirmation or OAuth flow HMAC keys while development behavior remains usable.

**Independent Test**: `create_app()` with a mocked settings provider raises in prod for each missing-key combination and succeeds with both keys set.

- [X] T041 [US5] Add `create_app()` lifespan unit coverage for missing `EMAIL_CONFIRMATION_HMAC_KEY` in prod in `apps/api/tests/unit/identity/test_lifespan_fail_closed.py`
- [X] T042 [US5] Add `create_app()` lifespan unit coverage for missing `OAUTH_FLOW_HMAC_KEY` in prod in `apps/api/tests/unit/identity/test_lifespan_fail_closed.py`
- [X] T043 [P] [US5] Add non-production and fully configured production startup coverage in `apps/api/tests/unit/identity/test_lifespan_fail_closed.py`

**Checkpoint**: US5 is verified against the Phase 1 lifespan guard.

## Phase 8: User Story 6 - Align Auth Configuration Contract (Priority: P2)

**Goal**: API, frontend, contracts, and public docs agree on the nested `passwordSignUp` config shape.

**Independent Test**: `GET /auth/config` returns `{ google: { enabled }, passwordSignUp: { enabled, requiresEmailConfirmation } }`, and frontend consumers typecheck against the nested shape.

- [X] T044 [US6] Add `PasswordSignUpConfig` and nest `AuthConfigResponse.passwordSignUp` in `apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py`
- [X] T045 [US6] Populate `passwordSignUp.enabled` and `passwordSignUp.requiresEmailConfirmation` from settings in `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/config.py`
- [X] T046 [P] [US6] Add nested auth config response coverage in `apps/api/tests/integration/identity/test_auth_config_shape.py`
- [X] T047 [US6] Update the frontend `AuthConfig` type to the nested shape in `apps/web/src/features/auth/api/auth.api.ts`
- [X] T048 [US6] Update the `useSessionStore` auth-config fallback and all grepped `passwordSignUp` readers in `apps/web/src/features/auth/session.store.ts`
- [X] T049 [P] [US6] Verify and update auth config contract wording in `specs/006-google-auth-login-ux/contracts/auth-config.md`
- [X] T050 [P] [US6] Verify Google-start rate-limit wording already documents 429 and `Retry-After` in `specs/006-google-auth-login-ux/contracts/auth-google.md`
- [X] T051 [P] [US6] Update registration no-enumeration and Origin rejection wording if needed in `specs/006-google-auth-login-ux/contracts/auth-changed.md`

**Checkpoint**: US6 is independently verifiable through API contract tests and frontend typecheck.

## Phase 9: User Story 7 - Keep Email Confirmation Writes Atomic (Priority: P2)

**Goal**: Confirmation row changes and user confirmation changes commit or roll back as a single request-scoped unit of work.

**Independent Test**: Force an exception after confirmation-row mutation and assert the real session rollback leaves both rows unchanged.

- [X] T052 [US7] Remove inline `session.commit()` from `update()` in `apps/api/src/campfire_api/contexts/identity/adapters/persistence/email_confirmation_repository.py`
- [X] T053 [US7] Remove inline `session.commit()` from `invalidate_pending_for()` in `apps/api/src/campfire_api/contexts/identity/adapters/persistence/email_confirmation_repository.py`
- [X] T054 [P] [US7] Add forced post-update exception rollback coverage in `apps/api/tests/unit/identity/test_email_confirmation_repository_no_inline_commit.py`
- [X] T055 [P] [US7] Add forced post-invalidate exception rollback coverage in `apps/api/tests/unit/identity/test_email_confirmation_repository_no_inline_commit.py`

**Checkpoint**: US7 is independently verifiable with a real session rollback.

## Phase 10: Contracts, Docs, and Verification

**Purpose**: Regenerate snapshots, update operator documentation, and run verification after all selected code changes land.

- [X] T056 Regenerate the OpenAPI snapshot in `specs/002-backend-auth-slice/contracts/openapi.json`
- [X] T057 Note that OpenAPI snapshot relocation is Q-2 Wave 2, not Wave 1, in `specs/007-auth-hardening-wave1/quickstart.md`
- [X] T058 [P] Update `TRUSTED_PROXIES`, HMAC key hard requirements, and `EMAIL_CONFIRMATION_REQUIRED=false` rollback language in `docs/identity/env-vars.mdx`
- [X] T059 [P] Update Render secret sequencing so HMAC keys are set before production deploy in `docs/operations/render-secrets.mdx`
- [X] T060 [P] Verify `docs/identity/runbook-disable-google.mdx` exists and update it for Wave 1 rollback/runbook language, creating the file only if missing
- [X] T061 [P] Update `specs/007-auth-hardening-wave1/quickstart.md` with the eight short manual checks from `specs/007-auth-hardening-wave1/plan.md`
- [X] T062 Run backend verification commands from `specs/007-auth-hardening-wave1/quickstart.md` and record results in `specs/007-auth-hardening-wave1/quickstart.md`
- [X] T063 Run frontend typecheck/build for the auth config change and record results in `specs/007-auth-hardening-wave1/quickstart.md`
- [ ] T064 Run the manual quickstart at 360px and 1440px and document any UX surprise in `specs/007-auth-hardening-wave1/quickstart.md`

**Out of Scope Guard**: Do not include Q-5 (`test_register_rate_limit` password-strength fixture fix), Q-2 OpenAPI relocation, or any other Wave 2 audit item.

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No prerequisites. Blocks Phase 2, US2, US5, docs, and Render verification.
- **Phase 2 (Foundational)**: Depends on Phase 1. Blocks US2 and US4.
- **US1 (Phase 3)**: Can start after Phase 1. T024-T025 depend on T017-T023.
- **US2 (Phase 4)**: Depends on Phases 1 and 2. T032 depends on T030-T031.
- **US3 (Phase 5)**: Can start after Phase 1. T035-T036 depend on T033-T034.
- **US4 (Phase 6)**: Depends on Phase 2.
- **US5 (Phase 7)**: Depends on T007-T008.
- **US6 (Phase 8)**: Can start after Phase 1. T047-T048 depend on T044-T045. T056 depends on T044-T045.
- **US7 (Phase 9)**: Can start after Phase 1. T054-T055 depend on T052-T053.
- **Phase 10 (Contracts, Docs, Verification)**: T056 waits for API schema/route changes. T062-T064 run last.

### Story Dependencies

- **US1 (P1)**: Independent after settings are available.
- **US2 (P1)**: Requires trusted-proxy settings and adapter IP helper.
- **US3 (P1)**: Independent after settings are available.
- **US4 (P1)**: Requires the shared same-origin dependency.
- **US5 (P1)**: Requires lifespan HMAC guards.
- **US6 (P2)**: Backend schema/router changes precede frontend type updates and OpenAPI regeneration.
- **US7 (P2)**: Independent repository/unit-of-work fix.

### Parallel Opportunities

- After Phase 1, US1, US3, US5, US6, and US7 can proceed in parallel.
- After Phase 2, US2 and US4 can proceed in parallel.
- T003, T026, T027, T032, T037, T040, T043, T046, T049-T051, T054-T055, and T058-T061 are parallel-friendly once prerequisites are met.
- T056 must wait for API schema/route changes. T062-T064 must run after all selected implementation, docs, and snapshot tasks.

## Parallel Examples

### After Phase 1

```bash
Task: "T017 Add CredentialsRepository.delete_for_user(user_id) to the domain port..."
Task: "T033 Add an InvalidRegistration domain error..."
Task: "T044 Add PasswordSignUpConfig..."
Task: "T052 Remove inline session.commit() from update()..."
```

### After Phase 2

```bash
Task: "T028 Add integration coverage for trusted-proxy rate-limit separation..."
Task: "T030 Add rate-limit dependency plumbing to POST /auth/google/start..."
Task: "T038 Add cross-origin refresh rejection coverage..."
```

### Documentation and Contracts

```bash
Task: "T049 Verify and update auth config contract wording..."
Task: "T058 Update TRUSTED_PROXIES, HMAC key hard requirements..."
Task: "T061 Update quickstart.md with the eight short manual checks..."
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete P1 stories: US1, US2, US3, US4, and US5.
3. Run the focused tests for each P1 story before moving to P2 cleanup.

### Incremental Delivery

1. Land settings and adapter plumbing.
2. Land each P1 story with its focused test.
3. Land P2 auth-config and repository atomicity stories.
4. Regenerate OpenAPI and update docs.
5. Run final verification and manual checks at 360px and 1440px.

### Scope Discipline

- Keep OpenAPI snapshot at `specs/002-backend-auth-slice/contracts/openapi.json` for Wave 1.
- Leave Q-2 snapshot relocation and Q-5 register-rate-limit password fixture cleanup for Wave 2.
- Avoid new dependencies, new auth product surfaces, and refresh cookie attribute changes.
