# Feature Specification: App Home Redesign — Remove Onboarding & Preferences

**Feature Branch**: `004-app-home-redesign`
**Created**: 2026-04-28
**Status**: Draft
**Input**: User description: "New App Home and Removal of Onboarding/Preferences — simplify the application by removing onboarding and preferences functionality, then introduce a new authenticated Home page based on the Claude Design artifacts (`.claude/design/project/Home Redesign.html` + `src/home-final.jsx`)."

## Clarifications

### Session 2026-04-28

- Q: Wishlist tile binding — bind to data, placeholder, or hide? → A: Hide the tile entirely; no wishlist components introduced now.
- Q: `Added · last 7 days` data source? → A: Compute client-side from the existing repertoire fetch using `createdAt`.
- Q: Sign-up preference payload handling? → A: Remove preference fields from `POST /signup`; do not accept legacy preference payloads.

## Overview

The current authenticated Home page is a one-column "welcome card" showing a greeting, the user's email, a preference summary, and an *Update Preferences* button. Sign-up forces users through a multi-step onboarding flow that collects musical preferences (instruments, genres, context, experience). Preferences are persisted in the backend identity context.

This feature simplifies the product on two axes:

1. **Remove the entire onboarding and preferences functionality** — frontend flow, screens, catalogs, session state, API contracts, backend persistence, and copy.
2. **Replace the welcome-card Home** with a new authenticated **"Campfire Control Room"** Home page, derived from the Claude Design artifacts. The new Home centres on the user's repertoire and a roadmap rail of upcoming product modules — it does **not** depend on preferences.

The application is not deployed; no migration backwards-compatibility or data preservation is required.

## Goals

- Eliminate every user-visible touchpoint of onboarding and preferences.
- Eliminate every code path that exists *only* to support onboarding or preferences.
- Land authenticated users (sign-in **and** sign-up) directly on the new Home page.
- Implement the new Home page so it is meaningful for both populated and empty repertoire states.
- Keep the change tightly scoped: no new routing, no new state library, no new design system.

## Non-Goals

- Implementing any of the "coming soon" modules surfaced on the new Home (Jam Sessions, Shared Setlists, Practice Queue, Circle Members). They are display-only placeholders.
- Building a replacement profile-setup or preference-collection flow (no "onboarding-lite").
- Rewriting unrelated repertoire functionality. Existing repertoire add / list / detail behavior remains unchanged.
- Broad backend refactors outside the identity context's preference surface.
- Preserving any deprecated onboarding/preferences abstractions "for later".
- Migrating preference data — the app is undeployed.

## Users

- **New unauthenticated user** — discovers Campfire on the landing page and signs up.
- **Returning authenticated user** — already has an account and signs in to manage repertoire.
- **Authenticated repertoire user** — the primary persona for the new Home; uses Campfire to track songs they can play, are practising, or are learning.

There is no admin or multi-tenant role distinction in scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Authenticated user lands on the new Home (Priority: P1)

After signing in or signing up, a user is taken directly to `/home` and sees the new Campfire Control Room: a hero with their repertoire-focused CTAs, a repertoire status layer, the most recently added song (or an empty state), and a "what's coming" rail of locked future modules. They never see onboarding, never see a preferences panel, and never see an *Update Preferences* action.

**Why this priority**: This is the entire visible product change. Without it, the simplification has no destination.

**Independent Test**: Sign in or sign up with a test account; confirm the URL is `/home`, the page renders without errors for both an empty and a populated repertoire, and no preferences UI is present.

**Acceptance Scenarios**:

