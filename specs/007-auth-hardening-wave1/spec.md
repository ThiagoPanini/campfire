# Feature Specification: Auth Hardening Wave 1

**Feature Branch**: `007-auth-hardening-wave1`  
**Created**: 2026-05-01  
**Status**: Draft  
**Input**: User description: "Auth hardening (Wave 1) — close audit findings before next feature"

## Clarifications

### Session 2026-05-01

- Q: On Google promotion of an unconfirmed password account, what credential-handling policy should be used? → A: Hard delete the credentials row.
- Q: Should a transactional notice email be sent when an unconfirmed password account is promoted by Google sign-in? → A: Send a transactional notice.
- Q: What CSRF strategy should protect `/auth/refresh` and `/auth/logout`? → A: Origin-header check against `CORS_ORIGINS` only.
- Q: How should trusted proxies for `X-Forwarded-For` be configured? → A: Use a `TRUSTED_PROXIES` env var listing CIDR blocks.
- Q: Should `EMAIL_CONFIRMATION_REQUIRED=false` remain indefinitely or be removed after stabilization? → A: Incident-only escape hatch; remove after 30 days.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prevent Google Account Impersonation (Priority: P1)

A legitimate Google user who signs in with a verified Google account is protected from any previously registered, unconfirmed password account that used the same email address.

**Why this priority**: This closes the critical account-takeover finding from `AUDIT.md` section 4/5 (S-1). Without it, future features could be built on identities that attackers can later access.

**Independent Test**: Can be tested by registering an unconfirmed password account for an email, completing Google sign-in for the same email, and then attempting password login with the original password.

**Acceptance Scenarios**:

1. **Given** an unconfirmed password account exists for a legitimate Google user's email, **When** that user completes Google sign-in with the same verified email, **Then** the account is promoted to the legitimate Google user, the stale password credential row is deleted, and the original password no longer authenticates.
2. **Given** an unconfirmed password account is promoted by verified Google sign-in, **When** promotion succeeds, **Then** the user receives a transactional notice that the account now uses Google sign-in.
3. **Given** the promoted account has an active Google session, **When** the former password is submitted through password login, **Then** the response is the same generic failed-login response used for invalid credentials.
4. **Given** an existing confirmed password account links Google by verified email, **When** the user signs in with Google, **Then** existing legitimate sessions and refresh-token families remain valid.

---

### User Story 2 - Preserve Per-Attacker Rate Limits (Priority: P1)

Abuse controls for login, registration, confirmation, and Google sign-in constrain each attacker independently, instead of collapsing unrelated users into one shared deployment-wide counter.

**Why this priority**: This closes the production-blocking reverse-proxy and Google-start abuse findings from `AUDIT.md` section 4/5 (S-2, S-6). A single attacker must not weaken protection for everyone else.

**Independent Test**: Can be tested by configuring `TRUSTED_PROXIES` with trusted proxy CIDR blocks, issuing repeated auth requests with simulated `X-Forwarded-For` chains from distinct client IPs, and verifying that each IP has its own retry budget.

**Acceptance Scenarios**:

1. **Given** two attackers are sending login attempts from different client IPs, **When** one attacker exhausts their login limit, **Then** the other attacker's login limit is unaffected.
2. **Given** one attacker repeatedly submits register or confirmation requests from the same client IP, **When** the configured limit is exceeded, **Then** further attempts from that IP are rejected with a rate-limit response and a `Retry-After` value where that endpoint contract requires it.
3. **Given** a user is using the legitimate app while another IP burns its own limit, **When** the legitimate user submits an auth request, **Then** the legitimate user is not blocked by the attacker's counter.
4. **Given** a single IP repeatedly calls `POST /auth/google/start`, **When** the endpoint's limit is exceeded, **Then** the response is `429` with `Retry-After`, matching `specs/006-google-auth-login-ux/contracts/auth-google.md`.
5. **Given** the immediate peer address is within `TRUSTED_PROXIES`, **When** an auth request includes `X-Forwarded-For`, **Then** the rate-limit key uses the rightmost untrusted hop from that header chain.
6. **Given** the immediate peer address is not within `TRUSTED_PROXIES`, **When** an auth request includes `X-Forwarded-For`, **Then** the header is ignored and the immediate peer address is used as the client IP.

