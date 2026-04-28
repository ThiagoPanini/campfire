# Feature Specification: Campfire Backend Auth Slice

**Feature Branch**: `002-backend-auth-slice`
**Created**: 2026-04-26
**Status**: Draft
**Input**: User description: "Specify a backend slice for Campfire that replaces the in-memory mock auth and preferences in apps/web/ with a real FastAPI service. Strictly limit scope to what the existing frontend already uses; do NOT specify songs, groups, jam sessions, ratings, notes, recommendations, or real Google OAuth."

## Context

This is the first backend slice for Campfire. Its sole purpose is to retire the
in-memory mock layer that powers the frontend MVP prototype (`001-frontend-mvp-prototype`)
without altering any visible product behavior beyond what the prompt explicitly
calls out as deliberate (browser-refresh session restoration). It defines the
network-side contract that the frontend's `@features/auth/api/auth.api.ts` and
`@api/client` boundary stub will adopt — nothing more.

### Source-of-truth alignment

- **Behavioral source**: `specs/001-frontend-mvp-prototype/spec.md` and
  `specs/001-frontend-mvp-prototype/data-model.md`. Any user-visible behavior
  here MUST keep that spec passing its existing manual acceptance script.
- **Frontend boundary**: `apps/web/src/features/auth/api/auth.api.ts` (mock
  surface to replace), `apps/web/src/features/auth/session.store.ts` (call
  sites), `apps/web/src/api/client.ts` (real-backend stub), and
  `apps/web/src/mocks/README.md` (boundary contract — only `features/*/api/*`
  imports `@mocks/*`; replacing this slice should be a localized change).
- **Architectural source**: the constitution at
  `specs/001-frontend-mvp-prototype/design-reference/project/uploads/constitution.md`
  — modular monolith, DDD bounded contexts, hexagonal layering, privacy by
  default (Principle V).

### Why now / why this scope

The frontend prototype works against fixtures and resets on refresh. Two
real-product needs push us to a backend now: (a) preferences must survive a
browser refresh once the prototype graduates from "design walkthrough" to
"usable for testers," and (b) we must stop carrying a fake password on the
client. Every other backend concern (songs, groups, jam sessions, etc.) is
deferred — they belong to later slices once auth and the user/preferences
context are real.

## Clarifications

### Session 2026-04-26

- Q: Access-token expiry signaling on login/refresh responses? → A:
  Return `{ accessToken: string, tokenType: "Bearer", expiresIn: number }`
  where `expiresIn` is the access-token lifetime in seconds (OAuth 2.0 /
  RFC 6749 convention). The same shape applies to login, refresh, and the
  Google-stub response. Clients compute their proactive-refresh deadline
  relative to receipt time so server-clock skew does not propagate to
  the frontend.
- Q: Access-token format — opaque session reference or JWT? → A: Opaque.
  The access token is a server-issued opaque string tied to a Session
  record; every authorized request validates it via a server-side session
  lookup. Sign-out and refresh-reuse take effect on the next request
  without waiting for token expiry. No JWT, no JWKS, no published claim
  schema. Consumers MUST treat the token as an opaque bearer string.
- Q: Rate limiting on credential-touching endpoints in v1? → A: Coarse
  rate limit on `POST /auth/register` and `POST /auth/login` only, keyed
  on client IP and target email (10 attempts per rolling 5-minute window
  per key combination). The refresh endpoint is exempt because single-use
  rotation with reuse-detection already self-limits abuse, and the Google
  stub is dev-only and feature-flagged. 429 is a documented response on
  the two limited endpoints; the limiter store is in-memory in v1 and may
  be moved to a shared store in a later slice.
- Q: Refresh-token delivery channel — JSON body or HttpOnly cookie? → A:
  HttpOnly cookie. The refresh token is delivered as an
  `HttpOnly; Secure; SameSite=Lax` cookie scoped to the refresh endpoint.
  The access token stays in the JSON response body and is held in memory by
  the frontend. Driven by SC-002 (refresh must survive a browser reload)
  combined with OWASP ASVS / Auth0 SPA guidance against storing refresh
  tokens in `localStorage` or `sessionStorage` where XSS can read them. CORS
  must allow credentials, and a CSRF guard is required on the refresh
  endpoint.
- Q: Must the seeded user from the frontend remain bit-for-bit compatible
  (`ada@campfire.test` / `campfire123`)? → A: Yes — preserved verbatim so
  the existing manual acceptance script and the frontend's seeded sign-in
  path keep working without any test rewrites.
