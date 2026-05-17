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

## Implementation note (2026-05-17)

The stack decision (React + TypeScript + Vite in a pnpm workspace) stands and has been extended:

- `react-router-dom` was added later for browser routing — see [ADR 0006](./0006-frontend-routing.md). The "no routing library" stance in the original decision is superseded by 0006 for the MVP, not by this note.
- The "Workshop" direction named in the original Context evolved into the lo-fi / VHS / monospace aesthetic now codified in [DESIGN.md](../../DESIGN.md). DESIGN.md is the source of truth for design direction going forward; this ADR is no longer the place to track that.
- What has shipped on `mvp/lofi-style`: the landing poster (`/`), modal auth surfaces (`/signup`, `/signup/confirm`, `/signin`), an `/app` placeholder, and a stub auth client in `apps/web/src/auth/client.ts`. The account, repertoire, and persistence code described in the original Context still does not exist; the next step against this ADR is the FastAPI backend + repertoire screen.