---

### User Story 3 - Keep Registration Enumeration-Safe (Priority: P1)

Users and attackers cannot infer whether an email is known, confirmed, unconfirmed, or unknown by submitting a password that passes transport validation but fails the domain password rules.

**Why this priority**: This closes the registration enumeration and accidental server-error finding from `AUDIT.md` section 4/5 (S-3), while preserving the no-enumeration guarantees established by earlier auth slices.

**Independent Test**: Can be tested by submitting the same valid-length but rule-failing password to `POST /auth/register` for a known confirmed email, known unconfirmed email, and unknown email, then comparing status code and body bytes.

**Acceptance Scenarios**:

1. **Given** one known confirmed email, one known unconfirmed email, and one unknown email, **When** each is submitted to `POST /auth/register` with the same password that passes minimum length but fails password rules, **Then** all three responses have the same status code and byte-identical body.
2. **Given** a registration password fails the password rules after passing basic request validation, **When** the registration request is processed, **Then** the user receives a controlled validation response and no server error reveals implementation state.
3. **Given** the existing login no-enumeration scenarios from slices 002 and 006, **When** this feature is complete, **Then** those scenarios continue to pass unchanged.

---

### User Story 4 - Block Cross-Origin Session Mutation (Priority: P1)

A user who is logged in on the legitimate web app cannot be force-refreshed or force-logged-out by visiting a hostile origin in another tab.

**Why this priority**: This closes the cross-origin refresh/logout finding from `AUDIT.md` section 4/5 (S-4). The refresh cookie remains intentionally usable by the web app, but hostile origins must not mutate session state.

**Independent Test**: Can be tested by sending production-like cross-origin `POST /auth/refresh` and `POST /auth/logout` requests with origins outside `CORS_ORIGINS` and verifying rejection, while legitimate requests from origins in `CORS_ORIGINS` continue to work.

**Acceptance Scenarios**:

1. **Given** a user has a valid refresh cookie, **When** a hostile origin outside `CORS_ORIGINS` submits `POST /auth/refresh`, **Then** the request is rejected and the user's refresh-token family is not rotated or revoked.
2. **Given** a user has a valid session, **When** a hostile origin outside `CORS_ORIGINS` submits `POST /auth/logout`, **Then** the request is rejected and the user is not logged out.
3. **Given** the legitimate web app submits refresh and logout requests in production, **When** the request `Origin` is in `CORS_ORIGINS`, **Then** refresh rotation and logout behavior remain as currently documented.

---

### User Story 5 - Fail Closed on Unsafe Production Configuration (Priority: P1)

Operators cannot accidentally start production with missing HMAC secrets for email confirmation or OAuth flow state.

**Why this priority**: This closes the hardcoded-secret fallback finding from `AUDIT.md` section 4/5 (S-7). Silent fallback would make production confirmation and OAuth flow protection depend on a public development key.

**Independent Test**: Can be tested by starting the service in production mode with each required key missing and verifying startup is refused before serving traffic.

**Acceptance Scenarios**:

1. **Given** production mode is enabled and `EMAIL_CONFIRMATION_HMAC_KEY` is unset, **When** the API starts, **Then** startup fails before accepting requests.
2. **Given** production mode is enabled and `OAUTH_FLOW_HMAC_KEY` is unset, **When** the API starts, **Then** startup fails before accepting requests.
3. **Given** a non-production environment omits these keys, **When** the API starts, **Then** existing development behavior remains available without weakening production.

---

### User Story 6 - Align Auth Configuration Contract (Priority: P2)

The frontend and API agree on the documented authentication configuration shape, so password sign-up UI can use the explicit email-confirmation flag.

**Why this priority**: This closes the contract drift finding from `AUDIT.md` section 4/5 (C-1). It is lower than the takeover and CSRF stories, but it prevents the UI and docs from diverging again.

