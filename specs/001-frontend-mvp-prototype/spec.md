# Feature Specification: Campfire Frontend MVP Prototype

**Feature Branch**: `001-frontend-mvp-prototype`
**Created**: 2026-04-24
**Status**: Draft
**Input**: User description: "Implement the Campfire design (Landing, Sign in, Sign up, Onboarding, Home) as a frontend-only prototype with mock data, preserving the visual and interaction direction defined in the project DESIGN.md and Claude Design export."

## Context

Campfire is a music hub for people who play in small, informal circles, refocused around **tracking the songs you know to play and sharing them with others**. The MVP frontend turns the Claude Design export into a clickable prototype that walks the canonical user journey end-to-end against mock state. Authentication, persistence, and any backend integration are out of scope.

### Authoritative design reference

The Claude Design bundle has been retrieved and is mirrored under `design-reference/` inside this spec directory. The canonical artifact is `design-reference/project/Campfire Landing.html` — a single self-contained React prototype containing four screens (Landing, Sign In, Sign Up, Onboarding). The companion chat transcript at `design-reference/chats/chat1.md` documents the user's intent across three iterations; the final iteration (this file) supersedes earlier ones. Where this spec diverges from root-level `DESIGN.md`, the Claude Design wins.

### What the Claude Design ships vs. what this spec extends

The design ships:

- Four production-relevant screens: **Landing, Sign In, Sign Up, Onboarding**.
- A bilingual copy table (EN / PT-BR) covering every visible string.
- Five selectable accent presets: `EMBER #FF6B2B`, `FLAME #FFAA00`, `GOLD #FFD166`, `COPPER #E8813A` (default), `BRASS #D4A84B`. `COPPER` is the saved default in `TWEAK_DEFAULTS`.
- Concrete catalogs for onboarding (instruments, genres, contexts, goals, experience levels) — see Key Entities.
- Animated fire icon (3-layer flicker) and a single shared `fadeUp` page-entrance animation.
- A "Tweaks Panel" floating widget that lets the designer switch screen / accent / language at runtime.

This spec extends the design in two narrow, intentional ways consistent with the user's prompt:

1. **Home screen** — the user's prompt explicitly includes Home in the journey, but the Claude Design Landing.html does **not** ship a home page. Home requirements below are extrapolated from root `DESIGN.md` §11 (kicker `CAMPFIRE · HOME`, personalized welcome headline, member panel, `UPDATE PREFERENCES` action).
2. **Form validation and mock auth states** — the design submits forms with no validation and no error path. The user's prompt explicitly asks for "forms, validation, and mocked success/error states." This spec adds them.

### What is excluded as visual placeholder

- The **Tweaks Panel** (`AppTweaks` component): scaffolding from the Claude Design editor. The underlying capabilities (language switching, accent switching) are real product features, but the floating panel UI is not shipped.
- The older `tokens.css` file in the bundle: it reflects an earlier design iteration (Fraunces/Manrope serif palette, ember/red colors) that the user explicitly discarded in chat iteration 2. Ignore it; the live tokens are inlined in `Campfire Landing.html`.

## Clarifications

### Session 2026-04-25

- Q: Which state should survive a browser refresh within the same tab? → A: User/auth/preferences reset on refresh; language and accent persist for the tab session.
- Q: What should happen when a user opens home or onboarding without an active mock session? → A: Redirect unauthenticated access to landing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-time visitor reaches the home screen via sign-up (Priority: P1)

A musician arrives at the Campfire landing page, follows the primary call to action to create an account, fills in mock credentials, completes the onboarding preferences step, and lands on the personalized home screen. Each step preserves the design system: typography, accent usage, spacing, and copy match the Claude Design export; root `DESIGN.md` is a synchronized companion reference and fallback only for Home details not present in the export.

**Why this priority**: This is the "happy path" the prototype exists to demonstrate. Without it, there is no usable MVP and no way to evaluate the design end-to-end.

**Independent Test**: Open the prototype's landing route, click `ENTER CAMPFIRE`, complete the sign-up form with any well-formed mock email/password, complete onboarding, and confirm arrival at home with the chosen display name visible. No backend is required.

**Acceptance Scenarios**:

1. **Given** a visitor on the landing page, **When** they click `ENTER CAMPFIRE`, **Then** they are routed to the sign-up screen with the `JOIN CAMPFIRE` title (or PT `ENTRAR NO CAMPFIRE`) and the form layout from the design source.
2. **Given** a visitor on the sign-up screen, **When** they submit a well-formed email and a password of at least 8 characters, **Then** the prototype simulates a successful sign-up and routes them to onboarding with the kicker `STEP 2 OF 2`.
3. **Given** a user on onboarding, **When** they make any combination of selections (or none) and click `START TRACKING`, **Then** the button transitions through a `SAVING…` state and routes to the home screen.
4. **Given** a user reaches the home screen for the first time, **When** the page renders, **Then** the headline reads `WELCOME BACK, {DISPLAY_NAME}.` using the mock display name and the member panel shows the first-login state with the mock email.

---

### User Story 2 - Returning user signs in (Priority: P1)

A returning visitor lands on the page, taps the nav `SIGN IN` action, enters credentials matching a known mock account, and is taken straight to the home screen (skipping onboarding because preferences are already on file in mock state).

**Why this priority**: Sign-in is the second critical entry path for the journey and validates that the prototype distinguishes a "returning" state from a "first login" state visually, which `DESIGN.md` §11 requires.

**Independent Test**: From the landing page, click `SIGN IN`, submit the seeded mock credentials (e.g., `ada@campfire.test` / `campfire123`), and confirm the home screen renders without going through onboarding and shows the returning state in the member panel.

**Acceptance Scenarios**:

1. **Given** the seeded mock account exists, **When** the user submits its email and password on `/signin`, **Then** the prototype routes them directly to home and the member panel shows the returning-user variant.
2. **Given** any other email/password combination on `/signin`, **When** the user submits the form, **Then** the page displays the documented error message in the error color and remains on `/signin`.

---

### User Story 3 - Google sign-in / sign-up affordance (Priority: P2)

Both auth screens expose the `CONTINUE WITH GOOGLE` button matching the four-color Google `G` mark in the design. Clicking it simulates a successful managed-identity handoff and routes forward — to onboarding from sign-up, to home from sign-in.

**Why this priority**: The Google button is part of the design's promised interaction set on both auth screens, but it is a parallel path to email/password (P1) rather than a separate journey.

**Independent Test**: From either `/signin` or `/signup`, click `CONTINUE WITH GOOGLE` and confirm forward routing matches the source screen without leaving the prototype.

**Acceptance Scenarios**:

1. **Given** the sign-up screen, **When** the user clicks `CONTINUE WITH GOOGLE`, **Then** the prototype simulates success and routes to onboarding.
2. **Given** the sign-in screen, **When** the user clicks `CONTINUE WITH GOOGLE`, **Then** the prototype simulates success and routes to home as the seeded mock account.

---

### User Story 4 - Update preferences from home (Priority: P3)

From the home screen, the user clicks `UPDATE PREFERENCES` and is taken back to the onboarding page with their previously-mocked selections pre-checked. They can adjust selections and return to home.

**Why this priority**: Closes the navigation loop documented in `DESIGN.md` §11, but is not required for a first walkthrough of the journey.

**Independent Test**: After reaching home, click `UPDATE PREFERENCES`, change one chip selection, save, and confirm the home screen re-renders and the underlying mock state reflects the change for the rest of the session.

**Acceptance Scenarios**:

1. **Given** a user on home, **When** they click `UPDATE PREFERENCES`, **Then** they land on onboarding with all previously-selected chips and option cards already in the selected state.
2. **Given** the user changes a selection and submits, **Then** they return to home and the mock preference state is updated for the current session.

---

### Edge Cases

- Submitting the auth forms with an empty or malformed email shows inline validation styling and prevents submission.
- Submitting the auth forms with a password shorter than the documented minimum shows inline validation and prevents submission.
- Submitting onboarding with zero selections is permitted (matching design source); `SKIP FOR NOW` and `START TRACKING` both reach home.
- Switching language mid-journey re-renders all visible copy on the current screen without losing form state or selections.
- Switching the accent preset mid-journey updates every accent-driven element (hero highlight, badge, buttons, chips, focus ring) on the current screen immediately.
- Refreshing the page mid-journey resets route, auth user, and preference state to the landing page while preserving the active language and accent preset for the tab session.
- Opening home or onboarding without an active mock session redirects to the landing page.
- At viewport widths from 360 px to 1440 px, nav, hero type, feature tiles, chips, and option cards reflow without horizontal scroll.
- Users with `prefers-reduced-motion: reduce` enabled see content without the fade-up entrance and without flame flicker.
- Long emails on the home member panel wrap with `word-break: break-all` rather than overflowing the panel.

