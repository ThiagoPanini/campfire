# 0004 — Frontend stack

- **Status**: Accepted
- **Date**: 2026-05-12

## Context

The MVP now needs its first runnable frontend. The web app must cover the single flow in `docs/mvp-scope.md`: account creation, sign-in, one personal repertoire, and CRUD for song entries.

The design handoff for this slice was exported as React-oriented HTML/CSS/JS and the selected direction is **Workshop**: a warm-dark, monochrome, monospace-forward interface.

## Decision

Use **React + TypeScript + Vite** for `apps/web`, managed through the existing **pnpm workspace** direction from ADR 0001.

No frontend application framework, UI component library, global state library, routing library, or CSS framework is introduced for this first slice.

## Consequences

**Positive**:

- Matches the component shape of the design handoff with minimal translation overhead.
- Gives the MVP a small, fast, typed frontend with straightforward local development.
- Avoids committing to routing, server rendering, or a design-system library before the product has multiple real screens.
- Keeps the first app deployable as a static frontend while backend integration remains a separate decision.

**Negative**:

- Client-side persistence in the current implementation is only a local development stand-in for the future API and database.
- Vite is an app-level build choice; if the product later needs server rendering or framework-level data loading, that will require a follow-up ADR.

## Deferred

- Backend integration contract.
- Authentication provider or session mechanism.
- Production hosting and deploy provider.
- End-to-end test strategy.

## Implementation note (2026-05-16)

The stack decision (React + TypeScript + Vite in a pnpm workspace) stands. The first runnable slice that actually landed under this ADR was **not** the MVP CRUD described in the Context section above — it is a single landing-page poster (`apps/web/src/home/Home.tsx`) on the `mvp/lofi-style` branch, used to explore visual direction. The "Workshop" direction named in the original Context has shifted in practice toward a warm-dark, monospace, VHS-poster aesthetic; whether that is a refinement of Workshop or a new direction is still open. None of the account, repertoire, or persistence code described in the original Context exists yet. This note preserves the original decision while keeping current readers honest about what shipped.