**Independent Test**: Can be tested by requesting `GET /auth/config` and verifying the response shape and frontend behavior against `specs/006-google-auth-login-ux/contracts/auth-config.md`.

**Acceptance Scenarios**:

1. **Given** the auth config endpoint is healthy, **When** a client calls `GET /auth/config`, **Then** it receives exactly `{ google: { enabled }, passwordSignUp: { enabled, requiresEmailConfirmation } }` as the documented top-level shape.
2. **Given** password sign-up is enabled and requires email confirmation, **When** the frontend reads auth config, **Then** it uses `passwordSignUp.requiresEmailConfirmation` to decide whether to show the confirmation flow.
3. **Given** `EMAIL_CONFIRMATION_REQUIRED=false` is used as an incident rollback, **When** the feature has stabilized for 30 days, **Then** the flag is scheduled for removal rather than treated as permanent product behavior.
4. **Given** the contract markdown is the source of truth for auth config, **When** implementation and frontend types are checked, **Then** they match the documented shape.

---

### User Story 7 - Keep Email Confirmation Writes Atomic (Priority: P2)

Email confirmation remains consistent when a failure happens after a confirmation row changes but before the user is marked confirmed.

**Why this priority**: This closes the unit-of-work finding from `AUDIT.md` section 4/5 (Q-1). It prevents partial confirmation state that could confuse users and operators.

**Independent Test**: Can be tested by forcing a failure after the confirmation row is written but before the user confirmation timestamp is updated, then checking that both changes roll back.

**Acceptance Scenarios**:

1. **Given** a pending confirmation code is accepted, **When** a later failure occurs before the user's email is marked confirmed, **Then** the confirmation row and user record both remain in their previous consistent state.
2. **Given** email confirmation succeeds without failure, **When** the transaction completes, **Then** the confirmation row and user record both reflect the successful confirmation.
3. **Given** existing confirmation abuse limits and no-enumeration behavior, **When** this feature is complete, **Then** those behaviors remain unchanged.

### Edge Cases

