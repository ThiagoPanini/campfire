# Tasks: Campfire Frontend MVP Prototype

**Input**: Design documents from `/home/paninit/workspaces/campfire/specs/001-frontend-mvp-prototype/`
**Prerequisites**: `/home/paninit/workspaces/campfire/specs/001-frontend-mvp-prototype/plan.md`, `/home/paninit/workspaces/campfire/specs/001-frontend-mvp-prototype/spec.md`, `/home/paninit/workspaces/campfire/specs/001-frontend-mvp-prototype/research.md`, `/home/paninit/workspaces/campfire/specs/001-frontend-mvp-prototype/data-model.md`, `/home/paninit/workspaces/campfire/specs/001-frontend-mvp-prototype/contracts/ui-contract.md`

**Tests**: Automated tests are not generated for this slice because the feature plan defers them; use the manual acceptance tasks in the final phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Each task includes exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the root Vite + React + TypeScript app and Mintlify docs shell.

- [X] T001 Create root package metadata and scripts for Vite, TypeScript, React, and Mintlify in `/home/paninit/workspaces/campfire/package.json`
- [X] T002 Create Vite HTML entry point with Campfire document metadata in `/home/paninit/workspaces/campfire/index.html`
- [X] T003 [P] Create Vite configuration for the React TypeScript app in `/home/paninit/workspaces/campfire/vite.config.ts`
- [X] T004 [P] Create TypeScript application configuration in `/home/paninit/workspaces/campfire/tsconfig.json`
- [X] T005 [P] Create TypeScript node/tooling configuration in `/home/paninit/workspaces/campfire/tsconfig.node.json`
- [X] T006 Create source directory skeleton matching the implementation plan under `/home/paninit/workspaces/campfire/src/`
- [X] T007 [P] Create initial Mintlify navigation config in `/home/paninit/workspaces/campfire/docs.json`
- [X] T008 [P] Create docs landing page placeholder in `/home/paninit/workspaces/campfire/docs/overview.mdx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core routing, state, data, copy, tokens, and shared UI needed before any user story can work.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T009 Implement the React entry point and root render in `/home/paninit/workspaces/campfire/src/main.tsx`
- [X] T010 Implement route IDs, URL path mapping, navigation helpers, and protected-route metadata in `/home/paninit/workspaces/campfire/src/app/routes.ts`
- [X] T011 Implement in-memory mock session state, refresh reset behavior, sessionStorage language/accent persistence, and auth/preference transition actions in `/home/paninit/workspaces/campfire/src/app/session-store.ts`
- [X] T012 [P] Implement seeded mock account, empty preferences, and mock user helpers in `/home/paninit/workspaces/campfire/src/data/mock-user.ts`
- [X] T013 [P] Implement onboarding catalogs and accent presets from the spec in `/home/paninit/workspaces/campfire/src/data/catalogs.ts`
- [X] T014 [P] Implement bilingual copy table for landing, auth, onboarding, home, validation, and controls in `/home/paninit/workspaces/campfire/src/data/copy.ts`
- [X] T015 Implement app-level routing, protected-route redirects, browser history sync, and nav action wiring in `/home/paninit/workspaces/campfire/src/app/App.tsx`
- [X] T016 [P] Port global page, typography, layout, form, and responsive base styles from the Claude design into `/home/paninit/workspaces/campfire/src/styles/global.css`
- [X] T017 [P] Define CSS custom properties for surfaces, borders, error color, accent presets, focus states, and selected-state tints in `/home/paninit/workspaces/campfire/src/styles/tokens.css`
- [X] T018 [P] Implement fade-up and fire-icon motion with reduced-motion suppression in `/home/paninit/workspaces/campfire/src/styles/motion.css`
- [X] T019 [P] Implement animated decorative fire icon component with accessible defaults in `/home/paninit/workspaces/campfire/src/components/FireIcon.tsx`
- [X] T020 [P] Implement shared buttons, alpha badge, and action states in `/home/paninit/workspaces/campfire/src/components/buttons.tsx`
- [X] T021 [P] Implement labeled text input, validation message, auth form layout, and divider primitives in `/home/paninit/workspaces/campfire/src/components/forms.tsx`
- [X] T022 [P] Implement language and accent controls backed by session state in `/home/paninit/workspaces/campfire/src/components/AccentControls.tsx`
- [X] T023 [P] Implement preference chip and option-card controls in `/home/paninit/workspaces/campfire/src/components/preference-controls.tsx`
- [X] T024 Implement fixed 58 px Campfire nav with contextual action behavior in `/home/paninit/workspaces/campfire/src/components/Nav.tsx`
- [X] T025 [P] Implement Google mark component matching the design affordance in `/home/paninit/workspaces/campfire/src/components/GoogleMark.tsx`

**Checkpoint**: Foundation ready; user story implementation can now begin in parallel where file ownership allows.

---

## Phase 3: User Story 1 - First-Time Visitor Reaches Home Via Sign-Up (Priority: P1) MVP

**Goal**: A visitor can open landing, create a mock account, complete onboarding, and arrive at personalized home.

**Independent Test**: Open `/`, click `ENTER CAMPFIRE`, submit any valid sign-up email/password, save onboarding, and confirm `/home` shows the derived display name and first-login member panel.

### Implementation for User Story 1

- [X] T026 [P] [US1] Implement final Claude landing hero, feature tiles, footer, CTA routing, and responsive layout in `/home/paninit/workspaces/campfire/src/screens/Landing.tsx`
- [X] T027 [P] [US1] Implement sign-up screen with brand cluster, email validation, 8-character minimum password validation, mode swap, localized errors, and create-account submit flow in `/home/paninit/workspaces/campfire/src/screens/SignUp.tsx`
- [X] T028 [P] [US1] Implement onboarding screen groups, selected states, zero-selection allowance, skip action, saving delay, and submit-to-home flow in `/home/paninit/workspaces/campfire/src/screens/Onboarding.tsx`
- [X] T029 [P] [US1] Implement home screen kicker, personalized headline, first-login member panel, long-email wrapping, and update-preferences action in `/home/paninit/workspaces/campfire/src/screens/Home.tsx`
- [X] T030 [US1] Wire sign-up, onboarding, and home transitions through session actions in `/home/paninit/workspaces/campfire/src/app/App.tsx`
- [X] T031 [US1] Verify US1 copy keys, accent propagation, protected onboarding/home redirects, and first-login state handling in `/home/paninit/workspaces/campfire/src/data/copy.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Returning User Signs In (Priority: P1)

