# Tasks: Auth Bootstrap

**Input**: Design documents from `/specs/001-auth-bootstrap/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Testing is included because the feature spec and implementation plan both require independently testable user stories, contract coverage, integration coverage, browser flow validation, and deployment smoke checks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend app: `apps/web/`
- Backend app: `apps/api/`
- Shared contracts: `apps/shared/contracts/`
- Infrastructure: `infra/terraform/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the monorepo surfaces and base tool configuration defined by the implementation plan.

- [X] T001 Create the workspace skeleton for `apps/web/`, `apps/api/`, `apps/shared/contracts/`, `infra/terraform/`, and `docs/adr/`
- [X] T002 Initialize the frontend package and TypeScript app config in `apps/web/package.json`, `apps/web/tsconfig.json`, and `apps/web/vite.config.ts`
- [X] T003 [P] Initialize the backend package and Python tooling config in `apps/api/pyproject.toml` and `apps/api/pytest.ini`
- [X] T004 [P] Create frontend and backend environment templates in `apps/web/.env.example` and `apps/api/.env.example`
- [X] T005 [P] Add shared developer tooling config in `.editorconfig`, `.gitignore`, and `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared foundations that block all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Bootstrap the encrypted Terraform state module in `infra/terraform/modules/tf_state/main.tf`, `infra/terraform/modules/tf_state/variables.tf`, and `infra/terraform/modules/tf_state/outputs.tf`
- [X] T007 [P] Create the dev environment Terraform skeleton in `infra/terraform/environments/dev/main.tf`, `infra/terraform/environments/dev/providers.tf`, `infra/terraform/environments/dev/variables.tf`, `infra/terraform/environments/dev/outputs.tf`, and `infra/terraform/environments/dev/versions.tf`
- [X] T008 [P] Create the backend application skeleton in `apps/api/src/domain/user/models.py`, `apps/api/src/application/user_context/service.py`, `apps/api/src/infrastructure/http/__init__.py`, and `apps/api/src/main/handler.py`
- [X] T009 [P] Create the frontend app skeleton in `apps/web/src/app/App.tsx`, `apps/web/src/app/router.tsx`, `apps/web/src/features/auth/config.ts`, and `apps/web/src/features/me/useMe.ts`
- [X] T010 [P] Create shared test runner configuration in `apps/web/vitest.config.ts`, `apps/web/playwright.config.ts`, and `apps/api/tests/conftest.py`
- [X] T011 [P] Publish the approved API contract to the implementation tree in `apps/shared/contracts/auth-bootstrap-api.openapi.yaml`
- [X] T012 Configure backend settings and structured logging bootstrap in `apps/api/src/main/settings.py` and `apps/api/src/main/logging.py`
- [X] T013 Configure frontend environment loading and API client bootstrap in `apps/web/src/lib/env.ts` and `apps/web/src/lib/http.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Reach and enter the application securely (Priority: P1) 🎯 MVP

**Goal**: Deliver public domain access, managed sign-in initiation, protected-route enforcement, and the first authenticated shell entry.

**Independent Test**: Open the deployed web domain, verify the landing page renders over TLS, verify protected routes redirect unauthenticated visitors into sign-in, complete sign-in with a pre-provisioned user, and confirm entry into the protected shell.

### Tests for User Story 1

- [X] T014 [P] [US1] Add the health endpoint contract test in `apps/api/tests/contract/test_health_contract.py`
- [X] T015 [P] [US1] Add the public-entry and protected-route browser flow test in `apps/web/tests/e2e/public-entry.spec.ts`
- [X] T016 [P] [US1] Add the frontend auth routing unit test in `apps/web/tests/unit/auth-routing.test.tsx`

### Implementation for User Story 1