1. **Given** a user has just completed sign-up, **When** sign-up succeeds, **Then** the app navigates to `/home` and renders the new Home (no onboarding step in between).
2. **Given** a returning user signs in, **When** authentication succeeds, **Then** the app navigates to `/home` and renders the new Home.
3. **Given** an authenticated user has 0 songs in their repertoire, **When** they view `/home`, **Then** the "you added last" card shows the empty state ("Your repertoire is empty"), all status counters render `00`, and the primary CTA is *Add your first song*.
4. **Given** an authenticated user has ≥1 songs in their repertoire, **When** they view `/home`, **Then** the most recently added song appears in the *You added last* card with its title, artist, instrument, status, and "added X ago".
5. **Given** an authenticated user views `/home`, **When** they click *Add songs to repertoire*, **Then** the app navigates to the existing repertoire add flow.
6. **Given** an authenticated user views `/home`, **When** they click *Open repertoire*, **Then** the app navigates to `/repertoire`.
7. **Given** an authenticated user views `/home`, **When** they look at the "What's coming" rail, **Then** each module is visibly disabled with a "Soon" lock badge and is not interactive.

---

### User Story 2 — Onboarding and preferences are gone (Priority: P1)

No user — new or returning — encounters onboarding screens, preference collection, preference summaries, an *Update Preferences* button, or stale preference copy anywhere in the authenticated experience. The `/onboarding` URL no longer maps to a screen.

**Why this priority**: The product simplification *is* the removal. P1 because acceptance of the feature requires zero residual surface area.

**Independent Test**: Navigate the app as a new and returning user; search the visible UI and the running route table for any onboarding or preferences mention. Attempt to load `/onboarding` directly.

**Acceptance Scenarios**:

1. **Given** a user signs up successfully, **When** the app transitions post-sign-up, **Then** no onboarding step is shown and the user is on `/home`.
2. **Given** any authenticated user is on `/home`, **When** they inspect the page, **Then** no preference summary, no instruments/genres/context/experience readout, and no *Update Preferences* button are present.
3. **Given** an authenticated user navigates to `/onboarding` directly, **When** the route resolves, **Then** they are redirected to `/home` (see FR-014).
4. **Given** an unauthenticated user navigates to `/onboarding` directly, **When** the route resolves, **Then** they are redirected to landing (`/`), consistent with the existing protected-route behavior.
5. **Given** the codebase is searched, **When** searching active source for `@features/onboarding` imports, **Then** no active production code references it.

---

### User Story 3 — Repertoire functionality remains intact (Priority: P1)

Every existing repertoire capability — viewing the list, adding a song, editing a song, viewing detail — works identically after this change. Navigation labels and entry points may change to match the new Home, but the repertoire pages themselves are unchanged.

**Why this priority**: Repertoire is the only real product surface today; regressing it would defeat the purpose of the redesign.

**Independent Test**: As an authenticated user, perform the existing repertoire CRUD flows; confirm no regressions.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they navigate to `/repertoire` from any entry point, **Then** the existing repertoire page renders unchanged.
2. **Given** an authenticated user adds a song via the repertoire add flow, **When** they return to `/home`, **Then** the new song appears as the *You added last* card and the status counters update.
3. **Given** an authenticated user with existing songs, **When** they edit/open a song from `/home`'s last-added card, **Then** they land on the existing repertoire detail / edit screen.

---

### User Story 4 — Backend identity surface is simplified (Priority: P2)

The backend no longer exposes preference fields on the user, no longer persists a preferences row, and no longer accepts preference writes. The `firstLogin` flag is removed from the identity contract since no client uses it.

**Why this priority**: Required to keep the codebase coherent with the frontend simplification, but the user-visible flows in P1 do not require the backend change to ship in lockstep — they only require the frontend to stop reading these fields. P2 because it is the next mandatory layer of the simplification.

**Independent Test**: Run backend tests; confirm the identity context exposes only the fields the new Home uses. Hit `/me` and confirm the response no longer includes `preferences` or `firstLogin`. Confirm `/me/preferences` (if present) is removed or returns 404.

**Acceptance Scenarios**:

1. **Given** the API is running, **When** a client calls `GET /me`, **Then** the response contains only fields needed by the new Home (e.g. `id`, `email`, `displayName`, `memberSince`-equivalent) and **not** `preferences` or `firstLogin`.
2. **Given** the API is running, **When** a client calls `PUT /me/preferences` (or equivalent), **Then** the endpoint does not exist (404) or has been removed from the OpenAPI surface.
3. **Given** the database is migrated to head, **When** the schema is inspected, **Then** preference columns / tables tied solely to user musical preferences are removed and a migration documents the deletion.
4. **Given** the backend test suite runs, **When** all tests complete, **Then** tests covering preference persistence are removed (not stubbed) and identity tests pass.

