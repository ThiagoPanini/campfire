---
description: "Task list for the Campfire app Home redesign and onboarding/preferences removal"
---

# Tasks: App Home Redesign - Remove Onboarding & Preferences

**Input**: Design documents from `/specs/004-app-home-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md, contracts/ui-contract.md, quickstart.md, `.claude/design/project/Home Redesign.html`, `.claude/design/project/src/home-final.jsx`

**Tests**: No TDD-first workflow was requested. This task list includes test and validation updates required by the approved spec: frontend typecheck/build, backend identity tests, OpenAPI contract checks, migration checks, and manual quickstart validation.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified as an independent increment after shared setup/foundation.

## User Stories Reference

- **US1** - Authenticated user lands on the new Home (P1, MVP).
- **US2** - Onboarding and preferences are gone (P1).
- **US3** - Repertoire functionality remains intact (P1).
- **US4** - Backend identity surface is simplified (P2).
- **US5** - Direct visit to removed routes is handled coherently (P3).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on another incomplete task.
- **[Story]**: Maps to a user story. Setup, foundational, and polish tasks have no story label.
- File paths are relative to the repository root.

## Path Conventions

- Frontend app: `apps/web/src/`
- Backend API: `apps/api/src/`, `apps/api/tests/`, `apps/api/alembic/versions/`
- Feature docs/contracts: `specs/004-app-home-redesign/`
- Current full OpenAPI snapshot: `specs/002-backend-auth-slice/contracts/openapi.json`
- Design source: `.claude/design/project/`

---

## Phase 1: Setup (Shared Discovery)

**Purpose**: Capture the current source shape and identify the exact removal/edit surface before implementation starts.

- [X] T001 Review the approved source documents and design artifacts in specs/004-app-home-redesign/plan.md, specs/004-app-home-redesign/spec.md, specs/004-app-home-redesign/research.md, specs/004-app-home-redesign/data-model.md, specs/004-app-home-redesign/contracts/api-contract.md, specs/004-app-home-redesign/contracts/ui-contract.md, specs/004-app-home-redesign/quickstart.md, .claude/design/project/Home Redesign.html, and .claude/design/project/src/home-final.jsx
- [X] T002 Record the current frontend references to remove or preserve by running the quickstart search command against apps/web/src and mapping each hit to App.tsx, router/routes.ts, HomePage.tsx, features/auth, features/onboarding, i18n/locales, mocks, or AccentControls.tsx
- [X] T003 [P] Record the current backend references to remove or preserve by running the quickstart search command against apps/api/src and apps/api/tests and mapping each hit to identity domain, use cases, HTTP schemas/routers, persistence, migrations, tests, and local smoke scripts
- [X] T004 [P] Inspect package scripts and backend commands in apps/web/package.json, apps/api/pyproject.toml, Makefile, and docker-compose.yml so later validation uses existing npm, uv, Alembic, and pytest commands only

**Checkpoint**: Implementation agent has a concrete hit list and knows the existing validation commands.

---

## Phase 2: Foundational (Shared Contracts and Route Decisions)

**Purpose**: Establish the cross-cutting contracts that block all story work. No user story work should start until these decisions are reflected in the implementation notes or first patch.

- [X] T005 Document the stale /onboarding strategy for apps/web/src/app/router/routes.ts using the plan-approved approach: remove onboarding from active ROUTES/PROTECTED_ROUTES and make literal /onboarding resolve through landing/auth bounce or an explicit redirect without adding a new router library
- [X] T006 Decide the Home CTA target for "Add songs to repertoire" by inspecting existing repertoire navigation in apps/web/src/pages/RepertoirePage.tsx, apps/web/src/features/repertoire/components/AddSongModal.tsx, and apps/web/src/app/router/routes.ts; document whether the CTA opens an existing add route, an existing modal trigger, or /repertoire fallback
- [X] T007 [P] Confirm the simplified frontend auth user shape in apps/web/src/features/auth/types.ts and apps/web/src/features/auth/api/auth.api.ts: keep displayName/email and optional id/memberSince or createdAt; remove Preferences, firstLogin, and authMode if onboarding-only
- [X] T008 [P] Confirm the simplified backend identity API shape in apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py against specs/004-app-home-redesign/contracts/api-contract.md: GET /me and register responses must not expose preferences or firstLogin
- [X] T009 [P] Confirm the migration target names by inspecting apps/api/alembic/versions/0001_identity_initial.py, apps/api/alembic/versions/0002_seed_ada.py, and apps/api/alembic/versions/0003_repertoire_initial.py for the preferences table/columns and users.first_login column
- [X] T010 [P] Confirm the active OpenAPI snapshot ownership by inspecting apps/api/tests/contract/test_openapi_snapshot.py and specs/002-backend-auth-slice/contracts/openapi.json before backend contract edits

**Checkpoint**: Route behavior, CTA behavior, identity response shape, migration targets, and OpenAPI snapshot location are known.

---

## Phase 3: User Story 1 - Authenticated User Lands on the New Home (Priority: P1) MVP

**Goal**: Sign-in and sign-up land on /home, which renders the new Campfire Control Room using existing session and repertoire data with no preference dependency.

**Independent Test**: Sign in or sign up with a test account; confirm URL is /home, Home renders with zero and populated repertoire entries, CTAs work, future modules are locked, and no preferences UI appears.

### Implementation for User Story 1

- [X] T011 [US1] Change successful email/password sign-up navigation to home in apps/web/src/app/App.tsx and ensure sign-in still navigates to home
- [X] T012 [US1] Change successful Google-stub sign-up navigation to home in apps/web/src/app/App.tsx without preserving an onboarding transition
- [X] T013 [US1] Replace the old welcome/preference Home composition in apps/web/src/pages/HomePage.tsx with a Control Room page shell that accepts session user data and repertoire store data only
- [X] T014 [US1] Implement the Home hero section in apps/web/src/pages/HomePage.tsx with kicker, display title, supporting paragraph, primary Add songs CTA, secondary Open repertoire CTA, and disabled Enter a jam session CTA with aria-disabled
- [X] T015 [US1] Implement client-side Home metrics in apps/web/src/pages/HomePage.tsx: total songs with one-song singular copy when applicable, added last 7 days from createdAt, ready/practicing/learning counts, and proportional status bar without a new backend endpoint
- [X] T016 [US1] Implement the You added last populated and empty states in apps/web/src/pages/HomePage.tsx using the existing repertoire Entry shape, sorted by createdAt descending with safe fallback ordering
- [X] T017 [US1] Wire Home actions in apps/web/src/pages/HomePage.tsx to existing repertoire navigation: Add songs to repertoire, Add your first song, Open repertoire, Open entry, and Edit must use existing routes when present or the /repertoire fallback selected in T006
- [X] T018 [US1] Implement the "What's coming to Campfire" rail in apps/web/src/pages/HomePage.tsx with exactly Jam Sessions, Shared Setlists, Practice Queue, and Circle Members as muted non-interactive Soon tiles
- [X] T019 [US1] Add or replace Home locale strings in apps/web/src/i18n/locales/en.ts and apps/web/src/i18n/locales/pt.ts for the new hero, status grid including one-song singular copy, last-added/empty states, future rail, and optional account footer without preference wording
- [X] T020 [US1] Add responsive Home styling in apps/web/src/styles/global.css for desktop, <=980px, and <=560px layouts using existing tokens/classes and no new CSS-in-JS or dependency
- [ ] T021 [US1] Verify US1 manually in apps/web using quickstart steps for sign-up -> /home, sign-in -> /home, empty repertoire Home, populated repertoire Home, CTA navigation, keyboard reachability, and disabled jam-session behavior

**Checkpoint**: New Home MVP works independently for authenticated users and uses only session plus repertoire data.

---

## Phase 4: User Story 2 - Onboarding and Preferences Are Gone (Priority: P1)

**Goal**: No active frontend route, screen, session state, API method, mock fixture, or visible copy exposes onboarding or musical preferences.

**Independent Test**: Navigate the app as new and returning users; search active frontend source for onboarding/preference references; direct /onboarding does not render an onboarding screen.

### Implementation for User Story 2

- [X] T022 [US2] Remove onboarding from RouteId, ROUTES, and PROTECTED_ROUTES in apps/web/src/app/router/routes.ts while preserving /, /signin, /signup, /home, /repertoire, and any repertoire child paths
- [X] T023 [US2] Remove OnboardingPage import/case and savePreferences/onboarding callbacks from apps/web/src/app/App.tsx while preserving existing auth guard behavior
- [X] T024 [US2] Delete the onboarding page wrapper at apps/web/src/pages/OnboardingPage.tsx after all imports are removed
- [X] T025 [P] [US2] Delete the onboarding feature barrel, types, catalogs, and components under apps/web/src/features/onboarding/
- [X] T026 [US2] Remove frontend Preferences, authMode, firstLogin, savePreferences, emptyPreferences, clonePreferences, and preference persistence from apps/web/src/features/auth/session.store.ts
- [X] T027 [US2] Remove frontend Preferences/AuthMode/firstLogin types and exports from apps/web/src/features/auth/types.ts and apps/web/src/features/auth/index.ts
- [X] T028 [US2] Remove getPreferences, updatePreferences, PreferencesPayload, firstLogin mapping, and preferences mapping from apps/web/src/features/auth/api/auth.api.ts while ignoring unknown legacy fields naturally through the simplified response mapper
- [X] T029 [P] [US2] Remove preference and first-login fixture data from apps/web/src/mocks/fixtures/user.ts and remove preference fixture claims from apps/web/src/mocks/README.md
- [X] T030 [P] [US2] Rename the user-facing AccentControls label from display preferences to display settings in apps/web/src/shared/components/AccentControls.tsx while preserving language/accent sessionStorage behavior
- [X] T031 [US2] Remove onboarding and preference-only i18n keys from apps/web/src/i18n/locales/en.ts and apps/web/src/i18n/locales/pt.ts after confirming no remaining component references those keys
- [X] T032 [US2] Run the frontend removal search from specs/004-app-home-redesign/quickstart.md against apps/web/src and resolve all active hits for onboarding, preferences, preferenceSummary, firstLogin, authMode, savePreferences, updatePreferences, and /me/preferences except explicitly allowed display-setting or repertoire-instrument references

**Checkpoint**: Frontend has no active onboarding module, no musical preference state/API, and no visible preference UI.

---

## Phase 5: User Story 3 - Repertoire Functionality Remains Intact (Priority: P1)

**Goal**: Existing repertoire list/add/edit/open behavior still works after Home and routing simplification.

**Independent Test**: As an authenticated user, complete the existing repertoire flows and confirm Home reflects added/updated entries.

### Implementation for User Story 3

- [X] T033 [US3] Verify apps/web/src/features/repertoire/index.ts, apps/web/src/features/repertoire/types.ts, apps/web/src/features/repertoire/store/repertoire.store.ts, and apps/web/src/features/repertoire/api/repertoire.api.ts are not changed except where Home consumes existing exported data/actions
- [X] T034 [US3] Confirm Home reads repertoire entries through the existing store/list loading path in apps/web/src/pages/HomePage.tsx and does not add a dashboard endpoint, duplicate store, or new data dependency
- [X] T035 [US3] Verify the /repertoire route and any existing detail/edit/add entry paths still resolve through apps/web/src/app/router/routes.ts and apps/web/src/app/App.tsx after onboarding removal
- [ ] T036 [US3] Manually validate repertoire journeys from specs/004-app-home-redesign/quickstart.md in apps/web: open repertoire, add a song, return to /home, see the new last-added card and updated counters, then open/edit from Home using existing route support or the /repertoire fallback selected in T006

**Checkpoint**: Repertoire remains the same product surface, with Home acting as a read/navigation layer.

---

## Phase 6: User Story 4 - Backend Identity Surface Is Simplified (Priority: P2)

**Goal**: Backend identity removes preferences and firstLogin from domain, API, persistence, migrations, tests, local scripts, and OpenAPI.

**Independent Test**: Run backend tests; GET /me excludes preferences and firstLogin; /me/preferences is absent from OpenAPI and returns 404; migrations drop preference persistence.

### Implementation for User Story 4

- [X] T037 [US4] Remove PreferencesProfile and first_login from the identity domain entity/value-object surface in apps/api/src/campfire_api/contexts/identity/domain/entities.py, apps/api/src/campfire_api/contexts/identity/domain/value_objects.py, apps/api/src/campfire_api/contexts/identity/domain/catalogs.py, and apps/api/src/campfire_api/contexts/identity/domain/ports.py
- [X] T038 [US4] Simplify register-user and Google-stub sign-in use cases so they create only user, credentials, and sessions in apps/api/src/campfire_api/contexts/identity/application/use_cases/register_user.py and apps/api/src/campfire_api/contexts/identity/application/use_cases/google_stub_sign_in.py
- [X] T039 [US4] Simplify GET /me use case to return identity user data only in apps/api/src/campfire_api/contexts/identity/application/use_cases/get_me.py
- [X] T040 [P] [US4] Delete the preference update use case at apps/api/src/campfire_api/contexts/identity/application/use_cases/update_preferences.py and remove its exports from apps/api/src/campfire_api/contexts/identity/application/use_cases/__init__.py
- [X] T041 [US4] Remove PreferencesPayload, preferences, firstLogin, and preference request inputs from identity HTTP schemas in apps/api/src/campfire_api/contexts/identity/adapters/http/schemas.py
- [X] T042 [US4] Remove the /me/preferences route and preference response mapping from apps/api/src/campfire_api/contexts/identity/adapters/http/routers/me.py while preserving GET /me
- [X] T043 [US4] Remove PreferencesRow, first_login mapping, and preference mapper logic from apps/api/src/campfire_api/contexts/identity/adapters/persistence/models.py and apps/api/src/campfire_api/contexts/identity/adapters/persistence/mappers.py
- [X] T044 [P] [US4] Delete the preferences repository at apps/api/src/campfire_api/contexts/identity/adapters/persistence/preferences_repository.py and remove imports/usages from apps/api/src/campfire_api/contexts/identity/adapters/persistence/unit_of_work.py
- [X] T045 [US4] Add Alembic migration apps/api/alembic/versions/0004_remove_identity_preferences.py that drops the preferences table and users.first_login on upgrade, then recreates them on downgrade using the previous schema
- [X] T046 [US4] Remove preference seed/truncate/local flow assumptions from apps/api/tests/conftest.py, apps/api/tests/local/run_local_api.py, and apps/api/tests/local/run_local_usecases.py
- [X] T047 [US4] Update identity unit tests in apps/api/tests/unit/identity/fakes.py, apps/api/tests/unit/identity/test_register_user.py, apps/api/tests/unit/identity/test_google_stub.py, apps/api/tests/unit/identity/test_get_me.py, and apps/api/tests/unit/identity/test_entities.py for the simplified user surface
- [X] T048 [P] [US4] Delete or replace preference-only unit tests in apps/api/tests/unit/identity/test_update_preferences.py so the suite no longer asserts preference persistence behavior
- [X] T049 [US4] Update identity integration tests in apps/api/tests/integration/identity/test_register.py, apps/api/tests/integration/identity/test_google_stub.py, apps/api/tests/integration/identity/test_me.py, apps/api/tests/integration/identity/test_no_secret_leakage.py, apps/api/tests/integration/identity/test_authorization_scope.py, and apps/api/tests/integration/identity/test_preferences.py for absent preferences/firstLogin and /me/preferences 404 or OpenAPI absence
- [X] T050 [US4] Regenerate or update the full OpenAPI snapshot in specs/002-backend-auth-slice/contracts/openapi.json and keep specs/004-app-home-redesign/contracts/api-contract.md aligned with the simplified identity surface
- [X] T051 [US4] Update contract assertions in apps/api/tests/contract/test_openapi_snapshot.py so OpenAPI has no /me/preferences path, PreferencesPayload schema, MeResponse.preferences field, or MeResponse.firstLogin field
- [ ] T052 [US4] Run backend validation from apps/api with uv run pytest and migration checks against fresh and previous-head databases per specs/004-app-home-redesign/quickstart.md
- [X] T053 [US4] Run the backend removal search from specs/004-app-home-redesign/quickstart.md against apps/api/src and apps/api/tests and resolve all active identity preference, firstLogin, first_login, /me/preferences, and UpdatePreferences hits except migration history/drop references

**Checkpoint**: Backend identity contract, persistence, and tests match the simplified surface.

---

## Phase 7: User Story 5 - Direct Visit to Removed Routes Is Handled Coherently (Priority: P3)

**Goal**: Stale /onboarding links never render onboarding and redirect predictably by auth state without changing unknown-route behavior.

**Independent Test**: Visit /onboarding while signed out and signed in; confirm redirects to / and /home respectively, then verify unknown paths still use existing fallback behavior.

### Implementation for User Story 5

- [X] T054 [US5] Implement the documented T005 stale /onboarding strategy in apps/web/src/app/router/routes.ts so /onboarding is not an active route id but resolves predictably for route lookup
- [X] T055 [US5] Adjust apps/web/src/app/App.tsx only if needed to preserve authenticated / -> /home bounce and unauthenticated protected-route -> / behavior for the stale /onboarding path
- [ ] T056 [US5] Manually validate /onboarding while unauthenticated, /onboarding while authenticated, /, /signin, /signup, /home, /repertoire, and one unknown route in apps/web
- [X] T057 [US5] Record any intentional route-search residue for /onboarding in specs/004-app-home-redesign/quickstart.md or implementation notes so final grep results are explainable

**Checkpoint**: Removed route handling is coherent and does not reintroduce onboarding as a product route.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final source sweep, docs updates, build/test validation, and sign-off evidence.

- [X] T058 [P] Update current behavior docs in docs/backend/identity/contracts.mdx, docs/sdd/traceability.mdx, and any current docs found by the final repository search so they no longer describe active onboarding/preferences behavior
- [X] T059 [P] Add a spec change-log or implementation outcome note to specs/004-app-home-redesign/spec.md with the final decisions that were carried forward during implementation
- [ ] T060 Validate Home performance in apps/web using browser Performance and Network evidence: warm-cache /home time-to-meaningful-paint must be within ±100 ms of the previous Home baseline, and blocking requests must remain limited to GET /me plus the existing repertoire fetch
- [ ] T061 Validate Home accessibility contrast in apps/web with a browser contrast checker or equivalent manual WCAG 2.1 AA check for hero text, CTA buttons, status tiles, locked future tiles, and disabled controls
- [ ] T062 Capture frontend bundle-size evidence from apps/web before/after npm run build or equivalent Vite output, confirming the deleted @features/onboarding module is no longer bundled and authenticated-app output shrinks by at least the removed onboarding module size or documenting any measured exception before implementation sign-off
- [X] T063 Run npm run typecheck from apps/web and fix any TypeScript strict errors caused by removed onboarding/preferences types or new Home code
- [X] T064 Run npm run build from apps/web and fix production build errors or warnings introduced by this feature
- [X] T065 Run the full backend validation selected in T004 from apps/api, including uv run pytest and any existing lint/type commands available in the repository workflow
- [X] T066 Run the final repository search from specs/004-app-home-redesign/quickstart.md across docs, specs, and apps; classify allowed historical/design/migration/spec hits and resolve all active source/doc contract hits
- [ ] T067 Execute the full manual quickstart in specs/004-app-home-redesign/quickstart.md and record pass/fail evidence for new user, returning user, /home empty/populated, /onboarding redirects, repertoire preservation, OpenAPI absence, migration behavior, performance/network evidence, contrast evidence, and bundle-size evidence

**Checkpoint**: Feature is ready for review with source, contracts, docs, and manual validation aligned.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1 discovery.
- **Phase 3 (US1)**: Depends on Phase 2, especially T006 and T007.
- **Phase 4 (US2)**: Depends on Phase 2, especially T005 and T007.
- **Phase 5 (US3)**: Depends on US1 Home wiring and US2 route cleanup enough to validate repertoire navigation.
- **Phase 6 (US4)**: Depends on Phase 2 backend contract and migration decisions; can run after frontend P1 stories if delivering MVP first.
- **Phase 7 (US5)**: Depends on US2 route removal and T005 strategy.
- **Phase 8 (Polish)**: Depends on all desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational; no dependency on backend cleanup because the frontend ignores removed fields.
- **US2 (P1)**: Can start after Foundational; overlaps with US1 in App.tsx/HomePage.tsx, so sequence with US1 when one implementer is working.
- **US3 (P1)**: Can validate after US1/US2 route and Home changes; should not require backend identity cleanup.
- **US4 (P2)**: Can start after Foundational; safest after frontend no longer depends on preferences/firstLogin.
- **US5 (P3)**: Depends on US2 removal of active onboarding route.

### Within Each User Story

- Remove or simplify imports before deleting files.
- Update types/API mappers before session/store consumers.
- Update schemas/routers before OpenAPI snapshots.
- Update persistence models/mappers before tests that assert the simplified backend.
- Run focused validation before final cross-repository validation.

---

## Parallel Opportunities

- T003 and T004 can run in parallel with T002 because they inspect different project areas.
- T007, T008, T009, and T010 can run in parallel after T005/T006 decisions are understood.
- T025, T029, T030 can run in parallel with other US2 tasks once imports are removed or confirmed absent.
- T040 and T044 can run in parallel with schema/router simplification once callers are identified.
- T048 can run in parallel with integration test updates because it touches a separate test file.
- T058 and T059 can run in parallel with final validation commands if no source edits are still in flight.

## Parallel Example: User Story 2

```bash
Task: "Delete onboarding feature files under apps/web/src/features/onboarding/"
Task: "Remove preference fixture data from apps/web/src/mocks/fixtures/user.ts"
Task: "Rename AccentControls label in apps/web/src/shared/components/AccentControls.tsx"
```

## Parallel Example: User Story 4

```bash
Task: "Delete preference update use case in apps/api/src/campfire_api/contexts/identity/application/use_cases/update_preferences.py"
Task: "Delete preferences repository in apps/api/src/campfire_api/contexts/identity/adapters/persistence/preferences_repository.py"
Task: "Delete or replace preference-only unit tests in apps/api/tests/unit/identity/test_update_preferences.py"
```

---

## Implementation Strategy

### MVP First (P1 Stories)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: US1 new Home.
4. Complete Phase 4: US2 frontend onboarding/preferences removal.
5. Complete Phase 5: US3 repertoire preservation validation.
6. Stop and validate the P1 frontend MVP with npm run typecheck, npm run build, and the manual frontend quickstart.

### Incremental Delivery

1. Deliver US1 + US2 + US3 together as the visible simplification.
2. Deliver US4 backend cleanup as the next coherent contract/persistence change.
3. Deliver US5 stale-route hardening after active onboarding route removal.
4. Finish Phase 8 to align docs, contracts, searches, and validation evidence.

### Single-Agent Sequential Strategy

1. Work top to bottom by task ID.
2. Keep frontend P1 changes in one reviewable set.
3. Keep backend identity cleanup in one reviewable set after frontend no longer consumes removed fields.
4. Run Phase 8 validation in task order so performance, accessibility, bundle, build, backend, search, and manual evidence all land before sign-off.