- Q: Should refresh tokens rotate? Single-use? → A: Yes. Each refresh issues
  a new access token AND a new refresh token; the previous refresh token is
  invalidated immediately (single-use). Reuse of a consumed refresh token
  invalidates the entire session family.
- Q: Should we keep a password path at all, or only OAuth in v2? → A: Keep
  email/password to mirror the frontend exactly. Real Google OAuth is
  explicitly out of scope; the "Continue with Google" button is wired to a
  development-only stub endpoint that mints a session for a fixed managed
  test user.
- Q: Privacy default per constitution Principle V — confirm `/me` is the only
  user-data endpoint exposed in v1? → A: Yes. The only endpoints that read or
  write user data in v1 are `GET /me` and `PATCH /me/preferences`, both
  scoped to the authenticated caller. No listing, lookup, or admin endpoint
  is exposed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Returning user signs in and lands on home (Priority: P1)

The seeded musician opens the prototype, taps `SIGN IN`, submits the seeded
credentials, and arrives on the home screen with their previously-saved
preferences hydrated. Submitting wrong credentials surfaces the existing
localized error and keeps them on the sign-in page.

**Why this priority**: This is the demo-critical path that proves the backend
swap preserves the frontend's existing returning-user journey end-to-end.
Without it, the prototype regresses.

**Independent Test**: With the API running and the seed migration applied,
submit `ada@campfire.test` / `campfire123` from `/signin`. Expect a 200
response carrying access + refresh tokens, an authenticated `GET /me` that
returns `firstLogin: false`, the seeded display name, and the seeded
preferences. Submit any other credential pair and expect a 401 with no
tokens.

**Acceptance Scenarios**:

1. **Given** the seed migration has run, **When** the user submits the
   seeded email and password, **Then** the API returns an access token, a
   refresh token, and a session identifier; `GET /me` with the access token
   returns the seeded display name, email, `firstLogin = false`, and the
   seeded preferences object.
2. **Given** the seed migration has run, **When** the user submits any
   non-seeded email/password, **Then** the API returns 401 with a generic
   "invalid credentials" payload that does not disclose whether the email
   exists.
3. **Given** an authenticated session, **When** the access token has expired
   but the refresh token is still valid, **Then** exchanging the refresh
   token returns a new access token and a new refresh token, and the
   previous refresh token can no longer be used.

---

### User Story 2 - First-time user signs up, completes onboarding, and refresh survives a reload (Priority: P1)

A new musician fills the sign-up form, completes onboarding, lands on home,
and reloads the browser. After reload they remain signed in and their
preferences are still on file. This is a deliberate behavior change from the
mock prototype, where refresh resets to landing.

**Why this priority**: Without persistent registration and persistent
preferences, the backend slice does not deliver value over the mock.

**Independent Test**: Register with a fresh email and an 8+ character
password. Expect a session to be issued, `firstLogin = true` from `GET /me`,
and empty preferences. `PATCH /me/preferences` with a valid Preferences
payload, then re-fetch `GET /me` and verify the saved selections. Simulate a
browser reload by re-hydrating the refresh token; expect a new access token
and an authenticated `GET /me` that still returns the saved preferences.

**Acceptance Scenarios**:

1. **Given** the email is not registered and the password is at least 8
   characters, **When** the user submits the sign-up form, **Then** the API
   stores the user with the password hashed using a memory-hard algorithm
   (argon2), returns access + refresh tokens, and `GET /me` returns
   `firstLogin = true` with empty preferences.
2. **Given** the email is already registered, **When** the user submits the
   sign-up form again, **Then** the API returns a conflict response and does
   not create a duplicate account or leak whether the password was correct.
3. **Given** an authenticated session, **When** the user submits a valid
   `PATCH /me/preferences` payload, **Then** the new preferences fully
   replace the stored selections and a subsequent `GET /me` returns them.
4. **Given** an authenticated session and a stored refresh token, **When**
   the user reloads the browser and the frontend exchanges the refresh
   token, **Then** the user remains signed in without re-entering
   credentials and `GET /me` still reflects the saved preferences.

---

### User Story 3 - Continue with Google keeps working via a dev stub (Priority: P2)

The `CONTINUE WITH GOOGLE` button on either auth screen continues to take the
user forward without performing a real OAuth handshake. From sign-up it
produces a fresh managed test session (first-login state); from sign-in it
produces the seeded returning-user session.

