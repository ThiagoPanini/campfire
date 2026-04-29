# Phase 0 Research: App Home Redesign — Remove Onboarding & Preferences

## Decision: Remove preferences from both frontend and backend

**Rationale**: The product spec explicitly requires removal of user-visible
preference behavior, preference API contracts, persistence, tests, and
`firstLogin`. The app is undeployed, so there is no external compatibility or
data-preservation requirement.

**Alternatives considered**:
- Frontend-only hiding: rejected because it leaves dead product behavior in
  `/me`, `/me/preferences`, persistence, tests, and OpenAPI.
- Backend compatibility shim that accepts and ignores old preference payloads:
  rejected because FR-012a says legacy sign-up preference payloads are not
  supported.

## Decision: Use existing repertoire list data for Home

**Rationale**: The new Home can derive all real metrics from the existing
`Entry` type: total, `createdAt` recent count, most recently added song, and
`proficiency` counts. This avoids a new endpoint and satisfies the performance
constraint.

**Alternatives considered**:
- New Home dashboard endpoint: rejected as unnecessary aggregation for demo
  scale.
- Static/mocked Home metrics: rejected because the spec requires the populated
  and empty repertoire states to reflect real repertoire data.

## Decision: Omit wishlist and preference footer from Claude artifact

**Rationale**: The selected artifact contains two pieces that conflict with the
spec: a wishlist tile without a data model and an `UPDATE PREFERENCES` footer
link. The spec clarifies wishlist should be hidden and preferences must not be
visible.

**Alternatives considered**:
- Placeholder wishlist tile: rejected by clarification.
- Disabled update preferences link: rejected because the acceptance criteria
  require no preferences UI.

## Decision: Treat `/onboarding` as a stale deep link, not an active route

**Rationale**: Removing onboarding from `RouteId`, `ROUTES`, and
`PROTECTED_ROUTES` prevents normal navigation from rendering it. A special
`pathToRoute` mapping or tiny redirect effect can still satisfy authenticated
and unauthenticated stale-link behavior.

**Alternatives considered**:
- Keep an onboarding route that redirects: rejected because it preserves an
  active route id and route table entry the spec says to remove.
- Let unknown-route fallback handle everything: acceptable only if it also
  redirects authenticated users to `/home`; otherwise add the explicit stale
  path handling.

## Decision: Preserve language/accent controls as display settings

**Rationale**: `AccentControls` stores display choices in `sessionStorage`; it
does not collect musical preferences. The spec explicitly says "Preferences"
means instruments/genres/context/experience. The stale aria label should be
renamed to avoid user-facing "preferences" copy.

**Alternatives considered**:
- Delete accent/language controls: rejected as unrelated scope and a regression
  to landing/dev controls.

## Decision: Add a forward migration, do not rewrite historical migrations

**Rationale**: Existing migrations already create and seed preferences. Adding
`0004_remove_identity_preferences.py` documents the product deletion and works
from previous head and fresh databases.

**Alternatives considered**:
- Edit `0001` and `0002`: rejected because it rewrites history and makes the
  deletion less auditable.
- Keep the table unused: rejected because the spec requires persistence removal.

## Decision: Co-locate Home helpers unless size forces a small split

**Rationale**: The spec asks for simple composition and allows helpers inside
`HomePage.tsx`. The page-specific helpers (`StatTile`, `StatusBar`,
`LastAddedCard`, `FutureTile`) do not need a reusable design-system surface.

**Alternatives considered**:
- New `features/home` slice: acceptable only if the implementation becomes too
  large for one page file.
- Shared UI abstractions: rejected until another page needs them.
