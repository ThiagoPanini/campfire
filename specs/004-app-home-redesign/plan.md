# Implementation Plan: App Home Redesign — Remove Onboarding & Preferences

**Branch**: `004-app-home-redesign` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/004-app-home-redesign/spec.md`

## Extension Hooks

**Optional Pre-Hook**: git
Command: `/speckit.git.commit`
Description: Auto-commit before implementation planning

Prompt: Commit outstanding changes before planning?
To execute: `/speckit.git.commit`

## Summary

Remove onboarding and musical preferences end to end, then replace the authenticated
Home page with the Claude `HomeFinal` "Campfire Control Room" direction. Sign-in
and sign-up both land on `/home`; `/onboarding` no longer renders a screen and
is handled as a stale deep link. The new Home uses only the authenticated user
and the existing repertoire list: total entries, entries added in the last seven
days, status counts, the most recently added entry, and static disabled
coming-soon modules.

This is a frontend and backend simplification. Backend compatibility is not
preserved because the app is undeployed and the spec explicitly requires removal
of preference request/response fields, `/me/preferences`, preference persistence,
and `firstLogin`. A single Alembic migration drops preference-only persistence
and `users.first_login`; tests and OpenAPI snapshots are updated to enforce the
new contract.

## Technical Context

**Language/Version**: TypeScript 5.x strict + React 19 for `apps/web`; Python
3.12 for `apps/api`.
**Primary Dependencies**: Existing Vite/React frontend, lucide-react already in
root dependencies, FastAPI, Pydantic v2, SQLAlchemy 2 async, Alembic, asyncpg,
pytest/testcontainers. No new dependency is planned.
**Storage**: PostgreSQL 16 via Alembic. Remove `preferences` table and
`users.first_login`; keep identity, credentials, sessions, refresh tokens, and
repertoire tables.
**Testing**: Frontend `npm run typecheck`, `npm run build`, manual browser
route validation. Backend `uv run pytest` from `apps/api`, with identity
contract/integration/unit tests updated for the reduced surface.
**Target Platform**: Local-first web application: React SPA + Python API.
**Project Type**: Full-stack web application in `apps/web` and `apps/api`.
**Performance Goals**: Home must not add blocking network requests beyond
existing `GET /me` and repertoire `GET /repertoire/entries`; warm-cache
meaningful paint stays within ±100 ms of current Home.
**Constraints**: No new routing framework, state library, CSS-in-JS, backend
framework, persistence abstraction, or broad refactor. Domain/application layers
remain framework-free. Docs update with code change. Dev-only language/accent
controls are preserved because the spec limits "preferences" to musical
preferences.
**Scale/Scope**: MVP/private demo scale. Tens of users and entries. The
repertoire list remains client-side as established by spec 003.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution: `.specify/memory/constitution.md` v1.1.0.

| Principle / Invariant | Status | Evidence |
|---|---|---|
| I. Narrow MVP Scope | Pass | Removes a non-essential preference/onboarding branch and centers Home on repertoire, one of the constitution's MVP jobs. Future modules remain disabled/static. |
| II. Incremental Delivery | Pass | Implementation can be sequenced frontend removal/Home first, then backend contract/persistence cleanup, while preserving existing auth and repertoire flows at each checkpoint. |
| III. Boring, Proven Stack | Pass | Reuses current React/Vite, CSS tokens, hand-rolled router, FastAPI, SQLAlchemy, Alembic, and pytest. No dependency changes. |
| IV. Proportional Rigor | Pass | Tests focus on changed contracts, routing, identity behavior, and build/type safety. No new e2e framework is introduced. |
| V. Docs-as-Code | Pass | This plan requires updating Mintlify/spec docs that still describe onboarding/preferences. |
| Backend invariant 1 — bounded-context slicing | Pass | Backend changes stay inside the existing `identity` context plus migrations/tests/docs. No new context. |
| Backend invariant 2 — layer purity by test | Pass | Removing preference use cases/repositories reduces surface area; architecture test remains valid. |
| Backend invariant 3 — cross-context references by IDs | Pass | Home consumes repertoire through frontend API/store; backend identity cleanup does not import repertoire entities. |
| Backend invariant 4 — HTTP translation at adapter boundary | Pass | Removed `/me/preferences` path deletes an adapter endpoint; remaining use cases continue raising application errors only. |
| Backend invariant 5 — explicit transactions | Pass | Registration no longer writes preferences; existing `session_scope` remains the write boundary. |
| Backend invariant 6 — validation at protective layer | Pass | Preference transport/domain validation is removed instead of duplicated. Register/login validation remains at HTTP/domain layers. |
| Backend invariant 7 — settings/time as ports | Pass | No new settings/time access required. |

**Post-design re-check**: Pass. The Phase 1 artifacts keep the slice within
existing architecture, use existing data sources, and define no new dependency
or product surface.

## Reference Audit

The initial audit searched active code, specs, docs, mocks, tests, contracts,
seed data, migrations, and Claude artifacts for:
`onboarding`, `OnboardingPage`, `OnboardingFlow`, `Preferences`, `preferences`,
`preferenceSummary`, `firstLogin`, `authMode`, `savePreferences`,
`updatePreferences`, `/onboarding`, `/me/preferences`, `instruments`, `genres`,
`goals`, `contexts`, `experience`, and related i18n keys.

| Area | References Found | Classification | Implementation Direction |
|---|---|---|---|
| `apps/web/src/app/App.tsx` | `OnboardingPage` import, protected-route checks, sign-up navigation to `onboarding`, `savePreferences`, Home preference props, update-preferences navigation | replace/remove | Remove import/case/props. Navigate sign-up and Google sign-up directly to `home`. Treat stale `/onboarding` through router mapping/redirect. |
| `apps/web/src/app/router/routes.ts` | `RouteId` includes `onboarding`; `ROUTES.onboarding`; `PROTECTED_ROUTES` includes onboarding | replace/remove | Remove onboarding route id and active route. Add simplest stale-path handling so `/onboarding` maps to landing/redirect behavior required by FR-014. |
| `apps/web/src/app/router/guards.tsx` | Generic protected route guard | preserve | Keep guard unchanged unless route typing requires a minor adjustment. |
| `apps/web/src/pages/HomePage.tsx` | `AuthMode`, `Preferences`, `contexts`, `experiences`, `preferenceSummary`, `Update Preferences` | replace | Replace the page with the Control Room layout. Props become user + navigation/actions + repertoire data/loading state, with no preference dependency. |
| `apps/web/src/pages/OnboardingPage.tsx` | Onboarding page wrapper | remove | Delete after imports are gone. |
| `apps/web/src/features/onboarding/**` | catalogs, types, flow components, option/chip components | remove | Delete module and ensure no active imports remain. |
| `apps/web/src/features/auth/session.store.ts` | `Preferences`, `emptyPreferences`, `clonePreferences`, `updatePreferences`, `preferences`, `authMode`, `savePreferences`, first-login state | remove/replace | Session holds only current user, language/accent dev controls, auth actions, sign-out. Ignore old preference-bearing responses only until API client type changes in same feature. |
| `apps/web/src/features/auth/types.ts` | `MockUser.firstLogin`, `MockUser.preferences`, `AuthMode` | remove/replace | Rename only if implementation chooses; reduce user type to displayName/email plus optional id/memberSince if backend exposes them. |
| `apps/web/src/features/auth/api/auth.api.ts` | `MeResponse.firstLogin/preferences`, `PreferencesPayload`, catalog normalization, `updatePreferences()` | remove | Strip response mapping and API method. `POST /auth/register` request remains `{ email, password }`; no preference payload support. |
| `apps/web/src/features/auth/components/**` | No direct preference dependency expected | preserve/investigate | Confirm during implementation search. |
| `apps/web/src/i18n/locales/en.ts`, `pt.ts` | `onboarding.*`, `home.preferences`, `home.update`, first/returning setup copy | replace/remove | Remove onboarding keys and preference-specific Home keys. Add `home.controlRoom.*` strings in each existing locale. |
| `apps/web/src/mocks/fixtures/user.ts`, `apps/web/src/mocks/README.md` | seeded preferences, `firstLogin`, mock preference notes | remove/replace | User fixture no longer includes preferences. README removes preference fixture claim. Repertoire mocks preserved. |
| `apps/web/src/shared/components/AccentControls.tsx` | `aria-label="Display preferences"` | replace | Change label to "Display settings" or equivalent. Preserve language/accent controls as dev/display settings, not musical preferences. |
| `apps/web/src/theme/**`, `apps/web/src/styles/**` | No product preference state; existing accent tokens/classes | preserve/replace as needed | Reuse tokens/classes. Add Home-specific CSS only where needed for artifact fidelity and responsiveness. |
| `apps/web/src/features/repertoire/**` | `INSTRUMENTS`, `instrument`, `proficiency`, `createdAt` | preserve | These are repertoire domain fields, not onboarding preferences. Home should consume `createdAt`, `instrument`, `proficiency`. |
| `apps/api/src/campfire_api/contexts/identity/domain/entities.py` | `User.first_login`, `PreferencesProfile` | remove | Remove `first_login` from `User`; delete `PreferencesProfile`. |
| `identity/domain/ports.py` | `PreferencesRepository` protocol | remove | Delete preference port and constructor dependencies. |
| `identity/application/use_cases/register_user.py` | Creates preferences row and first-login user | remove/replace | Register only creates user + credentials. |
| `identity/application/use_cases/google_stub_sign_in.py` | Creates preference row for stub users | remove/replace | Stub creates only identity user; no preference repo. |
| `identity/application/use_cases/get_me.py` | Requires preferences for `/me` | replace | Return only `User`; missing preference row must no longer invalidate auth. |
| `identity/application/use_cases/update_preferences.py` | Preference write use case | remove | Delete file and tests. |
| `identity/adapters/http/schemas.py` | `PreferencesPayload`, `MeResponse.firstLogin/preferences` | remove/replace | `MeResponse` contains only identity fields used by clients: displayName/email, plus id/memberSince if already available/low-risk. |
| `identity/adapters/http/routers/me.py` | `PATCH /me/preferences`, preference response mapping | remove/replace | Keep `GET /me`; remove preferences route entirely so it 404s and disappears from OpenAPI. |
| `identity/adapters/http/routers/auth.py` | `PreferencesPayload`, register response fields, preference repo dependency | remove/replace | Register response uses simplified `MeResponse`; no preference repo. |
| `identity/adapters/http/deps.py` | `SqlAlchemyPreferencesRepository` in repo map | remove | Delete repo import/map entry. |
| `identity/adapters/persistence/models.py` | `UserRow.first_login`, `PreferencesRow` | remove | Remove ORM column/model after migration added. |
| `identity/adapters/persistence/mappers.py` | `first_login` mapping, `preferences_from_row` | remove/replace | Remove first-login mapping and preference mapper. |
| `identity/adapters/persistence/preferences_repository.py` | SQLAlchemy preference repository | remove | Delete file after port/use-case references are gone. |
| Alembic `0001`, `0002`, new migration | Existing initial migration creates preferences/first_login; seed migration inserts preferences | replace/add | Do not rewrite historical migrations unless repo convention permits. Add `0004_remove_identity_preferences.py` dropping `preferences` and `users.first_login`; update seed/local fixtures so fresh head succeeds. If historical seed migration fails after drop, the drop migration is still safe because it runs after seed. |
| `apps/api/tests/conftest.py` | truncate/seed preferences | remove/replace | Stop truncating/inserting preferences. Preserve user/credential/session setup. |
| `apps/api/tests/unit/identity/*` | `FakePreferences`, register/get_me/update preference tests | remove/replace | Delete update preference tests, remove fake repo dependencies, assert simplified user. |
| `apps/api/tests/integration/identity/test_preferences.py` | `/me/preferences` behavior | remove/replace | Delete or replace with a focused 404/OpenAPI-absence test if desired. |
| `test_register.py`, `test_me.py`, `test_no_secret_leakage.py`, authorization scope tests | Assertions for firstLogin/preferences and preference route | replace | Assert simplified fields absent; remove obsolete preference-authorization test or convert to `/me/preferences` 404 check. |
| `apps/api/tests/local/run_local_api.py`, `run_local_usecases.py` | Preference local flows | remove/replace | Remove preference step from local smoke scripts. |
| `specs/002-backend-auth-slice/contracts/openapi.json` and contract tests | Old identity contract includes `PreferencesPayload`, `/me/preferences`, `firstLogin` | replace/investigate | Update whichever snapshot the active contract test uses. Because spec 002 is historical, either update in place with a note or add spec 004 contract and point test to latest identity contract. |
| `docs/sdd/specs/001-frontend-mvp-prototype.mdx` | Historical prototype docs mention onboarding/preferences | preserve/update | Preserve historical references only if clearly describing retired prototype. Add a note that spec 004 removes these surfaces; do not leave current behavior docs stale. |
| `.claude/design/project/**` | Artifact references preferences in notes/footer and onboarding in copied design project | preserve as artifact | Do not edit artifacts. Implementation plan explicitly omits artifact preference footer and identity strip. |
| `specs/001-*`, `specs/002-*`, `specs/004-*` | Historical and current specs contain search terms | preserve | Specs are allowed intentional residue. Only update current contracts/docs for active behavior. |

## Removal Boundary and Compatibility Decision

Preferences are removed from both frontend and backend. The backend cleanup is
planned in the same feature because the product specification requires removal
from API contracts and persistence, and the application is undeployed. There is
no accept-and-ignore compatibility path for legacy preference payloads.

Cleanup boundary:
- Active product code must not import `@features/onboarding`, `Preferences`,
  `UpdatePreferences`, `PreferencesRepository`, or `SqlAlchemyPreferencesRepository`.
- Active API OpenAPI output must not include `/me/preferences`,
  `PreferencesPayload`, `firstLogin`, or a `preferences` field on `MeResponse`.
- Historical specs and Claude artifacts may retain references as archived
  context only.
- Repertoire `instrument` and `proficiency` fields are preserved; they are song
  entry metadata, not user musical preferences.

## Routing and Session Strategy

Sign-up changes from `signUp() -> navigate("onboarding")` to
`signUp() -> navigate("home")`; Google sign-up follows the same path. Sign-in
already navigates to Home and remains unchanged.

`/onboarding` deep links should be handled without reintroducing an active
route. The simplest plan for the current hand-rolled router is:
- remove `onboarding` from `RouteId`, `ROUTES`, and `PROTECTED_ROUTES`;
- make `pathToRoute("/onboarding")` return `landing`;
- rely on the existing authenticated landing bounce only if present, or add a
  tiny route effect in `App.tsx` that replaces authenticated `landing` with
  `home`.

If the current landing route does not automatically bounce authenticated users,
the implementation must add that bounce for `/` as well, preserving the spec's
authenticated `/onboarding` → `/home` requirement and avoiding a hidden
onboarding route.

Existing browser/session storage:
- `campfire.language` and `campfire.accent` are display settings and remain.
- No existing code persists preference payloads separately; if implementation
  finds any `campfire.preferences`-style key, remove the reader and call
  `sessionStorage.removeItem(...)`/`localStorage.removeItem(...)` once during
  session initialization.
- If a refresh response from an older dev API still includes `preferences` or
  `firstLogin` during transition, the new frontend mapper ignores unknown
  fields. The final backend contract removes them.

## Home Page Component/Layout Plan

Source of truth: `.claude/design/project/Home Redesign.html` and
`.claude/design/project/src/home-final.jsx`, specifically `HomeFinal`, not the
earlier Console/Mantle/Wall variants.

Data source:
- `user`: existing session user from `GET /me` (`displayName`, `email`, optional
  `memberSince`/`createdAt` if added to the simplified identity response).
- `entries`: existing repertoire list from `useRepertoireStore().entries`.
- No Home-specific backend endpoint.
- No onboarding/preference data.

Reusable pieces:
- `Nav`, existing page shell classes (`page`, `fade-up`, display/mono classes).
- Existing `AccentButton`/`GhostButton` if they can match the artifact without
  awkward overrides; otherwise use local buttons styled with existing button
  classes.
- Repertoire types/store/API from `@features/repertoire`.
- Existing repertoire cover/instrument/proficiency UI if exported; otherwise
  co-locate tiny local helpers in `HomePage.tsx`.
- Existing CSS variables such as `--cf-accent`, `--cf-accent-dark`, surface,
  border, and typography classes from `apps/web/src/styles`/`theme`.

Sections and behavior:

1. Hero / control area
   - Kicker: `CAMPFIRE · DASHBOARD`.
   - Title: `YOUR CAMPFIRE CONTROL ROOM.`
   - Supporting paragraph adapted from artifact.
   - Primary CTA: `Add songs to repertoire`, opens/navigates to existing add
     flow. If the current app uses a modal inside `RepertoirePage` rather than
     `/repertoire/add`, implement the CTA by navigating to `/repertoire` with
     a minimal route state/query only if already supported; otherwise route to
     `/repertoire` and let tasks decide the smallest add trigger.
   - Secondary CTA: `Open repertoire`, navigates to `/repertoire`.
   - Disabled tertiary CTA: `Enter a jam session`, visible `SOON`, no
     navigation, `aria-disabled="true"`, not a fake enabled link.

2. Repertoire status
   - Header: `REPERTOIRE · STATUS`; link/button to open repertoire.
   - Three tiles only: Total songs, Added · last 7 days, By status.
   - Omit artifact wishlist tile entirely.
   - Compute `recent7` from `createdAt` using local time math at render time.
   - By-status counts map `proficiency` values: `ready`, `practicing`,
     `learning`; render stacked counters and proportional bar. If total is 0,
     render an empty bar/background and `00` counts.

3. You added last
   - Sort entries by `createdAt` descending. If dates are equal/unparseable,
     preserve list order as a fallback.
   - Populated state shows cover/art placeholder, title, artist, instrument,
     proficiency/status, `added X ago`, and `Open entry`/`Edit` actions.
   - If the current repertoire feature has no detail/edit route, actions should
     route to `/repertoire` or be scoped in tasks as disabled/hidden. Do not
     invent a detail route in this feature.
   - Empty state: fire mark, `Your repertoire is empty.`, short copy, `Add your
     first song` CTA.

4. What's coming rail
   - Static modules: Jam Sessions, Shared Setlists, Practice Queue, Circle
     Members.
   - All are muted, locked, `Soon`, non-interactive.
   - Use lucide icons if already practical; otherwise simple CSS/local glyphs
     are acceptable because no new icon dependency is needed.

5. Optional account footer
   - May show email and member-since date if available.
   - Must omit the artifact's `UPDATE PREFERENCES` link.

States:
- Loading: while repertoire entries load, show the shell/hero and skeleton or
  muted `00` status tiles with a loading label; no preferences fetch.
- Error: if repertoire fetch fails, Home still renders hero and future rail;
  status/last-added area shows a compact "Repertoire unavailable" message with
  an `Open repertoire` fallback. Use existing store error state if available;
  if not, keep implementation minimal and do not broaden the store unless tasks
  require it.
- Empty: specified above.
- Returning and first-time users use the same layout; copy does not depend on
  first-login state.

Responsive behavior:
- At `max-width: 980px`, hero stacks and CTA buttons stretch/fill width; status
  grid becomes two columns; future rail becomes two columns; last-added actions
  wrap.
- At `max-width: 560px`, status grid and future rail become one column; buttons
  remain full width; long song titles wrap without changing fixed-format tile
  dimensions.

## Backend Migration and Contract Strategy

Planned migration: add `apps/api/alembic/versions/0004_remove_identity_preferences.py`.
Upgrade:
- `op.drop_table("preferences")`.
- `op.drop_column("users", "first_login")`.

Downgrade:
- recreate `preferences` with the same columns/checks as `0001_identity_initial`;
- re-add `users.first_login` with a safe default (`false` or `true`, chosen by
  implementation consistency; this is only a downgrade path).

Fresh database behavior:
- `0001` creates old fields, `0002` seeds old preference data, `0003` creates
  repertoire, `0004` drops removed fields. This is acceptable and avoids
  rewriting historical migrations.
- Seed/local scripts must stop assuming preferences exist after head.

Contract tests:
- Update active OpenAPI snapshot(s) so `GET /me` and `POST /auth/register`
  return simplified `MeResponse`.
- Remove `/me/preferences` path and `PreferencesPayload` schema from the active
  snapshot.
- Add or update a test that asserts `/me/preferences` is absent from
  `create_app().openapi()["paths"]`. A runtime 404 assertion is optional but
  useful.
- Remove tests that assert preference persistence or first-login flipping;
  replace with simplified identity assertions where coverage would otherwise
  disappear.

## Project Structure

### Documentation (this feature)

```text
specs/004-app-home-redesign/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api-contract.md
│   └── ui-contract.md
└── checklists/
    └── requirements.md
```

### Source Code Impact (planned, no code implemented by this plan)

```text
apps/
├── web/src/
│   ├── app/
│   │   ├── App.tsx                         # remove onboarding flow; sign-up -> home
│   │   └── router/
│   │       ├── routes.ts                    # remove route id; stale /onboarding handling
│   │       └── guards.tsx                   # preserve
│   ├── pages/
│   │   ├── HomePage.tsx                     # replace with Control Room Home
│   │   └── OnboardingPage.tsx               # delete
│   ├── features/
│   │   ├── auth/                            # simplify session/user/api types
│   │   ├── onboarding/                      # delete
│   │   └── repertoire/                      # preserve; Home consumes list data
│   ├── i18n/locales/                        # remove old keys; add Home strings
│   ├── mocks/                               # remove preference fixture data
│   ├── shared/components/AccentControls.tsx # relabel display settings
│   └── styles/, theme/                      # scoped Home styling only as needed
└── api/
    ├── alembic/versions/
    │   └── 0004_remove_identity_preferences.py
    ├── src/campfire_api/contexts/identity/
    │   ├── domain/                          # remove preference entity/port + first_login
    │   ├── application/use_cases/           # remove update_preferences; simplify get/register/google
    │   └── adapters/
    │       ├── http/                        # remove /me/preferences and schemas
    │       └── persistence/                 # remove PreferencesRow/repository/mappers
    └── tests/
        ├── unit/identity/                   # update/delete preference tests/fakes
        ├── integration/identity/            # update/delete preference route tests
        ├── contract/                        # update OpenAPI assertions
        └── local/                           # remove preference smoke steps
```

**Structure Decision**: Keep this as an in-place simplification of existing
frontend/auth/identity modules. Do not introduce a `features/home` slice unless
`HomePage.tsx` becomes materially unwieldy during implementation; prefer
co-located helpers for `StatTile`, `StatusBar`, `LastAddedCard`, and
`FutureTile`.

## Implementation Phases for Tasks

1. Frontend removal and routing
   - Remove onboarding route/page/module imports.
   - Change sign-up success navigation to Home.
   - Implement stale `/onboarding` behavior.
   - Simplify session store and auth API types.

2. New Home
   - Build Control Room sections from the Claude final artifact.
   - Wire existing repertoire data and CTAs.
   - Add responsive CSS and i18n strings.
   - Verify no preferences/onboarding UI remains.

3. Backend identity cleanup
   - Remove preference domain/application/adapter/persistence code.
   - Remove `firstLogin` from entity, ORM, schemas, and mappers.
   - Add migration.
   - Update local seed/scripts and tests.

4. Contracts/docs/final sweep
   - Update OpenAPI snapshots/contracts.
   - Update docs that describe current behavior.
   - Run final repository search and validation commands.

## Testing and Validation Plan

Frontend:
- `npm run typecheck`
- `npm run build`
- Manual route validation: `/`, `/signin`, `/signup`, `/home`, `/repertoire`,
  stale `/onboarding`, unknown route fallback.
- Manual auth validation: sign-up -> `/home`, sign-in -> `/home`, refresh keeps
  session, sign-out returns to landing.
- Manual Home validation with empty and populated repertoire states.
- Responsive check at desktop, ~980px, and ~560px.
- Search active source for visible onboarding/preferences copy and dead imports:
  `rg -n -i "onboarding|preferences|preferenceSummary|firstLogin|authMode|savePreferences|updatePreferences|/me/preferences" apps/web/src`.

Backend:
- From `apps/api`: `uv run pytest`.
- If available in project scripts, also run ruff/mypy using existing commands.
- Verify Alembic upgrade on fresh DB and previous head.
- Verify `GET /me` omits `preferences` and `firstLogin`.
- Verify `/me/preferences` is absent from OpenAPI and returns 404 if requested.
- Search identity source/tests for removed concepts:
  `rg -n "Preferences|preferences|firstLogin|first_login|/me/preferences|UpdatePreferences" apps/api/src apps/api/tests`.

Repository-wide:
- Final search for stale references across active code, docs, contracts, mocks,
  and specs; classify intentional residue (historical specs, migration names,
  Claude artifacts).
- Confirm deleted files have no imports.
- Confirm docs/specs describe the new sign-up/Home behavior.

## Complexity Tracking

No constitution violations are planned.

## Extension Hooks

**Optional Hook**: git
Command: `/speckit.git.commit`
Description: Auto-commit after implementation planning

Prompt: Commit plan changes?
To execute: `/speckit.git.commit`