**Why this priority**: The button exists in the design and is a documented
parallel path. Real OAuth is a later slice; in v1 we only need to keep the
button non-broken.

**Independent Test**: Call the documented Google-stub endpoint with the
"sign-up" and "sign-in" intents and verify each returns a usable session
token pair. The seeded sign-in intent must yield the same identity as the
email/password seeded login (same user id, display name, email, and
preferences).

**Acceptance Scenarios**:

1. **Given** the Google stub endpoint is reachable, **When** the frontend
   invokes it from the sign-up screen, **Then** the API returns a session
   for a fixed managed-google test user with `firstLogin = true` and empty
   preferences (creating the user on first call, reusing it thereafter).
2. **Given** the Google stub endpoint is reachable, **When** the frontend
   invokes it from the sign-in screen, **Then** the API returns a session
   for the seeded user with `firstLogin = false` and the seeded preferences.
3. **Given** any deployment whose configuration disables the Google stub,
   **When** the frontend invokes it, **Then** the API returns a clear "not
   available" response and the button surfaces the existing localized error.

---

### User Story 4 - Explicit sign-out invalidates the session server-side (Priority: P2)

From home, the user clicks `SIGN OUT`. The backend revokes both the access
token (or its session record) and the refresh token. Any subsequent call to
`GET /me` with the revoked tokens returns 401.

**Why this priority**: Required to make the contract honest — the frontend
already drops local state on sign-out, but without server-side revocation a
leaked refresh token could outlive a user-visible logout.

**Independent Test**: Sign in, capture the token pair, call the sign-out
endpoint, then attempt `GET /me` with the access token (expect 401) and
attempt the refresh exchange with the refresh token (expect 401).

**Acceptance Scenarios**:

1. **Given** an authenticated session, **When** the user calls sign-out,
   **Then** both the access token's session and the corresponding refresh
   token are marked revoked.
2. **Given** a session that has been signed out, **When** any client calls
   `GET /me` or the refresh endpoint with the revoked tokens, **Then** the
   API returns 401.

---

### Edge Cases

- Submitting registration with a malformed email or a password shorter than
  8 characters returns a structured 422 validation error, mirroring the
  existing client-side validation rules from FR-008 of the frontend spec.
- Submitting `PATCH /me/preferences` with any id outside the documented
  catalogs (instruments, genres, contexts, goals, experience) returns 422
  and does not partially apply the change.
- Submitting `PATCH /me/preferences` with the existing nullable shape
  (`context: null`, `experience: null`, empty arrays) is valid and clears
  those fields.
- Calling any authenticated endpoint without a token, with a malformed
  token, or with an expired token returns 401 with no user data.
- Reusing a refresh token that has already been consumed by a successful
  refresh invalidates the entire session family and returns 401, forcing
  the user to sign in again.
- The seed migration is idempotent — re-running it against a database that
  already contains the seeded user does not duplicate, reset preferences, or
  rotate the seeded password hash.
- The Google stub endpoint is environment-gated. Production builds default
  to disabled; the development environment defaults to enabled.
- A request from any allowed development origin (the Vite dev server)
  including credentials and `Authorization` headers MUST succeed without
  being blocked by CORS preflight.
- The health endpoints (`/healthz`, `/readyz`) do not require authentication
  and do not return any user data, configuration, or version information
  beyond what is needed for liveness/readiness signals.
- The 11th login or registration attempt within a rolling 5-minute window
  from the same (IP, email) pair returns 429 with a `Retry-After` header
  and is not counted as a credential-validation event.

## Requirements *(mandatory)*

### Functional Requirements

#### Identity and credentials

- **FR-001**: The service MUST accept a registration request carrying an
  email and a plaintext password and persist a user with the password
  stored only as an argon2 hash. The plaintext password MUST never be
  logged, returned, or stored.
- **FR-002**: Email addresses MUST be normalized (trimmed and lowercased)
  before storage and comparison. Two registrations with the same normalized
  email MUST be treated as a conflict.
- **FR-003**: Password input on registration MUST require a minimum length
  of 8 characters to mirror the frontend's existing client-side validation
  rule.
- **FR-004**: A successful registration MUST persist the user, create an
  empty `Preferences` record, and set `firstLogin = true` until preferences
  are saved at least once. Saving preferences once flips `firstLogin` to
  `false` for subsequent `GET /me` responses.
