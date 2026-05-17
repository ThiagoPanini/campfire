# 0006 — Frontend routing

- **Status**: Accepted
- **Date**: 2026-05-16

## Context

The web app is moving beyond a single landing-page slice. The MVP now needs multiple client-side routes: `/`, `/signup`, `/signup/confirm`, `/signin`, and the eventual authenticated control plane at `/app`.

This is still a small React + Vite app, so the routing layer should be boring, well-known, and easy for any React developer to maintain. The near-term routes are mostly static, but later auth guards will need a route-aware place to redirect unauthenticated users.

## Decision

Use `react-router-dom` for browser routing in `apps/web`.

The initial implementation uses `BrowserRouter`, `Routes`, `Route`, `Link`, `useNavigate`, and `useLocation`. Route definitions live in `App.tsx`; router setup lives in `main.tsx`.

## Alternatives Considered

- **TanStack Router**: Type-safe and capable, but newer and heavier than the MVP needs for four or five mostly static routes.
- **Wouter**: Very small and pleasant, but too minimal for the route guards and auth-flow ergonomics we expect to need soon.
- **Hand-rolled routing**: Avoids one dependency, but would create bespoke infrastructure for a solved React problem.

## Consequences

**Positive**:

- Mature React ecosystem default with broad developer familiarity.
- Enough API surface for nested routes and auth guards when the walking skeleton reaches authenticated repertoire screens.
- Keeps routing explicit without adopting a full application framework.

**Negative**:

- Adds a dependency before the backend exists.
- Route behavior now depends on the deployment host serving the Vite app fallback for deep links.

## Deferred

- Auth guard shape for `/app`.
- Error-boundary routing.
- Data-router adoption, if server data loading later makes it useful.