**Goal**: A returning visitor signs in with the seeded mock account and reaches home without onboarding.

**Independent Test**: Open `/`, click `SIGN IN`, submit `ada@campfire.test` / `campfire123`, and confirm `/home` shows the returning-user member panel.

### Implementation for User Story 2

- [X] T032 [P] [US2] Implement sign-in screen with brand cluster, email validation, 8-character minimum password validation, mode swap, localized seeded-credential error, and submit flow in `/home/paninit/workspaces/campfire/src/screens/SignIn.tsx`
- [X] T033 [US2] Implement seeded credential matching and returning-user preference hydration in `/home/paninit/workspaces/campfire/src/app/session-store.ts`
- [X] T034 [US2] Wire landing nav to `/signin`, sign-in success to `/home`, and invalid credentials to in-place errors in `/home/paninit/workspaces/campfire/src/app/App.tsx`
- [X] T035 [US2] Update home member panel to render returning-user state and seeded account details in `/home/paninit/workspaces/campfire/src/screens/Home.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Google Sign-In / Sign-Up Affordance (Priority: P2)

**Goal**: Auth screens expose Google buttons that simulate successful managed identity flows without external OAuth.

**Independent Test**: Click `CONTINUE WITH GOOGLE` on `/signup` and confirm `/onboarding`; repeat on `/signin` and confirm `/home`.

### Implementation for User Story 3

- [X] T036 [US3] Add Google simulation action for new managed sign-up accounts in `/home/paninit/workspaces/campfire/src/screens/SignUp.tsx`
- [X] T037 [US3] Add Google simulation action for seeded returning sign-in accounts in `/home/paninit/workspaces/campfire/src/screens/SignIn.tsx`
- [X] T038 [US3] Ensure Google flows create or hydrate the correct mock user state without network calls in `/home/paninit/workspaces/campfire/src/app/session-store.ts`

**Checkpoint**: Google affordance works independently from email/password flows.

---

## Phase 6: User Story 4 - Update Preferences From Home (Priority: P3)

**Goal**: A signed-in user can reopen onboarding from home, see existing selections, change them, and return home.

**Independent Test**: From `/home`, click `UPDATE PREFERENCES`, change one chip or card, save, and confirm home reflects current in-memory preference state for the session.

### Implementation for User Story 4

- [X] T039 [US4] Implement update-mode hydration from current preferences when entering onboarding from home in `/home/paninit/workspaces/campfire/src/screens/Onboarding.tsx`
- [X] T040 [US4] Implement preference updates that preserve current user and auth mode for the active session in `/home/paninit/workspaces/campfire/src/app/session-store.ts`
- [X] T041 [US4] Wire home `UPDATE PREFERENCES` navigation and sign-out session clearing in `/home/paninit/workspaces/campfire/src/screens/Home.tsx`
- [X] T042 [US4] Verify preference changes update current in-memory state and preserve first-login/returning member-panel behavior in `/home/paninit/workspaces/campfire/src/screens/Home.tsx`

**Checkpoint**: Preference update loop works without breaking sign-up, sign-in, or Google flows.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, visual fidelity, responsiveness, accessibility, and manual acceptance.

- [X] T043 [P] Write feature documentation covering stack, run workflow, route map, session model, design references, component structure, and state boundaries in `/home/paninit/workspaces/campfire/docs/frontend/campfire-mvp-prototype.mdx`
- [X] T044 [P] Update docs overview with a link to the Campfire frontend prototype page in `/home/paninit/workspaces/campfire/docs/overview.mdx`
- [ ] T045 Verify manual acceptance checklist from quickstart for first-time, returning, Google, refresh, protected-route, language, accent, responsive, reduced-motion, and zero prohibited-network journeys using browser DevTools Network filtering in `/home/paninit/workspaces/campfire/specs/001-frontend-mvp-prototype/quickstart.md`
- [X] T046 Run TypeScript build and fix compile issues in `/home/paninit/workspaces/campfire/src/main.tsx`
- [X] T047 Run local Vite smoke check and fix route/render regressions in `/home/paninit/workspaces/campfire/src/app/App.tsx`
- [X] T048 Compare implemented screens against `Campfire Landing.html` for typography, spacing, colors, fire icon, forms, chips, and motion in `/home/paninit/workspaces/campfire/specs/001-frontend-mvp-prototype/design-reference/project/Campfire Landing.html`
- [X] T049 Verify all task checkboxes and implementation notes remain current in `/home/paninit/workspaces/campfire/specs/001-frontend-mvp-prototype/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion; blocks all user stories.
- **User Stories (Phases 3-6)**: Depend on Foundational completion.
- **Polish (Phase 7)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational; MVP slice and first complete demo path.
- **User Story 2 (P1)**: Starts after Foundational; may reuse Home from US1 but has an independent sign-in path.
- **User Story 3 (P2)**: Starts after SignUp and SignIn screens exist from US1/US2.
- **User Story 4 (P3)**: Starts after Home and Onboarding exist from US1.