- **FR-005**: The display name MUST be derived from the email local-part on
  registration and MUST NOT be user-editable in v1, matching the frontend's
  current behavior.

#### Authentication and sessions

- **FR-006**: The service MUST expose an email/password authentication
  endpoint that, on success, returns a JSON body of the shape
  `{ "accessToken": string, "tokenType": "Bearer", "expiresIn": number }`
  where `expiresIn` is the access-token lifetime in seconds, AND sets the
  refresh token as an `HttpOnly; Secure; SameSite=Lax` cookie scoped to
  the refresh endpoint path. The refresh token MUST NOT appear in any
  JSON response body. The same response shape applies to the refresh
  endpoint and to successful Google-stub responses.
- **FR-007**: Access tokens MUST be opaque server-issued strings tied to a
  Session record (no JWT, no signed claims, no JWKS). Every authorized
  request MUST validate the token by looking up its Session and rejecting
  any session that is expired, revoked, or whose family has been
  invalidated. Access tokens MUST be short-lived (target: 15 minutes).
  Refresh tokens are likewise opaque server-side records (target lifetime:
  14 days) tied to a single user and a single session family. The
  contract MUST treat both tokens as opaque to clients; consumers MUST NOT
  attempt to decode either.
- **FR-008**: The service MUST expose a refresh endpoint that, given a
  valid refresh-token cookie, issues a new access token in the JSON
  response body AND replaces the refresh-token cookie with a freshly
  rotated one (single-use rotation). The supplied refresh token MUST be
  revoked atomically with the issuance of the new pair.
- **FR-008a**: The refresh endpoint MUST be protected against CSRF.
  Acceptable mitigations include requiring a non-cookie credential on the
  request (e.g., the current access token in the `Authorization` header,
  or a double-submit anti-CSRF token) in addition to the refresh-token
  cookie. The mitigation strategy MUST be documented in the contract and
  enforced by the HTTP adapter.
- **FR-009**: The service MUST detect refresh-token reuse — a refresh
  attempt with a token that has already been consumed MUST revoke the
  entire session family for that user, clear the refresh-token cookie,
  and return 401.
- **FR-010**: The service MUST expose a sign-out endpoint that revokes the
  current access session, revokes the refresh token, and clears the
  refresh-token cookie (`Max-Age=0`) on the response. Subsequent
  authenticated calls with either token MUST return 401.
- **FR-011**: All authentication and refresh failures MUST return a generic
  401 response that does not disclose whether the email exists, whether the
  password was wrong, or whether the token was expired vs. revoked.
- **FR-011a**: `POST /auth/register` and `POST /auth/login` MUST be rate
  limited at 10 attempts per rolling 5-minute window per (client IP,
  target email) key combination. Requests that exceed the window MUST
  return 429 with a `Retry-After` header and MUST NOT count against the
  caller's authentication state (a 429 is neither a success nor an
  authentication failure for revocation purposes). The refresh endpoint
  and the Google stub are explicitly exempt. The limiter store is
  in-memory in v1 (per-process), with the explicit acceptance that
  multi-process deployments would defeat it; a shared limiter store is a
  later-slice concern.

#### User profile and preferences