- A promoted Google account that had an unconfirmed password credential must have the stale password credential row deleted and must not accept the old password even if the user still has existing legitimate refresh-token families.
- A promoted Google account that had an unconfirmed password credential must send exactly one transactional notice for the successful promotion, without exposing secrets, confirmation codes, or password reset links.
- Rate-limit counters must be independent for different client IPs, while repeated attempts from the same attacker IP continue to converge on the same counter.
- `X-Forwarded-For` must affect rate-limit keys only when the immediate peer is listed in `TRUSTED_PROXIES`; untrusted peers must not be able to spoof another client IP with request headers.
- Registration responses for known confirmed, known unconfirmed, and unknown emails must remain byte-identical for the specified weak-password matrix, including error body formatting.
- Cross-origin refresh/logout attempts whose `Origin` is absent from `CORS_ORIGINS` must not consume, rotate, or revoke an otherwise valid refresh-token family.
- Production startup must fail before serving traffic when either required HMAC key is missing; development startup remains usable.
- Auth config must not expose secrets, environment names, client IDs, redirect URIs, or other non-boolean operational data.
- `EMAIL_CONFIRMATION_REQUIRED=false` is an incident-only rollback escape hatch and must be marked for removal after 30 days of stabilization.
- A rollback during email confirmation must leave no partial "confirmation verified but user not confirmed" state.
- Existing sessions, refresh-token families, OAuth flow rows, cookie attributes, and refresh rotation semantics must remain compatible across deployment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When Google sign-in promotes an existing unconfirmed password account with the same verified email, the system MUST hard delete that account's existing password credential row so the previous password cannot authenticate in the future.
- **FR-002**: When Google sign-in promotion hard deletes an unconfirmed account's password credential row, the system MUST send the user one transactional notice that the account now uses Google sign-in.
- **FR-003**: Google sign-in promotion MUST preserve legitimate existing sessions, refresh-token families, and compatible OAuth flow rows across deployment.
- **FR-004**: Login, registration, email confirmation, and Google-start rate limits MUST be keyed so that attempts from different client IPs do not consume one another's budgets.
- **FR-005**: A single attacker from one client IP MUST NOT be able to deny service to unrelated users by exhausting a global auth rate-limit bucket.
- **FR-006**: `POST /auth/google/start` MUST enforce a per-IP rate limit and MUST return `429` with `Retry-After` when exceeded, consistent with `specs/006-google-auth-login-ux/contracts/auth-google.md`.
- **FR-007**: The system MUST expose `TRUSTED_PROXIES` as an environment setting containing trusted proxy CIDR blocks, configured per environment.
- **FR-008**: When the immediate peer address is inside `TRUSTED_PROXIES`, auth rate-limit keys MUST use the rightmost untrusted hop from the `X-Forwarded-For` chain.
- **FR-009**: When the immediate peer address is outside `TRUSTED_PROXIES`, auth rate-limit keys MUST ignore `X-Forwarded-For` and use the immediate peer address.
- **FR-010**: `POST /auth/register` MUST return the same observable status code and body bytes for known confirmed, known unconfirmed, and unknown emails when the submitted password passes request minimum length but fails password domain rules.
- **FR-011**: Registration password-rule failures covered by FR-010 MUST produce controlled responses and MUST NOT produce server errors that reveal implementation state.
- **FR-012**: Existing no-enumeration guarantees from slices 002 and 006 MUST continue to pass, including the existing `test_no_enumeration` family.
- **FR-013**: The registration no-enumeration test coverage MUST include the known-confirmed, known-unconfirmed, and unknown-email matrix for a valid-length but rule-failing password.
- **FR-014**: In production, `POST /auth/refresh` MUST reject requests whose `Origin` header is not allowed by `CORS_ORIGINS`.
- **FR-015**: In production, `POST /auth/logout` MUST reject requests whose `Origin` header is not allowed by `CORS_ORIGINS`.
- **FR-016**: Rejected cross-origin refresh/logout requests MUST NOT rotate, revoke, consume, or otherwise mutate the user's existing session state.
- **FR-017**: Legitimate refresh/logout requests from the authorized web app MUST preserve the existing cookie attributes and refresh-token rotation semantics.
- **FR-018**: This feature MUST use the `Origin` header plus `CORS_ORIGINS` allow-list as the CSRF control for refresh/logout and MUST NOT introduce a JS-readable double-submit CSRF token in Wave 1.
- **FR-019**: The API MUST refuse to start in production when `EMAIL_CONFIRMATION_HMAC_KEY` is unset.
- **FR-020**: The API MUST refuse to start in production when `OAUTH_FLOW_HMAC_KEY` is unset.
- **FR-021**: Non-production environments MAY continue using development defaults for local workflows, but those defaults MUST NOT be silently accepted in production.
- **FR-022**: `GET /auth/config` MUST return the documented shape `{ google: { enabled }, passwordSignUp: { enabled, requiresEmailConfirmation } }`.
- **FR-023**: The frontend MUST use `passwordSignUp.requiresEmailConfirmation` from `GET /auth/config` to drive the password sign-up confirmation UI.
- **FR-024**: `EMAIL_CONFIRMATION_REQUIRED=false` MUST be documented as an incident-only rollback escape hatch and marked for removal after 30 days of stabilization.
- **FR-025**: The auth config contract markdown MUST be treated as the source of truth for the response shape.
- **FR-026**: Email confirmation changes that occur before user email confirmation is finalized MUST commit or roll back as one consistent operation.
- **FR-027**: A failure after a confirmation row changes but before `user.email_confirmed_at` changes MUST leave both records in their pre-attempt state.
- **FR-028**: Cookie attributes for the refresh cookie MUST stay as currently documented and configured: path-scoped to `/auth/refresh`, `HttpOnly`, `Secure` in production, and the existing `SameSite` policy.
- **FR-029**: Existing refresh rotation and family-revocation semantics MUST remain unchanged except for rejecting unauthorized cross-origin mutation attempts.
- **FR-030**: This feature MUST address exactly Wave 1 audit findings S-1, S-2, S-3, S-4, S-6, S-7, Q-1, and C-1 from `AUDIT.md`; other audit findings are non-goals for this slice.