---

### User Story 5 — Direct visit to removed routes is handled coherently (Priority: P3)

A user with a stale bookmark (or a leftover deep link) to `/onboarding` is not shown a broken page. The route resolves predictably according to the existing authentication-aware route model.

**Why this priority**: The app is undeployed, so real-world bookmarks are unlikely; included as defensive correctness rather than user-impact-driven priority.

**Independent Test**: Visit `/onboarding` while authenticated and unauthenticated; confirm the redirect target.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they request `/onboarding`, **Then** they land on `/home`.
2. **Given** an unauthenticated user, **When** they request `/onboarding`, **Then** they land on `/` (landing).
3. **Given** any unknown path, **When** requested, **Then** existing fallback behavior is preserved (no regression in unknown-path handling).

---

### Edge Cases

- **Empty repertoire on the new Home** — explicitly designed; "You added last" card shows empty state, *Add your first song* CTA, status counters render `00`. Covered by US1 #3.
- **Repertoire with exactly one song** — counters singularize where the design specifies (`1 IN POCKET`), otherwise pluralize.
- **"Added in last 7 days" with no fresh entries** — sub-label reads `QUIET WEEK`; counter renders `00`.
- **Localization** — current i18n keys for onboarding/preferences become unused. Stale keys are removed; new Home strings are added in the same locales currently supported (English; Portuguese if currently supported in `i18n/locales`).
- **Tweaks panel / dev controls** — any dev-only language/accent toggles are preserved only if they exist as design tweaks (not as user preferences). See Decision D-2.
- **Coming-soon CTAs** — the *Enter a jam session* button and rail tiles MUST be visibly disabled (`aria-disabled="true"`, `cursor: not-allowed`) and MUST NOT navigate.
- **Auth race** — if the user lands on `/home` before `GET /me` resolves, the page renders a loading state consistent with how the rest of the authenticated app handles initial fetches; it does not block on a removed preferences fetch.

## Requirements *(mandatory)*

### Functional Requirements

#### Onboarding removal

- **FR-001**: System MUST remove the `/onboarding` route from the active route table such that no screen renders for that path under normal navigation.
- **FR-002**: System MUST remove the `OnboardingPage` and the `@features/onboarding` feature module (components, catalogs, types, exports). Stale catalogs (`contexts`, `experiences`, instrument lists used only for collection) MUST be deleted, not retained as dead code.
- **FR-003**: System MUST remove all sign-up code paths that navigate the user to `/onboarding` after account creation. Sign-up MUST navigate directly to `/home`.
- **FR-004**: System MUST remove the `firstLogin` / `authMode` distinction from the frontend session if its only consumer was onboarding gating or first-login Home copy.
- **FR-005**: System MUST remove all i18n strings tied exclusively to the onboarding flow (labels, helper copy, CTA text). No removed key may be referenced by remaining components.

#### Preferences removal

- **FR-006**: System MUST remove the `Preferences` type, the in-session `preferences` state, the `savePreferences` action, and any persisted preferences (e.g., localStorage keys) from the frontend.
- **FR-007**: System MUST remove all preference-dependent rendering on the Home page (preference summary, instrument/genre/context/experience readouts, *Update Preferences* button).
- **FR-008**: System MUST remove the frontend API client methods, types, and fixtures for preferences (`getPreferences`, `updatePreferences`, etc.).
- **FR-009**: Backend MUST remove the `/me/preferences` endpoint (and any analogous identity preference endpoints), the `preferences` field from the `/me` response, the `Preferences` value object / DTO from the identity context, the `PreferencesRepository`, and preference-only persistence models.
- **FR-010**: Backend MUST provide an Alembic migration that drops preference-only tables/columns (e.g., the `user_preferences` table or preference columns on the user table). Because the app is undeployed, the migration may be a single drop with no data preservation.
- **FR-011**: Backend MUST update or remove identity tests, contract tests, and OpenAPI fixtures that asserted preference contracts.
- **FR-012**: System (frontend + backend) MUST remove `firstLogin` from the identity contract and from any consumer code, since onboarding is gone.
- **FR-012a**: Backend MUST remove preference-collection fields from the `POST /signup` request schema. Legacy preference payloads are not supported because the app is undeployed and backwards compatibility is unnecessary.

