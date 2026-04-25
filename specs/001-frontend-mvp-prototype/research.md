# Research: Campfire Frontend MVP Prototype

## Decision: Use a root-level Vite React TypeScript app

**Rationale**: The repository has no existing frontend app. Vite gives a small, fast app shell for a frontend-only prototype, and React matches both Claude design exports, which are React-shaped HTML/JSX prototypes. TypeScript gives enough structure for mock session, catalogs, and copy tables without adding backend architecture overhead.

**Alternatives considered**:

- Plain HTML/CSS/JS copied from the Claude export: rejected because the implementation needs maintainable routes, reusable components, and docs.
- Next.js: rejected because server rendering and routing infrastructure are unnecessary for this frontend-only mock prototype.
- Keeping the Claude UMD/Babel setup: rejected because production implementation should not run Babel in the browser or depend on CDN UMD scripts.

## Decision: Target Node.js 24 LTS, React 19.2, and Vite 8

**Rationale**: Node.js 24 is an active LTS release suitable for application work. React 19.2 is the current React major documented by React. Vite 8 is the current supported Vite major and a good fit for fast local frontend iteration.

**Alternatives considered**:

- Node.js 22 LTS: still acceptable, but Node.js 24 is the current active LTS baseline.
- React 18: compatible with the Claude prototype, but new work should use the current React major unless a compatibility issue appears.
- Vite 7: still receives backports, but Vite 8 is the active major for new projects.

References:

- React versions: https://react.dev/versions
- Node.js releases: https://nodejs.org/en/about/releases/
- Vite 8 announcement: https://vite.dev/blog/announcing-vite8
- Vite supported versions: https://vite.dev/releases

## Decision: Port the final Claude design tokens and copy, not the older token file

**Rationale**: The spec says `Campfire Landing.html` wins over root `DESIGN.md` and older bundle tokens. The final iteration uses dark `#131313`, Anton/Space Grotesk/Space Mono, warm accent presets, the animated fire icon, and the onboarding catalog shape.

**Alternatives considered**:

- Use `styles/tokens.css` from the bundle: rejected because the spec identifies it as older Fraunces/Manrope serif direction.
- Use root `DESIGN.md` globally: rejected because the Claude design supersedes it except where Home is missing.
- Use only modular `src/*` campfire-v3 files: rejected because those represent an earlier broader jam-circle/product shell direction and conflict with the final minimal landing/auth/onboarding direction.

## Decision: Treat `design-reference/project/src/*` as home and data reference only

**Rationale**: The user asked to plan using files from Claude Design (`campfire-v3`). The modular files include valuable mock song data, shell ideas, and a richer home/profile concept. The MVP spec, however, only requires Home as an extrapolated protected app shell with a member panel and update preferences action. Implementation should borrow data names and warm visual language carefully without expanding scope into full jam/library/profile behavior.

**Alternatives considered**:

- Implement all `campfire-v3` screens including Profile and library rails: rejected as scope creep against the current spec.
- Ignore `src/*` completely: rejected because `home.jsx`, `data.jsx`, and `shell.jsx` help ground the Home direction requested by the user.

## Decision: Model routing in React state with URL route synchronization

**Rationale**: The prototype needs five primary routes and direct-route guard behavior, but no server. A small client router can map `/`, `/signin`, `/signup`, `/onboarding`, and `/home` to screens, redirect protected routes to landing when no mock session exists, and reset session state on full refresh.

**Alternatives considered**:

- Full React Router dependency: acceptable but not necessary unless tasking reveals complexity.
- Internal screen-only state with no URLs: rejected because the spec calls them routes and manual acceptance should exercise direct protected-route behavior.

## Decision: Keep auth user and preferences in memory; keep language/accent in `sessionStorage`

**Rationale**: Clarification established that user/auth/preferences reset on refresh while language and accent persist for the tab session. React state satisfies mock auth/preferences. `sessionStorage` maps exactly to current-tab persistence for language/accent without implying durable user data.

**Alternatives considered**:

- `localStorage`: rejected because it outlives the tab and conflicts with the clarification.
- Persist all mock state across refresh: rejected by clarification.
- Persist nothing: rejected because language/accent must survive for the tab session.

## Decision: Defer automated tests for the first frontend prototype slice

**Rationale**: The constitution requires proportional rigor, not preemptive ceremony. This slice is a visual, frontend-only prototype that is likely to change while the design is validated. Manual acceptance against the spec is cheaper than setting up and maintaining Playwright/Vitest flows during this stage. Automated tests should be added when behavior stabilizes, a regression appears, or a later backend/infrastructure slice depends on the frontend behavior.

**Alternatives considered**:

- Playwright E2E now: deferred because browser automation would add setup and maintenance cost before the prototype behavior is stable.
- Vitest unit tests now: deferred because the current logic is small and visible through manual flows; add focused unit tests later if session/validation logic grows.
- No acceptance discipline: rejected because the spec still needs a repeatable manual checklist for the core journeys.

## Decision: Stand up Mintlify docs with `docs.json` and one feature page

**Rationale**: The constitution and spec require docs-as-code in the same change set. Current Mintlify docs use `docs.json` for configuration and navigation. A minimal root `docs.json` plus `docs/overview.mdx` and `docs/frontend/campfire-mvp-prototype.mdx` is enough for the first frontend slice.

**Alternatives considered**:

- Defer docs until backend: rejected by constitution.
- Put docs only in `specs/`: rejected because technical docs should be the user-facing Mintlify documentation site.

Reference:

- Mintlify settings: https://www.mintlify.com/docs/settings
- Mintlify navigation: https://www.mintlify.com/docs/navigation