- **FR-012**: The service MUST expose `GET /me` returning the authenticated
  user's `displayName`, `email`, `firstLogin`, and `preferences` object.
  The response MUST NOT include the password hash, the user id (beyond
  what's already in the access token), or any other internal field.
- **FR-013**: The `preferences` object on `GET /me` MUST use the exact
  shape the frontend already consumes (per
  `specs/001-frontend-mvp-prototype/data-model.md`):
  `instruments: string[]`, `genres: string[]`, `context: string | null`,
  `goals: string[]`, `experience: string | null`.
- **FR-014**: The service MUST expose `PATCH /me/preferences` accepting the
  same shape and validating each id against the frontend catalogs. The
  validation set MUST mirror the catalog ids in
  `specs/001-frontend-mvp-prototype/data-model.md` exactly:
  - Instruments: 12 entries (Guitar, Bass, Drums, Piano / Keys, Vocals,
    Violin, Cavaquinho, Ukulele, Cajón, Mandolin, Flute, Other).
  - Genres: 13 entries (Rock, MPB, Samba, Jazz, Forró, Bossa Nova, Pop,
    Blues, Country, Metal, Reggae, Funk, Other).
  - Contexts: 6 entries (Roda de amigos, Banda amadora, Banda profissional,
    Prática solo, Grupo de louvor, Sessões / Jam sessions).
  - Goals: 6 entries (Learn new songs faster, Track my full repertoire,
    Share my set with the group, Prepare for jam sessions, Practice more
    consistently, Know what I can already play).
  - Experience: `beginner | learning | intermediate | advanced`.
- **FR-015**: `PATCH /me/preferences` MUST be a full-replacement operation
  on the user's preferences (not a partial merge), matching the frontend's
  current `savePreferences(next: Preferences)` semantics.
- **FR-016**: Any unknown id submitted to `PATCH /me/preferences` MUST
  cause the entire request to fail with a 422 response and no field MUST be
  partially applied.

#### Google managed-identity stub

- **FR-017**: The service MUST expose a single development-only endpoint
  that mints a session for a fixed managed-google test user without
  performing any real OAuth handshake. It MUST accept an `intent`
  distinguishing "sign-up" (managed-google fixture, first-login state) from
  "sign-in" (seeded user, returning state).
- **FR-018**: The Google stub endpoint MUST be feature-flagged and disabled
  by default in production builds. When disabled it MUST return a clear
  "not available" response that the frontend can surface as the existing
  localized error.
- **FR-019**: When invoked with the "sign-in" intent, the stub MUST issue
  tokens for the seeded user (same identity as the email/password seeded
  login). When invoked with the "sign-up" intent, the stub MUST upsert a
  fixed managed-google fixture user (e.g., `google.member@campfire.test`)
  and issue tokens for it; on first call the user is created with
  `firstLogin = true` and empty preferences, on subsequent calls the
  existing record is reused.

#### Seeding for local dev

- **FR-020**: The service MUST ship a seed migration that creates the
  seeded mock account from the frontend bit-for-bit:
  email `ada@campfire.test`, password `campfire123` (stored as argon2 hash
  of that exact plaintext), display name and seeded preferences taken
  verbatim from `apps/web/src/mocks/fixtures/user.ts`.
- **FR-021**: The seed migration MUST be idempotent: re-running it against
  a database that already contains the seeded user MUST NOT raise, MUST NOT
  rotate the stored hash, and MUST NOT reset the user's saved preferences.

#### Operational endpoints

- **FR-022**: The service MUST expose an unauthenticated health endpoint
  suitable for container-orchestration liveness/readiness probes. It MUST
  return a small, non-sensitive payload sufficient for an external prober
  to distinguish "process is up" from "process is down" and MUST NOT
  expose configuration, version, dependency, or user data.

#### CORS and origins

- **FR-023**: The service MUST accept cross-origin requests from the local
  Vite dev origin (`http://localhost:5173` by default; configurable via
  environment). CORS MUST allow credentials (`Access-Control-Allow-Credentials: true`)
  so the refresh-token cookie flows on the refresh and sign-out endpoints,
  MUST allow the `Authorization` and `Content-Type: application/json`
  request headers, and MUST cover preflight for all verbs used by the
  documented endpoints. Because credentials are allowed, the
  `Access-Control-Allow-Origin` header MUST echo a specific configured
  origin and MUST NOT be `*`.
- **FR-024**: Allowed origins MUST be configuration-driven, not hard-coded,
  so that future preview / staging deployments can extend the list without
  a code change. The default CORS allow-list in production builds MUST be
  empty unless explicitly configured.

#### Privacy and exposure

- **FR-025**: The only endpoints that read or write user-owned data in v1
  are `GET /me` and `PATCH /me/preferences`, both scoped to the
  authenticated caller. No listing, search, lookup-by-email, or admin
  endpoint MUST be exposed in this slice.
- **FR-026**: All write operations MUST be authorized strictly against the
  caller's own user id. The service MUST NOT accept a target user id from
  the client on any user-data write.
- **FR-027**: Logs and error responses MUST NOT include passwords, password
  hashes, refresh-token values, access-token values, or full email
  addresses in clear (logging at most the user id is acceptable).

#### Architecture and layering (constitutional)

- **FR-028**: The implementation MUST follow the modular-monolith /
  hexagonal layering required by the constitution: a domain layer
  containing user, credentials, and preferences (no infrastructure imports);
  an application layer exposing explicit use cases (register, authenticate,
  refresh, sign-out, get-me, update-preferences, google-stub-sign-in); and
  adapter layers for HTTP, persistence, and password hashing.
- **FR-029**: The HTTP edge MUST be a thin adapter that maps requests to
  application use cases and serializes results — no business logic in
  route handlers.
- **FR-030**: Contracts at the system edge (request and response payloads,
  status codes, error shapes) MUST be documented and stable across this
  slice; the documented contract is the source of truth for the frontend
  swap.

### Key Entities *(include if feature involves data)*

- **User**: Persistent identity. Attributes: stable id, normalized email,
  display name (derived from email local-part), password hash (argon2),
  `firstLogin` flag (true until preferences saved at least once), created /
  updated timestamps. Backs both email/password and Google-stub paths
  (Google-stub upserts a fixed fixture user).
- **Credentials**: Conceptual record bound to a User holding the argon2
  parameters and hash. Modeled distinctly from the User to keep the domain
  layer free of infrastructure concerns.
- **Preferences**: Stored selections owned by a User. Same shape as the
  frontend's existing object (`instruments[]`, `genres[]`, nullable
  `context`, `goals[]`, nullable `experience`). Replaced wholesale on
  every `PATCH /me/preferences`.
