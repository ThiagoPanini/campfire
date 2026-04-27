# ADR-0009 — Catalog search is proxied through the backend

**Status**: Accepted
**Date**: 2026-04-27
**Slice**: `003-repertoire-song-entry`
**Supersedes**: —
**Superseded by**: —

## Context

When the user types into the song search field, *something* has to
call the external music catalog. The two natural shapes are:

1. **Browser-direct** — the React component fetches
   `https://api.deezer.com/search` directly with `fetch()`.
2. **Backend proxy** — the React component calls
   `GET /repertoire/songs/search` on our API; the API calls Deezer
   server-side and returns a shaped response.

The driving requirements:

- **FR-001** — only authenticated users may add, list, update, or
  remove repertoire entries; *and* only authenticated users may
  reach the search surface (the spec scopes search inside the same
  authenticated feature).
- **FR-016** — the backend MUST enforce a per-authenticated-user
  rate limit on search calls and MUST serve repeated identical
  queries from a short-lived in-memory cache rather than re-hitting
  the external catalog.
- **FR-013** — the system persists six specific fields on add. Wire
  shape stability is a load-bearing property.
- **FR-014** — when the external catalog is unavailable, the
  failure must surface as a non-blocking error and existing
  repertoire viewing/removing/updating must continue to work.

## Decision

All catalog access is **proxied through the backend** at
`GET /repertoire/songs/search`. The browser never calls
`api.deezer.com` directly.

## Alternatives considered

| Option | Verdict | Reason |
|---|---|---|
| **Browser-direct** | Rejected | Cannot satisfy FR-016 (server-side per-user rate limit, server-side cache). Cannot enforce FR-001 (no way to gate the call by Campfire authentication). Couples the React component to Deezer's response shape, weakening FR-013's wire stability. Relies on the third-party's CORS posture. |
| **Hybrid** (browser-direct, backend persists on add) | Rejected | All the cons of browser-direct, plus a second integration point. |
| **Backend proxy** (this ADR) | Accepted | Single integration point, satisfies all four FRs above. |

## Consequences

**Positive**
- Authentication is enforced (the route requires a bearer token via
  the existing `get_current_session` dependency).
- Per-user rate limit and short-lived cache live where the spec
  says they live.
- Wire shape is ours; we expose `SearchResult`, not Deezer's payload.
  Provider swap (ADR-0007) is invisible to the frontend.
- Failure isolation: when Deezer is down, the backend returns
  `503 song catalog unavailable`. The frontend renders a
  non-blocking state per FR-014 without knowing the provider's
  identity.

**Negative**
- One extra network hop per query (~50–200 ms). Mitigated by the
  60 s in-memory cache and amortized across the typing pattern
  (debounce + repeat-query cache hit).
- The backend is on the critical path for search. If our API is
  down, search is down. Acceptable: identity is also on the critical
  path, so this doesn't change the failure mode of "Campfire is
  down." The spec only requires that catalog-down does not break
  existing-entry flows; it does not require that API-down preserve
  search.

## Trigger to revisit

We would consider going browser-direct if (a) the catalog provider
adds a feature that requires per-call user signing keys (forcing
client-side calls), or (b) the latency budget tightens past what
the cache can amortize. Neither is plausible at v1 scale.