### Key Entities *(include if feature involves data)*

- **User Account**: Represents the user's identity, email address, confirmation state, and linked sign-in methods.
- **Password Credential**: Represents password-based authentication for a user account; in this feature the row must be hard deleted after an unconfirmed account is legitimately promoted by Google sign-in.
- **Provider Link**: Represents the relationship between a user account and a verified Google identity.
- **Refresh-Token Family**: Represents the user's refresh-session continuity and rotation history; must not be mutated by hostile cross-origin requests.
- **Rate-Limit Counter**: Represents an auth attempt budget for a specific resolved client IP and endpoint category; resolved client IPs come from `X-Forwarded-For` only through peers trusted by `TRUSTED_PROXIES`.
- **Email Confirmation**: Represents a pending or completed email confirmation attempt and must remain consistent with the user's confirmed state.
- **Auth Configuration**: Represents public booleans that tell the frontend which auth surfaces and confirmation behavior are enabled.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In the Google-promotion scenario, the stale password credential row is absent, exactly one transactional notice is sent, and 100% of attempts to authenticate with the pre-promotion password fail after the legitimate Google sign-in succeeds.
- **SC-002**: Two simulated attackers from different client IPs resolved through `TRUSTED_PROXIES` can each exhaust only their own auth rate-limit budgets, with 0 observed counter collisions between them.
- **SC-003**: The registration weak-password matrix across known confirmed, known unconfirmed, and unknown emails produces 3 byte-identical response bodies and 3 identical status codes, with 0 server errors.
- **SC-004**: In production-like validation, 100% of refresh/logout attempts with origins outside `CORS_ORIGINS` are rejected and cause 0 refresh-token rotations or family revocations.
- **SC-005**: The 11th repeated `POST /auth/google/start` call from a single limited IP returns `429` with a `Retry-After` value.
- **SC-006**: Production startup with either required HMAC key missing fails before accepting requests in 100% of tested missing-key combinations.
- **SC-007**: `GET /auth/config` returns the documented top-level object shape in 100% of contract checks, the frontend reads `passwordSignUp.requiresEmailConfirmation` for sign-up flow decisions, and the rollback flag is documented for removal after 30 days of stabilization.
- **SC-008**: Forced email-confirmation failures after confirmation-row mutation leave 0 partial commits across the tested rollback scenarios.
- **SC-009**: Existing auth no-enumeration tests, refresh rotation tests, cookie-attribute checks, and confirmation abuse-limit checks continue to pass after this slice.

## Non-Goals

- All Wave 2 audit items are out of scope: S-8 (test fixture in production bundle), S-9 (`next=` on password sign-in), S-10 (security headers), S-11 (refresh grace window), S-13 (confirm UI 429 vs 400), C-2 (error envelope shape), C-3 (cookie attributes contract note), Q-2 (OpenAPI snapshot relocation), and Q-5 (`test_register_rate_limit` fix).
- All Wave 3 audit items are out of scope.
- UI redesign is out of scope.
- Copy revision is out of scope except for the minimum frontend behavior forced by the `GET /auth/config` contract shape.
- New authentication features, new providers, MFA, password reset, new session policies, and changes to refresh-token rotation semantics are out of scope.
- Changes to refresh cookie attributes are out of scope.
- Forced sign-out of legitimate users during deployment is out of scope and must not be introduced.

## Assumptions

- `AUDIT.md` sections 4, 5, and 12 provide the evidence and prioritization for this feature; this specification references those findings rather than restating the audit.
- The existing auth contracts from slice 006 remain valid unless this spec explicitly names the `GET /auth/config` shape or the `POST /auth/google/start` rate-limit response.
- The legitimate web app's allowed origin list is already known to the running environment.
- The project continues to support existing users, sessions, refresh-token families, and OAuth flow rows during deploys.
- Existing cookie attributes and refresh rotation behavior are contractual compatibility points for this slice.