#### Routing

- **FR-013**: System MUST remove `onboarding` from `RouteId`, `ROUTES`, and `PROTECTED_ROUTES`.
- **FR-014**: When a user navigates to the literal path `/onboarding` (e.g., via stale bookmark), the system MUST behave as follows: if authenticated, redirect to `/home`; if unauthenticated, redirect to `/` (landing). Implementation hint: this can be achieved by `pathToRoute` mapping `/onboarding` to `landing` (which then bounces authenticated users to `/home` via the existing protected-route guard) or by an explicit redirect entry — whichever is simplest in the current hand-rolled router. No new routing framework is introduced.
- **FR-015**: All currently preserved routes (`/`, `/signin`, `/signup`, `/home`, `/repertoire`, `/repertoire/*` if present) MUST continue to work without behavioural change.

#### New Home page — content

- **FR-016**: The new Home page MUST render at `/home` and MUST be reachable only by authenticated users (existing protected-route guard).
- **FR-017**: The page MUST display a hero section containing: an accent-colored kicker (`CAMPFIRE · DASHBOARD`), a large display title (the Claude artifact uses `YOUR CAMPFIRE CONTROL ROOM.`), and a short supporting paragraph. Copy SHOULD match the artifact within reasonable tolerance and SHOULD NOT reference the user's preferences.
- **FR-018**: The hero MUST present three CTAs in priority order:
  1. **Primary**: *Add songs to repertoire* — navigates to the existing repertoire add route (e.g., `/repertoire/add` or the equivalent in the current router).
  2. **Secondary (ghost)**: *Open repertoire* — navigates to `/repertoire`.
  3. **Tertiary (disabled)**: *Enter a jam session* — visibly marked `SOON`, non-interactive.
- **FR-019**: The page MUST display a Repertoire Status grid containing three tiles:
  - **Total songs** (with `N IN POCKET` sub-label, accent-coloured value).
  - **Added · last 7 days** (sub-label `FRESH ENTRIES` when > 0, `QUIET WEEK` when 0). Counter is computed client-side from the already-fetched repertoire list by counting entries whose `createdAt` is within the last 7 days; no new backend endpoint is introduced.
  - **By status** — three stacked counters (Ready / Practicing / Learning) plus a proportional segmented bar.

  The *On the wishlist* tile from the artifact is omitted in this iteration — no wishlist data model exists and no placeholder tile is introduced (clarified 2026-04-28).
- **FR-020**: The page MUST display a *You added last* card showing the most recently added repertoire entry (sorted by `createdAt` desc), with cover, title, artist, instrument, proficiency status, and "added X ago". Card MUST offer *Open entry* and *Edit* actions that use existing repertoire detail/edit routes when present; if the current app exposes only the repertoire list route, these actions MUST fall back coherently to `/repertoire` rather than inventing new detail/edit routes in this feature.
- **FR-021**: When the repertoire is empty, the page MUST replace the *You added last* card with the empty state — fire mark, headline (`Your repertoire is empty.`), explanatory copy, and an *Add your first song* CTA.
- **FR-022**: The page MUST display a "What's coming to Campfire" rail with exactly the four locked modules from the artifact: *Jam Sessions*, *Shared Setlists*, *Practice Queue*, *Circle Members*. Each tile MUST show a "Soon" lock badge, MUST be visibly muted, and MUST be non-interactive.
- **FR-023**: The page MUST NOT include a music identity strip, a preferences readout, or an *Update Preferences* footer link, even though earlier design exploration mentioned them. (See Design Interpretation §1.)
- **FR-024**: The page MAY include a compact account footer showing the user's email and member-since date if available from the identity contract; it MUST NOT include any preference link.