- [X] T017 [P] [US1] Implement the DNS and certificate module for shared root-domain subdomains in `infra/terraform/modules/dns/main.tf`, `infra/terraform/modules/dns/variables.tf`, and `infra/terraform/modules/dns/outputs.tf`
- [X] T018 [P] [US1] Implement the static frontend hosting module in `infra/terraform/modules/frontend_hosting/main.tf`, `infra/terraform/modules/frontend_hosting/variables.tf`, and `infra/terraform/modules/frontend_hosting/outputs.tf`
- [X] T019 [P] [US1] Implement the Cognito identity module with pre-provisioned-user access and no public self-sign-up in `infra/terraform/modules/identity/main.tf`, `infra/terraform/modules/identity/variables.tf`, and `infra/terraform/modules/identity/outputs.tf`
- [X] T020 [US1] Wire DNS, hosting, and identity resources into the dev environment in `infra/terraform/environments/dev/main.tf` and `infra/terraform/environments/dev/outputs.tf`
- [X] T021 [P] [US1] Implement the unauthenticated health handler in `apps/api/src/infrastructure/http/health.py` and `apps/api/src/main/handler.py`
- [X] T022 [P] [US1] Implement the public landing page and sign-in action UI in `apps/web/src/routes/public/LandingPage.tsx` and `apps/web/src/features/auth/AuthActions.tsx`
- [X] T023 [US1] Implement the OIDC session manager, callback route, and protected-route guard in `apps/web/src/features/auth/session.ts`, `apps/web/src/routes/public/AuthCallbackPage.tsx`, and `apps/web/src/routes/protected/ProtectedRoute.tsx`
- [X] T024 [US1] Implement sign-out action, session clear-down, and public-route redirect in `apps/web/src/features/auth/session.ts` and `apps/web/src/features/auth/AuthActions.tsx`
- [X] T025 [US1] Implement the minimal authenticated shell route in `apps/web/src/routes/protected/AppShell.tsx` and `apps/web/src/app/router.tsx`

**Checkpoint**: User Story 1 is independently functional when the public site, sign-in flow, protected-route redirect, and authenticated shell all work end to end.

---

## Phase 4: User Story 2 - Enter a usable authenticated shell on first login (Priority: P2)

**Goal**: Deliver authenticated user-context retrieval plus automatic first-login bootstrap of the local Campfire user record.

**Independent Test**: Sign in as a pre-provisioned user with a verified email, confirm `/me` creates the local user on first access, confirm a second access reuses the existing user, and confirm the bootstrap screen renders the authenticated identity state.

### Tests for User Story 2

- [X] T026 [P] [US2] Add the authenticated user-context contract test in `apps/api/tests/contract/test_me_contract.py`
- [X] T027 [P] [US2] Add the bootstrap and returning-user integration test in `apps/api/tests/integration/test_get_or_bootstrap_local_user.py`
- [X] T028 [P] [US2] Add the bootstrap screen browser flow test in `apps/web/tests/e2e/me-bootstrap.spec.ts`

### Implementation for User Story 2

- [X] T029 [P] [US2] Implement the LocalUser model and repository port in `apps/api/src/domain/user/models.py` and `apps/api/src/domain/user/repository.py`
- [X] T030 [P] [US2] Implement verified-claims mapping and identity normalization in `apps/api/src/infrastructure/auth/claims.py`
- [X] T031 [P] [US2] Implement the DynamoDB LocalUser repository adapter with conditional bootstrap writes in `apps/api/src/infrastructure/persistence/local_user_repository.py`
- [X] T032 [US2] Implement the GetOrBootstrapLocalUser use case and response DTOs in `apps/api/src/application/user_context/service.py` and `apps/api/src/application/user_context/dto.py`
- [X] T033 [US2] Implement the authenticated `/me` handler with verified-email enforcement in `apps/api/src/infrastructure/http/me.py` and `apps/api/src/main/handler.py`
- [X] T034 [P] [US2] Implement the persistence module for the LocalUser table in `infra/terraform/modules/persistence/main.tf`, `infra/terraform/modules/persistence/variables.tf`, and `infra/terraform/modules/persistence/outputs.tf`
- [X] T035 [P] [US2] Implement the API runtime module with Lambda, HTTP API, and JWT authorizer wiring in `infra/terraform/modules/api_runtime/main.tf`, `infra/terraform/modules/api_runtime/variables.tf`, and `infra/terraform/modules/api_runtime/outputs.tf`
- [X] T036 [US2] Wire API runtime and LocalUser persistence into the dev environment in `infra/terraform/environments/dev/main.tf` and `infra/terraform/environments/dev/outputs.tf`
- [X] T037 [US2] Implement the `/me` query hook and bootstrap screen states in `apps/web/src/features/me/useMe.ts`, `apps/web/src/routes/protected/MeBootstrapPage.tsx`, and `apps/web/src/routes/protected/AppShell.tsx`