## Requirements *(mandatory)*

### Functional Requirements

#### Routing & navigation

- **FR-001**: The prototype MUST expose five primary routes: landing, sign-in, sign-up, onboarding, and home. (No auth-callback page is shipped; the Claude Design omits it and form submission routes directly.)
- **FR-002**: The fixed top nav MUST appear on every route at 58 px tall with the animated fire icon, `CAMPFIRE` wordmark, and `ALPHA` badge on the left. Right-side action MUST be context-appropriate: `SIGN IN` (`ENTRAR` in PT) on landing; the same key acts as `BACK` on auth and onboarding; `SIGN OUT` on home.
- **FR-003**: The landing primary CTA (`ENTER CAMPFIRE` / `ENTRAR NO CAMPFIRE`) MUST route to sign-up. The nav action MUST route to sign-in. Each auth page MUST link to the other via the inline mode-swap link defined in the design copy table.
- **FR-003a**: Opening the home or onboarding route without an active mock session MUST redirect to landing.

#### Landing page

- **FR-004**: The landing page MUST render, in order: the kicker `EARLY ACCESS · CURRENTLY IN ALPHA` (PT: `ACESSO ANTECIPADO · EM FASE ALPHA`) preceded by a 32 px accent-colored line; the four-line uppercase hero with the closing phrase in the accent color (EN: `TRACK THE SONGS / YOU KNOW TO PLAY / AND SHARE / WITH OTHERS.`; PT: `REGISTRE AS / MÚSICAS QUE VOCÊ / SABE TOCAR / E COMPARTILHE.`); the supporting paragraph from the design copy table; and the large `ENTER CAMPFIRE` accent button.
- **FR-005**: The landing page MUST render the three feature tiles in a single bordered (`1px solid #222`, radius 20 px, no gutters) grid with `auto-fit, minmax(240px, 1fr)`. Tile 1 uses the accent color background with black text and the `list` icon; tile 2 uses `#181818` with accent icon and `#bbb` body text and the `target` icon; tile 3 uses dark warm `#3D1A00` with accent icon and `#bbb` body text and the `people` icon. Kickers per language come from the design copy table (`YOUR REPERTOIRE` / `WHAT TO PRACTICE` / `SHARE WITH YOUR CIRCLE`, PT equivalents).
- **FR-006**: The landing footer MUST render the alpha disclaimer (`Campfire is in alpha. Expect rough edges.` / `O Campfire está em alpha. Espere imperfeições.`) on the left and `© 2025 CAMPFIRE` on the right, both in mono uppercase 9 px on a `1px solid #1a1a1a` top border.

#### Authentication pages

- **FR-007**: Sign-in MUST display the title `WELCOME BACK` (PT `BEM-VINDO DE VOLTA`); sign-up MUST display `JOIN CAMPFIRE` (PT `ENTRAR NO CAMPFIRE`). Both pages MUST follow the documented vertical order inside a 400 px max-width column: brand cluster (fire icon + `CAMPFIRE` wordmark + `ALPHA` badge) → display title → Google button → `OR` / `OU` divider → email field → password field → full-width accent submit (`SIGN IN`/`CREATE ACCOUNT`/PT) → mode-swap link → error region.
- **FR-008**: Both auth pages MUST perform client-side validation: the email field rejects empty or malformed values; the password field rejects values shorter than 8 characters. Errors MUST be communicated with text plus styling, never color alone.
- **FR-009**: Submitting a well-formed sign-up form MUST simulate success and route to onboarding. Submitting a well-formed sign-in form whose credentials match the seeded mock account MUST simulate success and route to home; any other credentials MUST surface the localized error message and keep the user on the page.
- **FR-010**: The `CONTINUE WITH GOOGLE` button (PT `CONTINUAR COM GOOGLE`) on either auth page MUST simulate a successful managed-identity sign-in: from sign-up, route to onboarding as a new mock account; from sign-in, route to home as the seeded mock account. No real OAuth handshake occurs and no auth-callback page is rendered.

