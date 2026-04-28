# Implementation Plan: Campfire Frontend MVP Prototype

**Branch**: `001-frontend-mvp-prototype` | **Date**: 2026-04-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-frontend-mvp-prototype/spec.md`

## Summary

Build a frontend-only Campfire prototype that turns the Claude Design `campfire-v3` export into a real, responsive web app covering Landing, Sign In, Sign Up, Onboarding, and Home. The implementation will use a root-level Vite + React + TypeScript app, port visual tokens and screen structure from `specs/001-frontend-mvp-prototype/design-reference/project/`, model auth/onboarding/home as in-memory state, and ship Mintlify docs alongside the app.

The authoritative design inputs are:

- `design-reference/project/Campfire Landing.html`: final minimal landing/auth/onboarding direction, warm accent presets, copy table, fire header icon, and form layout.
- `design-reference/project/src/*`: richer `campfire-v3` modular app files for home/profile/shell/data patterns.
- `design-reference/chats/chat1.md`: design intent, including the final iteration that moved focus to tracking songs users know and sharing with others.
- Root `DESIGN.md`: fallback only for Home details where the final Claude export is incomplete.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19.2, Node.js 24 LTS  
**Primary Dependencies**: Vite 8, React DOM, plain CSS files, no backend/auth/storage SDKs  
**Storage**: In-memory React state for auth user and preferences; `sessionStorage` only for language and accent preset  
**Testing**: Manual acceptance checklist for this prototype slice; automated tests deferred until behavior stabilizes, a regression appears, or another slice depends on this behavior  
**Target Platform**: Modern evergreen desktop and mobile browsers, viewport width 360 px to 1440 px  
**Project Type**: Frontend web app plus Mintlify docs-as-code  
**Performance Goals**: First journey usable in under 90 seconds; route transitions and validation feel instant; no auth/storage/analytics network calls during documented journeys  
**Constraints**: Frontend-only; no real OAuth; no persistence of user/preference state across refresh; preserve Claude design visual direction; support EN/PT and five accent presets; suppress decorative motion under `prefers-reduced-motion: reduce`  
**Scale/Scope**: Five primary routes, one seeded mock account, one current-tab mock session, fixed onboarding catalogs, initial Mintlify docs skeleton

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Narrow MVP Scope**: PASS. Scope stays within frontend prototype for tracking known songs, sharing direction, auth affordances, onboarding, and a minimal home loop. Jam/session features from `campfire-v3` are design reference only unless required by the spec.
- **II. Incremental Delivery**: PASS. This is the required first frontend slice, with mocked data and no dependency on backend, LocalStack, Terraform, or CI deployment.
- **III. Boring, Proven Stack**: PASS. React + TypeScript + Vite is a conventional scalable frontend stack; no new cloud/provider/backend choices are introduced.
- **IV. Proportional Rigor**: PASS. Automated tests are deferred for this prototype slice; manual acceptance checks cover journeys, route guards, validation, i18n/accent propagation, responsive layout, reduced motion, and zero prohibited network requests.
- **V. Docs-as-Code**: PASS. Plan includes Mintlify `docs.json` and feature docs pages in the implementation change set.

## Project Structure

### Documentation (this feature)

```text
specs/001-frontend-mvp-prototype/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
├── spec.md
└── design-reference/
    ├── README.md
    ├── chats/chat1.md
    └── project/
        ├── Campfire Landing.html
        ├── Campfire.html
        └── src/*.jsx
```

### Source Code (repository root)

```text
package.json
index.html
vite.config.ts
tsconfig.json
src/
├── app/
│   ├── App.tsx
│   ├── routes.ts
│   └── session-store.ts
├── components/
│   ├── AccentControls.tsx
│   ├── FireIcon.tsx
│   ├── GoogleMark.tsx
│   ├── Nav.tsx
│   ├── buttons.tsx
│   ├── forms.tsx
│   └── preference-controls.tsx
├── data/
│   ├── catalogs.ts
│   ├── copy.ts
│   └── mock-user.ts
├── screens/
│   ├── Landing.tsx
│   ├── SignIn.tsx
│   ├── SignUp.tsx
│   ├── Onboarding.tsx
│   └── Home.tsx
├── styles/
│   ├── global.css
│   ├── tokens.css
│   └── motion.css
└── main.tsx

docs.json
docs/
├── overview.mdx
└── frontend/
    └── campfire-mvp-prototype.mdx
```

**Structure Decision**: Use a single root-level frontend application because the repository has no existing app shell and the feature is explicitly frontend-only. Keep source code under `src/` and Mintlify docs at repository root via `docs.json` plus `docs/`. Do not create automated test folders in this slice unless implementation uncovers logic complex enough that tests become the cheapest way to reason about it.

## Phase 0: Research

Research is complete in [research.md](./research.md). All technical-context unknowns are resolved.

## Phase 1: Design & Contracts

Design artifacts are complete:

- [data-model.md](./data-model.md)
- [contracts/ui-contract.md](./contracts/ui-contract.md)
- [quickstart.md](./quickstart.md)

## Constitution Check (Post-Design)

- **I. Narrow MVP Scope**: PASS. Data model and UI contract exclude real auth, backend persistence, groups, jam management, and profile pages from implementation scope.
- **II. Incremental Delivery**: PASS. Quickstart and contracts verify the standalone frontend slice locally.
- **III. Boring, Proven Stack**: PASS. Plan uses React, TypeScript, Vite, and Mintlify docs only.
- **IV. Proportional Rigor**: PASS. Manual acceptance is enough for this visual prototype; automated tests are explicitly deferred until Principle IV triggers apply.
- **V. Docs-as-Code**: PASS. Docs structure is defined and will be implemented with the feature code.

## Complexity Tracking

No constitution violations.