**Checkpoint**: User Story 2 is independently functional when first-login bootstrap, returning-user lookup, `/me`, and the bootstrap screen all work against the deployed environment.

---

## Phase 5: User Story 3 - Operate the foundation safely and predictably (Priority: P3)

**Goal**: Deliver repeatable deployment, secure runtime configuration, and enough observability to diagnose auth/bootstrap failures in the first environment.

**Independent Test**: Provision the environment from Terraform, deploy the frontend and backend, verify the web and API subdomains, confirm `/health` and unauthorized `/me` behavior, and use logs/metrics to identify failed auth or bootstrap paths.

### Tests for User Story 3

- [X] T038 [P] [US3] Add the backend authentication-failure integration test in `apps/api/tests/integration/test_auth_failures.py`
- [X] T039 [P] [US3] Add the expired-session and sign-out browser flow test in `apps/web/tests/e2e/session-failures.spec.ts`

### Implementation for User Story 3

- [X] T040 [P] [US3] Implement the observability module for log groups, metrics, and alarms in `infra/terraform/modules/observability/main.tf`, `infra/terraform/modules/observability/variables.tf`, and `infra/terraform/modules/observability/outputs.tf`
- [X] T041 [P] [US3] Implement secure runtime configuration for API and frontend integration values in `infra/terraform/modules/api_runtime/main.tf` and `infra/terraform/modules/identity/main.tf`
- [X] T042 [P] [US3] Configure encryption-at-rest defaults for S3, DynamoDB, and managed configuration in `infra/terraform/modules/frontend_hosting/main.tf`, `infra/terraform/modules/persistence/main.tf`, and `infra/terraform/modules/api_runtime/main.tf`
- [X] T043 [P] [US3] Define least-privilege IAM policies for API, logging, and persistence access in `infra/terraform/modules/api_runtime/main.tf` and `infra/terraform/modules/observability/main.tf`
- [X] T044 [US3] Wire observability and secure configuration outputs into `infra/terraform/environments/dev/main.tf` and `infra/terraform/environments/dev/outputs.tf`
- [X] T045 [P] [US3] Implement backend observability bootstrap for correlation-friendly logs and metrics in `apps/api/src/main/observability.py` and `apps/api/src/main/handler.py`
- [X] T046 [P] [US3] Add deployment and Terraform validation workflow in `.github/workflows/auth-bootstrap-infra.yml`
- [X] T047 [US3] Add post-deploy smoke validation workflow and timing assertions in `.github/workflows/auth-bootstrap-smoke.yml` and `scripts/auth-bootstrap-smoke.sh`
- [X] T048 [US3] Add auth-flow success and failure telemetry for sign-in, callback, `/me` success, and `/me` rejection in `apps/api/src/main/observability.py` and `apps/web/src/features/auth/session.ts`
- [X] T049 [US3] Document operator deployment, pre-provisioned test-user administration, and failure-triage steps in `specs/001-auth-bootstrap/quickstart.md` and `docs/adr/ADR-0001-auth-bootstrap-foundation.md`

**Checkpoint**: User Story 3 is independently functional when a fresh environment can be deployed and operators can diagnose domain, auth, token, and bootstrap failures from the documented validation flow.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Tighten consistency, accessibility, and shared documentation across all stories.