#### Onboarding

- **FR-011**: Onboarding MUST render, in a 640 px max-width column: a kicker `STEP 2 OF 2` (preceded by a 24 px accent line); the title `ONE LAST THING` (PT `ÚLTIMA ETAPA`); the supporting copy from the design copy table.
- **FR-012**: Onboarding MUST present the five preference groups in the order defined by the design, each preceded by an accent-colored mono section title:
  1. Instruments (multi-select chips) — catalog: Guitar, Bass, Drums, Piano / Keys, Vocals, Violin, Cavaquinho, Ukulele, Cajón, Mandolin, Flute, Other.
  2. Favorite genres (multi-select chips) — catalog: Rock, MPB, Samba, Jazz, Forró, Bossa Nova, Pop, Blues, Country, Metal, Reggae, Funk, Other.
  3. Where you usually play (single-select option cards with emoji + label): `🫂 Roda de amigos`, `🎸 Banda amadora`, `🎤 Banda profissional`, `🎧 Prática solo`, `🙏 Grupo de louvor`, `🔥 Sessões / Jam sessions`. Card labels remain in Portuguese in both EN and PT modes (matches the Claude Design source; flagged in Assumptions).
  4. Goals (multi-select chips) — six options, English-only in the source: `Learn new songs faster`, `Track my full repertoire`, `Share my set with the group`, `Prepare for jam sessions`, `Practice more consistently`, `Know what I can already play` (flagged in Assumptions).
  5. Experience level (single-select option cards with sub-label): `Beginner` (Less than 1 year), `Learning` (1–3 years), `Intermediate` (3–7 years), `Advanced` (7+ years).