#### New Home page — behaviour

- **FR-025**: The page MUST be responsive: at ≤980px the hero stacks and CTAs fill width; at ≤560px the status grid collapses to one column and the future rail collapses to one column. (Mirrors the artifact's media queries.)
- **FR-026**: All interactive elements MUST be keyboard-reachable. Disabled CTAs (coming-soon) MUST set `aria-disabled="true"` and MUST not be focusable click targets that navigate.
- **FR-027**: The page MUST use existing project styling conventions: existing CSS tokens / variables, existing typography setup, existing button primitives where they fit. No new CSS-in-JS library, no new design-system dependency.
- **FR-028**: New layout components introduced for this page (e.g., `StatTile`, `StatusBar`, `LastAddedCard`, `FutureTile`) MUST be co-located inside `pages/HomePage.tsx` or a small `features/home/` slice — not split across the wider component tree.
- **FR-029**: TypeScript strict checks MUST pass with no unused imports, unused exports, or `any` introduced for this feature.
- **FR-030**: The frontend production build (`vite build` or equivalent) MUST succeed.

### Key Entities

- **Repertoire Entry** — already exists. Required fields used by the new Home: `id`, `title`, `artist`, `instrument`, `level` (`ready` / `practicing` / `learning`), `createdAt` (or equivalent "added at"). The "added X ago" formatter derives from `createdAt`.
- **User (identity)** — after this change: `id`, `email`, `displayName`, `memberSince` (or equivalent). No `preferences`, no `firstLogin`.

## Non-Functional Requirements

- **NFR-001 · Performance**: New Home time-to-meaningful-paint on a warm cache MUST be ≤ the current Home page within ±100 ms; the page MUST NOT introduce additional blocking network requests beyond `GET /me` and the existing repertoire fetch.
- **NFR-002 · Accessibility**: Interactive elements meet WCAG 2.1 AA contrast against the artifact's near-black surface; disabled / locked controls communicate their state to assistive technology.
- **NFR-003 · Maintainability**: Removing a feature module (`@features/onboarding`) MUST not leave dangling re-exports, type aliases, or i18n keys. A grep for `onboarding` and `preferences` in active source returns only intentional residue (e.g., this spec, migration files, changelog).
- **NFR-004 · Compatibility**: No new top-level dependency is added to `package.json` for this feature. Backend dependency surface unchanged.
- **NFR-005 · Visual fidelity**: The implemented Home matches the artifact within reasonable tolerance — token usage, layout proportions, type scale, and the four sections in the documented order.

## Acceptance Criteria

A mirror of the user-visible criteria, tightened for sign-off:

- **AC-001**: No user-visible onboarding flow exists.
- **AC-002**: No Home-page preference summary or *Update Preferences* button exists.
- **AC-003**: Sign-up navigates directly to `/home` (no onboarding step).
- **AC-004**: Sign-in navigates directly to `/home`.
- **AC-005**: `/home` renders successfully when the authenticated user has zero songs and when they have many.
- **AC-006**: `/repertoire` remains accessible from `/home` and from direct navigation.
- **AC-007**: `/onboarding` resolves per FR-014 (authenticated → `/home`, unauthenticated → `/`).
- **AC-008**: No active production code under `apps/web/src` imports from `@features/onboarding`.
- **AC-009**: No active production code references the `Preferences` type, `getPreferences`, `updatePreferences`, `savePreferences`, or `firstLogin`.
- **AC-010**: Frontend `tsc --noEmit` and production build pass with zero new errors or warnings introduced by this feature.
- **AC-011**: Backend identity tests pass; tests asserting preference contracts are removed; new identity contract reflects the simplified surface.
- **AC-012**: Alembic migration runs cleanly on a fresh database and on a database at the previous head; preference tables/columns are dropped.
- **AC-013**: New Home page visually matches the four sections of `home-final.jsx` (hero + CTAs, repertoire status grid, you-added-last card, what's-coming rail) for both populated and empty states.
- **AC-014**: All assumptions, decisions, risks, and open questions in this spec are explicitly documented and resolved or carried forward.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A new authenticated user reaches a usable Home page in ≤ 2 navigation steps from landing (sign up → home), down from ≥ 5 steps in the current onboarding flow.
- **SC-002**: 100% of authenticated Home page renders complete without referring to a `Preferences` value (verifiable by code inspection — zero imports of `Preferences` from any Home-page subtree).
- **SC-003**: The frontend bundle size for the authenticated app shrinks by at least the size of the deleted `@features/onboarding` module (sanity-check that the removal is real, not just hidden).
- **SC-004**: Backend `/me` response payload size shrinks by removing the `preferences` and `firstLogin` fields; OpenAPI surface for identity drops at least one endpoint (`/me/preferences`).
- **SC-005**: Number of active source files containing the substring `onboarding` (case-insensitive) drops to zero outside of `specs/`, migration filenames, and changelog entries.
- **SC-006**: Manual walkthrough of the four required user flows (new user, returning user, /home, /onboarding redirect) shows zero residual onboarding/preferences UI.

## Data / API Implications

### Data

- Drop the `user_preferences` table (or preference columns on `users`) via a single Alembic migration. No backfill, no data preservation — the app is undeployed.
- If `users.first_login` (or equivalent) exists, drop it as part of the same or a sibling migration.

### Frontend API surface

| Removed | Replaced by |
|---|---|
| `getPreferences()` / `updatePreferences()` API client methods | — |
| `Preferences` type and `preferences` field on session user | — |
| `firstLogin` / `authMode` session state (if onboarding-only) | — |

### Backend API surface

| Endpoint | Action |
|---|---|
| `GET /me` | Strip `preferences` and `firstLogin` from the response schema. |
| `PUT /me/preferences` (or `POST`/`PATCH` equivalent) | Remove. |
| Any preference-listing endpoint (e.g. `/preferences/instruments`) | Remove. |
| `POST /signup` | Remove preference-collection inputs from the request schema; do not preserve an accept-and-ignore compatibility path. |

A new endpoint **is not** required for the new Home; it consumes existing `/me` and existing repertoire endpoints.

## Design Interpretation

The Claude Design artifact (`Home Redesign.html` + `src/home-final.jsx`) is the source of truth for the new Home's layout and content. Two notable points where the artifact and the user's spec must be reconciled:

1. **Footer "Update preferences →" link.** The `home-final.jsx` artifact ends with a compact account footer that includes an *UPDATE PREFERENCES* link. The user's spec explicitly forbids any update-preferences action. **Resolution: omit the link.** The footer may still show email and member-since; it MUST NOT contain a preferences link. (See FR-024.)

2. **"Music identity strip" and `Preferences` reuse mentioned in the design notes.** The design notes section enumerates a "Music identity strip" pulled from the existing `Preferences` object as one of the five ingredients used across the *earlier* Console / Mantle / Wall variants. The **FINAL** direction (the one we are building) explicitly says "no preferences panel" and the corresponding `HomeFinal` component does not render an identity strip. **Resolution: do not implement the music identity strip.** It is not part of the chosen final direction.

3. **Wishlist count.** The artifact references `SAMPLE_WISHLIST.length`. Production does not model a wishlist. **Resolution (clarified 2026-04-28): omit the wishlist tile entirely from the status grid in this iteration.** No wishlist data, types, or placeholder UI are introduced; the grid renders three tiles instead of four.

4. **"Added in last 7 days" derivation.** The artifact uses a static `recent7: 3`. **Resolution (clarified 2026-04-28): compute client-side from the existing repertoire collection's `createdAt` field at render time** (the field already exists on the repertoire type). No new backend endpoint is added.

5. **Visual tokens / fonts.** The artifact uses Anton, Space Grotesk, Space Mono, accent `#E8813A`, surface `#0b0b0b`. The implementation MUST reuse the project's existing token set if those tokens already exist (e.g. `--cf-accent`); otherwise it MUST add the tokens once at the project token layer rather than inline-styling them on the Home page.

## Risks

- **R-1 (low)** — A backend caller we have not catalogued still consumes `firstLogin` or `preferences`. *Mitigation*: grep the entire `apps/` tree before merging; the app is undeployed so no external callers exist.
- **R-2 (low)** — The repertoire entity does not currently expose `createdAt` and the *Added in last 7 days* counter cannot be computed accurately. *Mitigation*: see OQ-3; if missing, render `00 / QUIET WEEK` until backend adds it (does not block this feature).
- **R-3 (medium)** — Visual fidelity drifts from the artifact because tokens/fonts are not exactly mirrored in the live project. *Mitigation*: explicit token alignment step inside the implementation plan; reviewer compares side-by-side with `home-final.jsx`.
- **R-4 (low)** — The hand-rolled router's protected-route guard handles `/onboarding` differently than expected after removal. *Mitigation*: explicit redirect rule per FR-014 plus a smoke test.

## Assumptions

- **A-1**: The hand-rolled router model in `apps/web/src/app/router/` continues to be the routing solution; no react-router or similar is introduced.
- **A-2**: The existing repertoire add route already exists and is reachable as `/repertoire/add` (or the equivalent under the spec-003 implementation). The new Home links to it.
- **A-3**: The existing protected-route guard already redirects unauthenticated users to landing.
- **A-4**: `GET /me` already returns `displayName` and `email`; if `memberSince` is not present, the footer omits it without breaking layout.
- **A-5**: i18n is currently English-only or English+Portuguese (matching the existing `i18n/locales` structure). New copy is provided in the same set of locales — no new locales added.
- **A-6**: The app is undeployed; data preservation is unnecessary.
- **A-7**: "Preferences" in this spec means *musical* preferences (instruments / genres / context / experience). It does NOT include theme, language, or accessibility settings — those remain dev tweaks (see D-2) or are out of scope.

## Decisions

- **D-1**: The new Home implements the **FINAL** direction from the artifact, not the Console / Mantle / Wall exploratory variants.
- **D-2**: Language / theme / atmosphere toggles in the design tweaks panel are **dev-only tweaks**, not user preferences. They do not become user-facing controls in this feature.
- **D-3**: The footer *Update preferences* link from the artifact is omitted (per Design Interpretation §1).
- **D-4**: New Home layout components live in `pages/HomePage.tsx` (or co-located helpers) rather than spawning a `features/home/` directory, unless code volume forces a split.

## Dependencies

- Existing `@features/repertoire` API and store — consumed by the new Home for counts, last-added song, and navigation targets.
- Existing identity backend endpoints (post-simplification) — `/me` and the auth endpoints.
- Existing routing, auth guard, and session store on the frontend.
- Existing CSS token layer and shared UI primitives (`AccentButton`, `GhostButton`, etc.).

## Open Questions

- **OQ-1: Sign-up payload reduction** — Resolved 2026-04-28: remove preference fields entirely from `POST /signup`; do not accept-and-ignore legacy preference payloads.
- **OQ-2: Wishlist data model** — Resolved 2026-04-28: omit the tile entirely; no wishlist components are introduced in this iteration.
- **OQ-3: Repertoire `createdAt` availability** — Resolved during planning audit: the current frontend repertoire `Entry` type and API mapping expose `createdAt`, so Home can sort by `createdAt` and compute *Added · last 7 days* client-side.

No open clarification markers remain after planning.

## Implementation Notes (2026-04-28)

- Implemented stale `/onboarding` handling by mapping it to `landing` in the hand-rolled router, plus authenticated landing bounce to `/home`.
- Removed frontend onboarding module, session preference state, and preference API calls; sign-up and Google stub now navigate directly to `/home`.
- Replaced `HomePage` with Control Room layout driven by existing repertoire store data only.
- Simplified backend identity contract and persistence by removing `first_login`, preference repository/use case, `/me/preferences`, and associated schema fields.
- Added Alembic migration `0004_remove_identity_preferences.py` and regenerated `specs/002-backend-auth-slice/contracts/openapi.json`.