### Within Each User Story

- Shared state and route contracts before screen-specific flow wiring.
- Screen components before app-level transition integration.
- Core journey completion before visual polish.
- Story checkpoint validation before moving to the next priority.

---

## Parallel Opportunities

- T003, T004, T005, T007, and T008 can run in parallel after T001 is drafted.
- T012, T013, T014, T016, T017, T018, T019, T020, T021, T022, T023, and T025 can run in parallel during Foundational work.
- T026, T027, T028, and T029 can run in parallel after Foundational completion, then T030 integrates the US1 journey.
- T032 can run while T033 is implemented if the SignIn screen consumes the session action contract.
- T036 and T037 can run in parallel once SignUp and SignIn exist.
- T043 and T044 can run in parallel with final manual validation after route behavior stabilizes.

---

## Parallel Example: User Story 1

```bash
Task: "Implement final Claude landing hero, feature tiles, footer, CTA routing, and responsive layout in /home/paninit/workspaces/campfire/src/screens/Landing.tsx"
Task: "Implement sign-up screen with brand cluster, email/password validation, mode swap, localized errors, and create-account submit flow in /home/paninit/workspaces/campfire/src/screens/SignUp.tsx"
Task: "Implement onboarding screen groups, selected states, zero-selection allowance, skip action, saving delay, and submit-to-home flow in /home/paninit/workspaces/campfire/src/screens/Onboarding.tsx"
Task: "Implement home screen kicker, personalized headline, first-login member panel, long-email wrapping, and update-preferences action in /home/paninit/workspaces/campfire/src/screens/Home.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "Implement sign-in screen with brand cluster, email/password validation, mode swap, localized seeded-credential error, and submit flow in /home/paninit/workspaces/campfire/src/screens/SignIn.tsx"
Task: "Implement seeded credential matching and returning-user preference hydration in /home/paninit/workspaces/campfire/src/app/session-store.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Add Google simulation action for new managed sign-up accounts in /home/paninit/workspaces/campfire/src/screens/SignUp.tsx"
Task: "Add Google simulation action for seeded returning sign-in accounts in /home/paninit/workspaces/campfire/src/screens/SignIn.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Stop and validate the landing -> sign-up -> onboarding -> home journey independently.
5. Demo the MVP path before adding secondary journeys.

### Incremental Delivery

1. Complete Setup + Foundational to make routing, state, copy, tokens, and shared controls available.
2. Add User Story 1 and validate the first-time user journey.
3. Add User Story 2 and validate seeded returning sign-in.
4. Add User Story 3 and validate Google simulation from both auth screens.
5. Add User Story 4 and validate the home-to-onboarding preference update loop.
6. Complete docs, visual fidelity checks, accessibility checks, and manual acceptance.

### Parallel Team Strategy

1. Complete Setup together to establish file structure and scripts.
2. Split Foundational work by file ownership: data/copy, styles, shared components, and app/session routing.
3. After Foundational completion, split screen work by story and file ownership.
4. Integrate each story at its checkpoint before starting cross-cutting polish.

---

## Notes

- [P] tasks touch different files or have no dependency on incomplete tasks.
- [US1], [US2], [US3], and [US4] labels map directly to the user stories in `/home/paninit/workspaces/campfire/specs/001-frontend-mvp-prototype/spec.md`.
- Automated tests are deferred by plan; manual acceptance in T045 is required before the slice is considered done.
- The authoritative visual source for this task is `/home/paninit/workspaces/campfire/specs/001-frontend-mvp-prototype/design-reference/project/Campfire Landing.html`; root `/home/paninit/workspaces/campfire/DESIGN.md` is synchronized from the Claude artifacts and remains a fallback only for Home details missing from the Claude design.