- [X] T050 [P] Align frontend design tokens and global styles with `DESIGN.md` in `apps/web/src/app/styles/tokens.css` and `apps/web/src/app/styles/global.css`
- [X] T051 [P] Add shared frontend API types from the approved contract in `apps/web/src/lib/api-types.ts`
- [X] T052 Harden cross-story security and error handling in `apps/web/src/features/auth/session.ts`, `apps/api/src/infrastructure/http/me.py`, and `apps/api/src/main/settings.py`
- [X] T053 [P] Update root onboarding and implementation notes in `README.md` and `AGENTS.md`
- [ ] T054 Run the full quickstart validation and capture any required doc fixes in `specs/001-auth-bootstrap/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and reuses the deployed auth/domain shape from User Story 1
- **User Story 3 (Phase 5)**: Depends on User Stories 1 and 2 because it validates the running end-to-end environment
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational - MVP slice
- **User Story 2 (P2)**: Starts after Foundational, but requires the auth and runtime baseline from US1 for real end-to-end validation
- **User Story 3 (P3)**: Starts after US1 and US2 because observability and deployment validation depend on the complete secure slice

### Within Each User Story

- Tests are created before the corresponding implementation tasks
- Infrastructure resources come before the app wiring that depends on their outputs
- Domain and repository abstractions come before application services
- Application services come before HTTP handlers and frontend data hooks
- Story verification happens before moving to the next milestone

### Parallel Opportunities

- Setup tasks marked `[P]` can run in parallel after `T001`
- Foundational tasks `T008`-`T013` can run in parallel after `T006` and `T007`
- In US1, tests `T014`-`T016` and infrastructure tasks `T017`-`T019` can run in parallel
- In US2, tests `T025`-`T027`, backend model/adapter tasks `T028`-`T030`, and infra module tasks `T033`-`T034` can run in parallel
- In US3, tests `T037`-`T038`, infra tasks `T039`-`T040`, and automation tasks `T043`-`T044` can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 tests together:
Task: "Add the health endpoint contract test in apps/api/tests/contract/test_health_contract.py"
Task: "Add the public-entry and protected-route browser flow test in apps/web/tests/e2e/public-entry.spec.ts"
Task: "Add the frontend auth routing unit test in apps/web/tests/unit/auth-routing.test.tsx"

# Launch independent infrastructure work for User Story 1 together:
Task: "Implement the DNS and certificate module in infra/terraform/modules/dns/"
Task: "Implement the static frontend hosting module in infra/terraform/modules/frontend_hosting/"
Task: "Implement the Cognito identity module in infra/terraform/modules/identity/"
```

---

## Parallel Example: User Story 2

```bash
# Launch User Story 2 backend coverage together:
Task: "Add the authenticated user-context contract test in apps/api/tests/contract/test_me_contract.py"
Task: "Add the bootstrap and returning-user integration test in apps/api/tests/integration/test_get_or_bootstrap_local_user.py"

# Launch User Story 2 domain and infrastructure work together:
Task: "Implement the LocalUser model and repository port in apps/api/src/domain/user/"
Task: "Implement verified-claims mapping in apps/api/src/infrastructure/auth/claims.py"
Task: "Implement the persistence module in infra/terraform/modules/persistence/"
Task: "Implement the API runtime module in infra/terraform/modules/api_runtime/"
```

---

## Parallel Example: User Story 3

```bash
# Launch User Story 3 validation and operations work together:
Task: "Add the backend authentication-failure integration test in apps/api/tests/integration/test_auth_failures.py"
Task: "Add the expired-session and sign-out browser flow test in apps/web/tests/e2e/session-failures.spec.ts"
Task: "Implement the observability module in infra/terraform/modules/observability/"
Task: "Add deployment and smoke workflows in .github/workflows/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate domain access, sign-in initiation, protected-route enforcement, and authenticated shell entry
5. Stop and demo the first secure entry slice

### Incremental Delivery

1. Complete Setup + Foundational to establish the repo and environment skeleton
2. Deliver User Story 1 as the MVP public entry and auth gate
3. Deliver User Story 2 to add local-user bootstrap and authenticated user context
4. Deliver User Story 3 to make the environment safely deployable and diagnosable
5. Finish with cross-cutting polish, docs, and quickstart validation

### Suggested MVP Scope

- **Recommended MVP**: Complete through **User Story 1**
- **First production-like internal milestone**: Complete through **User Story 2**
- **First operationally trustworthy environment**: Complete through **User Story 3**

---

## Notes

- [P] tasks use different files or clearly separable modules
- Each user story phase is independently testable against its story goal
- The task list keeps registration, roles/permissions, and broader product features out of scope
- The contract in `specs/001-auth-bootstrap/contracts/` is treated as the source design artifact, while `apps/shared/contracts/` becomes the implementation-facing copy