- **Session**: A long-lived identity for a logged-in client. Attributes:
  stable session id, owning user id, refresh-token family, created /
  revoked timestamps, revocation reason.
- **AccessToken**: A short-lived (~15 min) opaque server-issued bearer
  token tied to a Session record. Validated on every authorized request
  via a session lookup; revocation is immediate (the next request after
  sign-out, refresh-rotation, or family invalidation fails with 401). Not
  a JWT, not self-describing, not decodable by clients.
- **RefreshToken**: A single-use, server-recorded token tied to a Session
  family. Delivered to the browser as an `HttpOnly; Secure; SameSite=Lax`
  cookie scoped to the refresh endpoint path; never appears in a JSON
  response body. Issuing a new pair revokes the prior refresh token;
  reusing a consumed refresh token revokes the entire family.
- **CatalogId**: The validated id space for preference selections.
  Authoritative source: `specs/001-frontend-mvp-prototype/data-model.md`.
  The backend MUST ship a fixture that mirrors that file exactly and MUST
  reject any id outside it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five frontend pages (Landing, Sign In, Sign Up,
  Onboarding, Home) pass the existing manual acceptance script from
  `specs/001-frontend-mvp-prototype/spec.md` end-to-end with the mock layer
  removed and the real API in front, with zero changes required to the
  manual script.
- **SC-002**: A user who has signed in can reload the browser and remain
  signed in via the refresh-token exchange, with their preferences still
  visible on the home / onboarding screens. (Deliberate behavior change
  from the mock prototype, captured here as a P1 acceptance.)
- **SC-003**: After a user calls sign-out, every subsequent `GET /me` and
  refresh attempt with the previously-issued tokens returns 401 within the
  first request.
- **SC-004**: A reviewer can stand up the API locally, run the seed
  migration once, and sign in with `ada@campfire.test` / `campfire123`
  successfully on the first attempt, with no extra configuration steps
  beyond what is documented.
- **SC-005**: Re-running the seed migration against a database that already
  contains the seeded user produces no duplicate users, no preference
  changes, and no errors.
- **SC-006**: The frontend dev server (Vite, default origin) can call every
  documented endpoint, including credentialed and JSON-bodied requests,
  without any CORS-related browser console error.
- **SC-007**: Inspecting the API's response payloads across every
  documented endpoint yields zero occurrences of password material (clear
  or hashed) and zero occurrences of refresh-token values being echoed
  back outside the explicit token-issuing endpoints.
- **SC-008**: A new contributor reading only the contract documentation can
  identify, without inspecting source code, every endpoint exposed in v1,
  the request/response shape of each, and which catalog ids are accepted
  for preferences.

## Out of Scope

The following are explicitly **not** part of this slice and MUST NOT be
inferred into the implementation:

- **Songs / repertoire**: no song entity, no repertoire endpoint, no
  instrument-context capabilities, no proficiency model.
- **Groups / jam sessions**: no group entity, no session entity, no
  performance notes, no ratings, no comments.
- **Real Google OAuth**: no OAuth client config, no token exchange with
  Google, no real id-token validation. The "Continue with Google" button
  is wired to a development stub only.
- **Account recovery and security extras**: no password reset emails, no
  email verification, no MFA, no account lockout, no password-strength
  scoring beyond the 8-character minimum.
- **File and media handling**: no uploads, no avatar storage, no media
  serving.