- **FR-013**: Multi-select chips MUST use pill radius 40 px, accent fill on selected, `#1e1e1e` background and `#888` text on unselected. Single-select option cards MUST use 10 px radius, `#1a1a1a` base, and an `accent + 18` alpha tint plus accent border on selected. Section titles use the active accent color.
- **FR-014**: The primary action MUST be `START TRACKING` (PT `COMEÇAR A REGISTRAR`) and MUST transition to a `SAVING…` loading label for at least 600 ms before routing to home. The secondary ghost button `SKIP FOR NOW` (PT `PULAR POR ENQUANTO`) MUST also route to home without modifying mock preference state. (The Claude Design source routes both to landing; this spec routes to home to honor the user's stated journey.)
- **FR-015**: When entered via `UPDATE PREFERENCES` from home, onboarding MUST hydrate every group with the user's current mock selections.

#### Home (protected app shell — extrapolated from `DESIGN.md` §11; not present in Claude Design)

- **FR-016**: Home MUST render the kicker `CAMPFIRE · HOME`, the headline `WELCOME BACK, {DISPLAY_NAME}.` with the mock display name interpolated, and the supporting paragraph from `DESIGN.md` §11. Localized PT equivalents follow the same copy-table pattern as other screens.
- **FR-017**: Home MUST render the compact member panel: background `#181818`, border `1px solid #222`, radius 20 px, surfacing the first-login or returning state, the mock display name, and the mock email. Long emails MUST `word-break: break-all`.
- **FR-018**: Home MUST expose a primary `UPDATE PREFERENCES` action routing to onboarding in update-mode, and the nav `SIGN OUT` action MUST clear the in-memory mock session and route to landing.

#### Visual system fidelity

- **FR-019**: The prototype MUST use `#131313` as page background, `#181818` as surface, `#1e1e1e` / `#222` / `#1a1a1a` for borders, and `#FF6B6B`-class red for error text. Display font is `Anton`; body is `Space Grotesk`; mono / labels / buttons / badges use `Space Mono`. Type scales come from the inlined CSS in `Campfire Landing.html` (hero `clamp(52px, 11.5vw, 118px)`; auth title `clamp(34px, 7vw, 52px)`; onboarding title `clamp(36px, 7vw, 56px)`).
- **FR-020**: The accent color MUST be one of five presets — `EMBER #FF6B2B`, `FLAME #FFAA00`, `GOLD #FFD166`, `COPPER #E8813A`, `BRASS #D4A84B` — with `COPPER` as the default. The active accent MUST drive: hero highlight, alpha kicker line, alpha-badge background, primary button fill, input focus border, nav action color, chip selected state, option-card selected tint, and section titles. The selection MUST persist for the tab session; the `Tweaks Panel` UI from the design source is **not** shipped, but the underlying capability MAY be exposed via a simple in-app control.
- **FR-021**: All shared components (nav, fire icon, alpha badge, mono labels, accent button, ghost button, form input, Google button, multi-chip, single-card) MUST match the design's hover, focus, and selected states. Accent-button hover swaps to `rgba(255,255,255,0.12)` background with `#fff` text and a faint white border; ghost-button hover lightens border to `#555`; input focus changes border to the active accent.
- **FR-022**: Page entrance MUST animate via the `fadeUp` animation (16 px translate + opacity over 0.5 s ease, with `0.06s/0.12s/0.18s` staggers as in the Landing hero). The fire icon MUST animate via the three-layer flicker (`flicker`, `flicker2`, `emberPulse`). All decorative motion MUST be suppressed when `prefers-reduced-motion: reduce` is set.

#### Internationalization

- **FR-023**: The prototype MUST ship full English and Brazilian Portuguese copy tables matching the `COPY` object in `Campfire Landing.html`, covering nav, kickers, hero, CTAs, feature tiles, footer, auth titles/labels/buttons/swap-links, divider, Google label, onboarding title/subtitle/section labels, and onboarding actions.
- **FR-024**: The active language MUST be selectable in-app, default to English, and persist for the tab session. Switching language MUST update all visible copy synchronously without a full page reload.

#### Mock data & session

- **FR-025**: The prototype MUST ship a single seeded mock account (display name, email, password, pre-selected onboarding preferences) used to demonstrate the returning-user path on sign-in.
- **FR-026**: Sign-up MUST mint a new in-memory mock account from the submitted email (display name derived from the local-part) with empty preferences, used for the duration of the tab session.
- **FR-027**: The prototype MUST NOT persist authenticated user data or preferences across refreshes and MUST NOT make network calls to authentication or storage backends. Language and accent preset are allowed to persist for the current tab session.

#### Accessibility

- **FR-028**: All form inputs MUST have visible labels (mono uppercase 9 px above the field); primary focus states MUST use the accent border on inputs and a visible focus ring on buttons; the journey from nav action through form submission MUST be fully keyboard navigable.
- **FR-029**: Decorative SVG (the fire icon when adjacent to the wordmark) MUST be `aria-hidden="true"`; error messaging MUST always include text, never relying on color alone.

#### Technical documentation

- **FR-030**: This feature MUST ship with technical documentation in Mintlify, versioned in the same repository and updated in the same change set as the implementation. At minimum, the docs MUST describe the chosen frontend stack, local run workflow, route map, mock session model, and where the authoritative design artifacts for this prototype live.
- **FR-031**: The technical documentation for this feature MUST include an implementation-oriented page (or equivalent section) covering component/screen structure, state boundaries for auth/onboarding/home flows, and the project conventions needed to extend the prototype without re-reading the full design bundle.

### Key Entities *(include if data involved)*

- **MockUser**: In-memory representation of an authenticated user. Attributes: display name, email, password (mock only, never persisted or transmitted), first-login flag, preferences object.
- **Preferences**: Onboarding selections. Attributes: `instruments[]`, `genres[]`, `context` (single), `goals[]`, `experience` (single id from `beginner|learning|intermediate|advanced`).
- **InstrumentCatalog**: 12 fixed labels — Guitar, Bass, Drums, Piano / Keys, Vocals, Violin, Cavaquinho, Ukulele, Cajón, Mandolin, Flute, Other.
- **GenreCatalog**: 13 fixed labels — Rock, MPB, Samba, Jazz, Forró, Bossa Nova, Pop, Blues, Country, Metal, Reggae, Funk, Other.
- **ContextCatalog**: 6 fixed entries (id, label, emoji), labels in Portuguese — see FR-012.
- **GoalCatalog**: 6 fixed English-only labels — see FR-012.
- **ExperienceCatalog**: 4 fixed entries (id, label, sub) — Beginner, Learning, Intermediate, Advanced.
- **AccentPreset**: Five entries — `EMBER`, `FLAME`, `GOLD`, `COPPER` (default), `BRASS` — each with `label`, primary `value` (hex), and `dark` companion (hex).
- **CopyTable**: Two language entries (`en`, `pt`) covering every visible string on landing, auth, onboarding screens (and home, extrapolated).
- **MockSession**: Tracks the current authenticated user (or null) and preference state in memory until refresh, plus the active language (`en`/`pt`) and active accent preset for the tab session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can complete the full landing → sign-up → onboarding → home journey in under 90 seconds without leaving the prototype or seeing a 404/500-style error state.
- **SC-002**: 100% of the copy strings in the bilingual `COPY` table from `Campfire Landing.html` are present in the prototype in both EN and PT, and every screen visually matches the design source's tokens, typography, and spacing when reviewed side-by-side.
- **SC-002a**: All five accent presets (EMBER, FLAME, GOLD, COPPER, BRASS) are selectable and propagate to every accent-driven element across all screens.
- **SC-003**: The seeded returning-user account reaches home in 3 or fewer interactions from the landing page (nav `SIGN IN` → submit credentials → land on home).
- **SC-004**: All five primary routes render without horizontal scroll at viewport widths from 360 px to 1440 px, and all interactive controls remain reachable and operable via keyboard alone.
- **SC-005**: With `prefers-reduced-motion: reduce` enabled, no decorative entrance or flame animation plays, and all functional content remains visible and usable.
- **SC-006**: The prototype produces zero network requests to authentication, storage, or analytics endpoints during any documented user journey.
- **SC-007**: A new contributor can open the Mintlify docs for this feature and identify, without inspecting source code first, how to run the prototype locally, which routes/screens exist, how mock session state flows between them, and which design artifact is the authoritative reference.

## Assumptions

- The Claude Design bundle has been retrieved and mirrored under `design-reference/` in this spec directory; `design-reference/project/Campfire Landing.html` is the authoritative source. Where root-level `DESIGN.md` and the bundle's own `tokens.css` disagree with this file, the Claude Design wins.
- The Home screen is not present in the Claude Design source. Its requirements (FR-016 through FR-018) are extrapolated from `DESIGN.md` §11, justified by the user's prompt explicitly listing Home in the journey. If the user later supplies a Home design, the corresponding requirements should be re-validated.
- The auth-callback page from `DESIGN.md` §9 is **not** part of this MVP because the Claude Design omits it. Form submission and Google sign-in route directly without an interstitial.
- The Tweaks Panel widget in the Claude Design is editor scaffolding and is excluded from the prototype. Its functional capabilities (language switch, accent preset switch) remain real product features but are exposed via simpler in-app controls (placement deferred to `/speckit.plan`).
- The "Where do you usually play" option labels are intentionally Portuguese-only in both EN and PT modes, matching the design source (`CONTEXTS` is hardcoded in the React file). Same applies to the "What do you want from Campfire?" goal labels which are English-only in both modes. These are knowingly preserved; if treated as a defect, fix in a follow-up spec.
- Password minimum length is 8 characters for client-side validation in this MVP prototype.
- The seeded mock account uses non-secret demo values (e.g., `ada@campfire.test` / `campfire123`); exact strings are an implementation detail finalized in `/speckit.plan`.
- "Frontend-only" means no real auth provider, no remote persistence, no real Google OAuth handshake; the Google button simulates a successful handoff only.
- Onboarding's groups are treated as **optional** for the MVP — the user can submit any subset (matching the design source where chips have no required-minimum check). `SKIP FOR NOW` is a documented escape that bypasses any selection.
- Mock auth and preference state lives in memory only and resets on full page refresh; language and accent preset persist for the current tab session.
- Routing, state management, styling, and tooling choices are deferred to `/speckit.plan`. The Claude Design uses a single React tree with internal state machine; the implementation may use any equivalent stack as long as observable behavior matches.
- The Mintlify information architecture for this repository is not yet established. `/speckit.plan` must define the initial docs location, navigation entry, and page naming for this feature before implementation begins.
- The prototype targets modern evergreen desktop and mobile browsers from 360 px to 1440 px; legacy browser support is out of scope.