- **Recommendations and analytics**: no recommendation endpoints, no event
  tracking, no analytics pipeline.
- **Observability beyond basic logs**: no metrics endpoints, no tracing,
  no structured-error reporting integrations in this slice.
- **Infrastructure**: no Terraform, no LocalStack, no deployment manifests,
  no CI/CD pipelines. The slice produces a runnable local service plus
  contract documentation; deployment is a separate slice.
- **Display-name editing, profile photos, profile-visibility settings**:
  the v1 user profile is exactly what `GET /me` returns and nothing more.

## Assumptions

- The seeded mock account values from the frontend
  (`ada@campfire.test` / `campfire123`, plus the seeded preferences in
  `apps/web/src/mocks/fixtures/user.ts`) are non-secret demo values and
  may be checked into the seed migration verbatim.
- The frontend holds the access token in memory only and never persists
  it. The refresh token lives entirely in an HttpOnly cookie set by the
  server (per the 2026-04-26 clarification), which is what allows a
  session to survive a browser reload without any JavaScript-readable
  storage of the refresh token.
- `firstLogin` is interpreted as "user has never saved preferences." Once
  `PATCH /me/preferences` succeeds, the flag flips to `false` for all
  subsequent `GET /me` responses, regardless of whether the saved
  selections were empty.
- `PATCH /me/preferences` is full-replacement (matches the frontend's
  current `savePreferences(next)` semantics). Partial-update / merge
  semantics are not in scope.
- The Google-stub fixture user is `google.member@campfire.test` (matches
  the constant the frontend currently passes to `signUpWithGoogle`),
  upserted on first invocation, with `firstLogin = true` and empty
  preferences on creation.
- Token lifetimes (15 min access, 14 day refresh) are the planning-level
  defaults; final values are an operational tuning concern in
  `/speckit.plan`. The contract requirement is only "short-lived access"
  and "rotating single-use refresh."
- The catalog-id allow-list is the authoritative copy from
  `specs/001-frontend-mvp-prototype/data-model.md`. If the frontend's
  catalogs change later, the backend's validation set is updated in the
  same change.
- Privacy by default (constitution Principle V) is interpreted in this
  slice as "no user-data endpoints beyond `/me`." Group-scoped privacy
  semantics are deferred until the groups context is introduced.
- The HTTP framework choice (FastAPI per the user prompt), the Python
  version, the migration tool, the password-hashing library, and the
  project layout are all `/speckit.plan` decisions; the spec only fixes
  that argon2 is the password-hashing algorithm and that the layering
  follows the constitution.
- The persistence engine MUST be PostgreSQL-compatible. This rules out
  SQLite, MySQL, and any Postgres-incompatible managed engine for both
  local development and any future deployment. This slice does NOT pick a
  specific managed offering — choosing between self-hosted Postgres, RDS
  Postgres, Aurora Postgres, or Aurora Serverless v2 (Postgres) is a
  downstream infrastructure decision and remains Out of Scope here. The
  constraint exists so the implementation does not adopt dialect features
  that would block a later move to an Aurora-family target.
- Any Postgres extension introduced by the implementation (e.g.,
  `pg_trgm`, `citext`, `pgcrypto`, `uuid-ossp`) MUST be verified as
  available on Aurora Postgres before adoption. The `/speckit.plan` output
  and any pull request that adds an extension MUST list the extension and
  cite its Aurora availability so the constraint stays auditable. If a
  needed extension is not Aurora-available, the implementation MUST pick
  an Aurora-compatible alternative rather than encode the dependency.
- Documentation for this slice will be added to the existing Mintlify
  docs site under a backend section; exact navigation placement is a
  `/speckit.plan` decision.

## Dependencies

- The frontend prototype (`001-frontend-mvp-prototype`) must remain the
  authoritative source of UI behavior and copy; this slice cannot ship
  contract changes that would require modifying the existing manual
  acceptance script.
- The catalog ids in `specs/001-frontend-mvp-prototype/data-model.md` must
  be available at implementation time; they are this slice's preference
  validation set.
- The constitution at
  `specs/001-frontend-mvp-prototype/design-reference/project/uploads/constitution.md`
  governs architectural choices (modular monolith, DDD, hexagonal,
  privacy by default).

## Change Log

- 2026-04-26: SC-002 implemented as an intentional behavior change from the
  mock prototype. Browser refresh after sign-in now attempts refresh-token
  rotation and keeps the user signed in when the server-side session family is
  still valid.
