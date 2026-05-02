# Feature Specification: Google Authentication and Login Experience Improvements

**Feature Branch**: `006-google-auth-login-ux`
**Created**: 2026-04-30
**Status**: Draft
**Input**: User description: "Google Authentication and Login Experience Improvements"

## Context (informational, derived from current repo state)

The Campfire codebase confirms a monorepo with `apps/api` (FastAPI with a DDD/hexagonal `identity` bounded context, Argon2 password hashing, opaque access tokens, an httpOnly refresh cookie scoped to `/auth/refresh`, and an in-memory rate limiter) and `apps/web` (Vite + React + custom routing, with locale support for `en` and `pt`). The current authentication surface exposes `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /me`, and a `POST /auth/google-stub` endpoint that today returns a deterministic seeded session and is gated by a `GOOGLE_STUB_ENABLED` setting. The current sign-in/sign-up UI uses a basic email regex, an 8-character minimum password rule, password fields with no visibility toggle, generic credential error messages, and `disabled` buttons during submission. There is no email-verification flow, no real Google identity provider integration, and no account-linking concept. The production application is deployed on Render.

This feature replaces the Google stub with a real Google authentication experience, hardens the password flows, introduces email confirmation for traditional sign-up, and improves the auth UX across loading, success, error, and accessibility dimensions — while preserving compatibility with already-registered users and active sessions.

## Clarifications

### Session 2026-04-30

- Q: What Google auth integration shape should the spec require? → A: Backend-owned OAuth Authorization Code + PKCE redirect/callback flow
- Q: How should confirmation codes be stored server-side? → A: Store only a hashed/HMAC digest of each confirmation code
- Q: What should be the production transactional email provider boundary for confirmation and notification emails? → A: Provider-agnostic mailer port with environment-configured production adapter
- Q: How should the confirmation form identify which account/email a code belongs to? → A: User submits email plus confirmation code
- Q: After sign-out, where should users land? → A: Public landing page (`/`)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign up and log in with Google (Priority: P1)

A new visitor lands on the sign-in or sign-up page, clicks "Continue with Google", completes Google's authentication in a way appropriate for the device (popup, redirect, or in-page consent), and arrives back at Campfire fully signed in to their personal home view. A returning visitor whose account was originally created with Google clicks the same button and is signed in without being asked to enter a password.

**Why this priority**: This is the primary new capability requested. Google authentication is the lowest-friction entry point for new and returning users, removes the password-recall and email-typo failure modes that block sign-up, and replaces the deterministic stub that currently authenticates everyone as the same seeded user. Without it, the rest of the improvements only polish the existing surface.

**Independent Test**: With Google auth configured locally and a test Google account, complete the "Continue with Google" flow from both the sign-up and sign-in screens. Verify a personal home view loads, `/me` reflects the Google-provided email and a sensible display name, the refresh cookie persists across reload, and signing out clears access.

**Acceptance Scenarios**:

1. **Given** a visitor with no Campfire account on the sign-up page, **When** they choose "Continue with Google" and approve consent for an email Campfire has never seen, **Then** an account is created using the verified Google email and profile name, a session is established, and the visitor lands on the authenticated home view.
2. **Given** a returning user whose account was originally created with Google, **When** they choose "Continue with Google" on the sign-in page, **Then** they are signed in without being prompted for a password and without a duplicate account being created.
3. **Given** a user who closes or cancels the Google consent screen, **When** control returns to Campfire, **Then** the auth screen shows a recoverable, non-alarming message ("Sign-in was cancelled. You can try again."), no session is created, and the form remains usable.
4. **Given** Google returns an error, an invalid state/CSRF parameter, or a malformed callback, **When** Campfire processes the response, **Then** no session is created, no Google response details are exposed to the user, and the screen surfaces a generic "We couldn't sign you in with Google. Please try again." message.
5. **Given** Google authentication is not configured for the running environment, **When** the page loads, **Then** the "Continue with Google" button is hidden or visibly disabled with an explanatory tooltip, and password authentication continues to work normally.

---

### User Story 2 - Email-confirmed traditional sign-up (Priority: P1)

A visitor who prefers email + password chooses "Sign up", enters a valid email and a strong password, and is told their account has been created and a confirmation code has been sent to their email. They retrieve the code, return to Campfire, enter it, and are signed in. Before confirming, they cannot access protected features.

**Why this priority**: Traditional sign-up today accepts any well-formed email and immediately issues a session. Without verification, typos and disposable emails accumulate, password-reset becomes unsafe, and Google-vs-password account linking is undecidable. Confirmation must ship together with Google to keep the account model consistent.

**Independent Test**: Sign up with a real address, observe a 6-digit code arrive, enter the code, and reach the authenticated home view. Then sign up again without confirming, attempt to access a protected route, and verify access is denied with a path back to confirm. Then exhaust resend and attempt limits and verify abuse-prevention behavior.

**Acceptance Scenarios**:

1. **Given** the sign-up form with a valid email and a password meeting the strength rules, **When** the user submits, **Then** an account is created in an "unconfirmed" state, a confirmation code is sent to the email, and the UI advances to a code-entry step that explains where to look and how to resend.
2. **Given** an unconfirmed user on the code-entry step, **When** they submit the account email and correct code before it expires, **Then** their account is marked confirmed, a session is established, and they land on the authenticated home view.
3. **Given** an unconfirmed user, **When** they try to log in with email and password, **Then** authentication is refused with the same generic credential error used elsewhere, with one exception: the UI offers an explicit "We sent you a confirmation code — resend it?" affordance so users are not stranded.
4. **Given** an unconfirmed user, **When** they navigate directly to a protected route, **Then** they are redirected to the code-entry step rather than the sign-in form.
5. **Given** an unconfirmed user, **When** the code expires, is entered incorrectly too many times, or has been resent too many times within the abuse window, **Then** the system refuses further attempts on that code and surfaces a generic "This code is no longer valid — request a new one" message without revealing which limit was hit.

---

### User Story 3 - Hardened email + password login UX (Priority: P2)

Existing and new password users sign in or sign up with clearer validation, the ability to reveal their password while typing, accurate loading states, and error messages that never reveal whether an email exists.

**Why this priority**: Quality-of-life and security improvements that ride on the same forms touched by P1/P2. Independently shippable but lower business impact than enabling Google.

**Independent Test**: On both forms, type an obviously invalid email and verify inline guidance; type a weak password and verify strength feedback; toggle the password-visibility control and verify the value becomes readable; submit a wrong password against a known account and a correct password against an unknown account, and verify the error wording is identical in both cases.

**Acceptance Scenarios**:

1. **Given** the sign-in or sign-up form, **When** the user types an email, **Then** validation flags syntactically invalid addresses (missing `@`, malformed domain, leading/trailing whitespace, unicode confusables in the local part) before submission and clears as soon as the input becomes valid.
2. **Given** the sign-up form, **When** the user types a password, **Then** the UI shows a live strength indicator and refuses submission for passwords that do not meet the minimum strength rules (length ≥ 10, includes characters from at least three of: lowercase, uppercase, digits, symbols, and is not on a small list of obviously common passwords).
3. **Given** any password field, **When** the user clicks the visibility toggle, **Then** the field switches between hidden and visible without losing focus, caret position, or value, and the toggle's state is announced to assistive technology.
4. **Given** any submitted login attempt, **When** the credentials do not match an active confirmed account, **Then** the UI shows a single, identical message regardless of whether the email exists, the password is wrong, the account is unconfirmed, or the account was created with Google only.
5. **Given** a submission in flight, **When** the user attempts to submit again or click "Continue with Google", **Then** the duplicate action is prevented, the active control shows a loading indicator, and other controls remain operable for cancellation/navigation.

---

### User Story 4 - Predictable redirects across the auth lifecycle (Priority: P2)

Users always land somewhere sensible after signing up, signing in, signing out, or hitting a protected route while logged out, including when they were deep-linked into a protected page.

**Why this priority**: Removes the most common "where did I end up?" complaints and prevents redirect loops, but is a refinement on top of the core flows.

**Independent Test**: Open a protected URL while logged out and verify return-to-original behavior after sign-in. Sign out from a protected page and verify the destination. Sign up via either path and verify post-sign-up destination. Try malicious `next=` values and verify they are rejected.

**Acceptance Scenarios**:

1. **Given** a logged-out user opens a protected URL, **When** they complete sign-in (Google or password), **Then** they are returned to the originally requested URL — provided it is a same-origin Campfire path; otherwise they land on the default authenticated home view.
2. **Given** a user completes sign-up with Google, **When** the session is established, **Then** they land on the authenticated home view (no email confirmation step is needed because Google has already verified the email).
3. **Given** a user completes sign-up via email + password, **When** they finish entering a valid confirmation code, **Then** they land on the authenticated home view.
4. **Given** an authenticated user clicks sign out, **When** the session is revoked, **Then** they land on the public landing page (`/`) with no flash of authenticated content and no usable session in any open tab.
5. **Given** a `next=` or equivalent redirect target that is absolute, cross-origin, or otherwise unsafe, **When** the auth flow completes, **Then** the unsafe target is ignored and the user lands on the default authenticated home view.

---

### Edge Cases

- A Google sign-in returns an email that already belongs to an existing password account → see Account-Linking rules in Functional Requirements; the user is never asked for their password inside the Google flow.
- A user attempts to sign up with an email that already has an unconfirmed account → the system MUST behave indistinguishably to a brand-new sign-up from the user's perspective (no enumeration), but MUST NOT create a second account; instead it resends the confirmation code (subject to the abuse limits).
- A user attempts to sign up with an email that already has a confirmed password or Google account → the UI MUST show the same neutral "Check your email to continue" message; the system MUST send an out-of-band notification email to the existing address explaining that someone tried to sign up again, with no code attached.
- The user's clock is wrong, or they take too long to retrieve the email → expired codes fail closed with a "request a new one" path.
- The user opens the confirmation code screen on a different device than where they started → confirmation MUST succeed regardless of device or browser session when the user submits the account email and a valid code.
- The Google ID token is expired, has the wrong audience, or fails signature verification → the request is rejected and treated identically to a generic "Google sign-in failed" error.
- The Google account's email is itself unverified by Google → the request MUST be rejected; Campfire only accepts Google identities whose email Google has verified.
- Two browser tabs each start a Google flow concurrently, or a user's session is refreshed mid-flow → the flow that completes second is either idempotent (same user, same provider) or rejected with the generic Google error.
- A returning user's existing access token expires while the auth UI is open → the existing refresh-cookie flow continues to operate; this feature MUST NOT invalidate active sessions on deploy.
- The user's locale is `pt` → all new strings (validation, code-entry, errors, redirect notices, password-toggle labels, accessibility announcements) MUST be available in both supported languages and selected by the same mechanism the rest of the app uses.
- An attacker rapidly requests confirmation codes for many emails, or rapidly attempts logins → existing rate limiting MUST continue to apply, and confirmation-code issuance and verification MUST have their own limits independent of login rate limits.
- Google authentication credentials are not configured in the current environment → the feature MUST fail safely and visibly for operators without breaking password authentication for end users.

## Requirements *(mandatory)*

### Functional Requirements

#### Google authentication

- **FR-001**: The system MUST support signing up and signing in via a real Google identity provider, replacing the deterministic stub currently behind `GOOGLE_STUB_ENABLED`, using a backend-owned OAuth Authorization Code + PKCE redirect/callback flow.
- **FR-002**: The system MUST verify that the Google identity assertion is genuine, intended for this Campfire environment, recently issued, has not been replayed, and that the email it carries has been verified by Google.
- **FR-003**: The system MUST NOT trust any Google-supplied field for authorization other than the verified email and a stable Google subject identifier; profile name MAY be used to seed display name only when no Campfire-side display name exists.
- **FR-004**: The system MUST persist the link between a Campfire user and their Google identity using the stable Google subject identifier (not the email), so that a Google-side email change does not break account access.
- **FR-005**: When Google authentication is not configured for the current environment (missing client credentials or feature flag off), the API MUST refuse Google sign-in attempts with a stable, non-revealing error and the web UI MUST hide or disable the "Continue with Google" control with an operator-visible explanation.
- **FR-006**: The Google flow MUST defend against cross-site request forgery and replay using a per-attempt anti-forgery value and PKCE verifier bound to the originating browser session; mismatches MUST be rejected as a generic Google failure.
- **FR-007**: The system MUST support local development against a Google project distinct from production and MUST document, but never hardcode or log, the credentials and redirect URIs needed in each environment.

#### Account model and linking

- **FR-008**: A Campfire user MUST be uniquely identified by a stable internal user identifier and MAY have, at most, one password credential and any number of provider links; a user with no password credential MUST still be able to sign in via at least one linked provider.
- **FR-009**: When a Google sign-in presents a verified email that already belongs to a confirmed Campfire account, the system MUST link the Google identity to that existing account automatically, without requesting the existing password and without creating a duplicate account.
- **FR-010**: When a Google sign-in presents a verified email that already belongs to an *unconfirmed* password account, the system MUST replace the unconfirmed sign-up with a confirmed Google-linked account (Google has already verified the email) and MUST invalidate any pending confirmation codes for that email.
- **FR-011**: After linking, both the password (if set) and Google MUST work as independent ways to sign in to the same account; existing access tokens, refresh tokens, and sessions of the linked user MUST remain valid.
- **FR-012**: The system MUST never display, log, or include in any error response another user's existence, provider linkage, or confirmation status; user-facing errors for failed login attempts MUST be identical regardless of underlying cause.

#### Email confirmation for traditional sign-up

- **FR-013**: A new password sign-up MUST create the account in an unconfirmed state and trigger delivery of a confirmation code to the supplied email through a provider-agnostic mailer port; the user MUST NOT receive a session or access to protected features until the code is verified.
- **FR-014**: The confirmation code MUST be a short numeric code (target: 6 digits), single-use, bound to the specific account and email, verified using user-submitted email plus code, stored server-side only as a hashed/HMAC digest, and MUST expire after a bounded interval (target: 15 minutes).
- **FR-015**: The system MUST limit verification attempts per code (target: ≤ 5 incorrect entries before the code is invalidated) and MUST limit code resends per account and per email (target: minimum 60-second cooldown between resends and ≤ 3 resends per rolling hour).
- **FR-016**: The user-facing flow MUST allow resending a code, MUST display a clear cooldown, and MUST not reveal which abuse limit was hit when refusing further attempts.
- **FR-017**: A duplicate sign-up attempt for an email that already has a confirmed account MUST behave indistinguishably from a successful sign-up from the user's perspective and MUST instead send an out-of-band "someone tried to sign up using your email" notification to the existing address.
- **FR-018**: A duplicate sign-up attempt for an email with an existing unconfirmed account MUST resend the confirmation code (subject to the rate limits), not create a second account, and MUST not change the password on file.
- **FR-019**: The verification email MUST not contain a password, a token usable for any purpose other than confirmation, or any internal identifiers; its contents MUST be safe to log a screenshot of.
- **FR-020**: After successful confirmation, the system MUST issue a normal Campfire session (access token + refresh cookie) using the same mechanisms as `POST /auth/login`.

#### Password authentication improvements

- **FR-021**: Email validation MUST reject syntactically invalid addresses, leading/trailing whitespace, and obviously malformed domains, and MUST be applied consistently on the client and server, with the server as the source of truth.
- **FR-022**: Password rules MUST require at least 10 characters and characters from at least 3 of the 4 classes (lowercase, uppercase, digits, symbols), MUST reject a small embedded list of common passwords, and MUST never impose a maximum length below 64 characters.
- **FR-023**: Password fields MUST provide a visibility toggle that is keyboard-operable, focus-preserving, and announced to assistive technology; the default state MUST be hidden.
- **FR-024**: All authentication-related error messages presented to end users MUST be generic enough to prevent account enumeration; precise reasons MAY appear only in server-side logs.
- **FR-025**: While an authentication request is in flight, the triggering control MUST show a loading state and MUST be guarded against duplicate submission; navigation away MUST cancel cleanly.
- **FR-026**: Existing users who registered before this feature MUST be able to continue logging in with their current passwords without interruption; the new password rules MUST apply only at sign-up, password change, and password reset.

#### Redirects, sessions, and protected routes

- **FR-027**: The web UI MUST capture the originally requested protected URL when an unauthenticated user is bounced to the auth screens and MUST return them there after successful authentication, accepting only same-origin Campfire paths as redirect targets.
- **FR-028**: Sign-out MUST revoke the active session on the server, clear the refresh cookie and local access token, and land the user on the public landing page (`/`) without flashing authenticated content.
- **FR-029**: The refresh cookie's path, domain, `Secure`, `SameSite`, and `HttpOnly` attributes MUST remain at least as strict as today across local development and production; any new endpoint that needs the refresh cookie MUST use the same scoping.
- **FR-030**: This feature MUST NOT invalidate currently active sessions or refresh tokens at deploy time.

#### Accessibility, internationalization, and platform behavior

- **FR-031**: All new auth UI states (loading, error, success, code entry, password toggle, Google button) MUST meet WCAG 2.1 AA for keyboard operation, focus visibility, color contrast, and assistive-technology announcements.
- **FR-032**: All new user-visible strings MUST be available in both currently supported locales (`en` and `pt`) and selected via the same i18n mechanism already used by the rest of the app.
- **FR-033**: Auth screens and the code-entry step MUST be usable on mobile viewports (one-handed reach for primary actions, no horizontal scroll, native numeric keyboard for the code field).

#### Operations, documentation, and tests

- **FR-034**: Documentation MUST cover environment configuration (Google client credentials, redirect URIs, mail delivery adapter settings, feature flags), the local-development setup against a non-production Google project, troubleshooting, and rollback to disable Google auth without disabling password auth.
- **FR-035**: Automated tests MUST cover, at minimum: (a) Google sign-up creating a new account; (b) Google sign-in linking to an existing confirmed password account; (c) Google sign-in rejected for an unverified Google email; (d) confirmation code happy path; (e) confirmation expiry, attempt limit, and resend limit; (f) login enumeration protection (same error for unknown email, wrong password, unconfirmed, and Google-only); (g) safe vs. unsafe `next=` redirect handling; (h) Google flow disabled when not configured.
- **FR-036**: Sensitive material — passwords, full Google ID tokens, raw provider payloads, plaintext confirmation codes, refresh tokens — MUST never appear in client-visible responses, error messages, telemetry, or application logs; redaction MUST be verified by tests.

### Key Entities *(include if feature involves data)*

- **User**: An authenticated identity in Campfire. Attributes include a stable internal identifier, a primary email, a display name, a confirmation status (only meaningful for password-originated accounts), and lifecycle timestamps. A user may exist with no password credential.
- **Password Credential**: An optional credential bound to one user, carrying a hashed password and update history. A user without a password credential cannot sign in by password.
- **Provider Link**: A relationship between a user and an external identity provider (initially Google), keyed by the provider's stable subject identifier and carrying the provider-supplied email at link time. A user may have at most one link per provider.
- **Email Confirmation**: A short-lived, single-use code bound to a user and an email, verified by the pair of user-submitted email plus code, stored as a hashed/HMAC digest with creation time, expiry, attempt count, and resend count, and a terminal state (verified / expired / invalidated). Replaced by a fresh record on every legitimate resend.
- **Session and Refresh Token**: Existing entities, unchanged by this feature except that they MAY now be opened from a Google sign-in or a successful confirmation in addition to a password login.
- **Auth Anti-Forgery Value**: A short-lived, browser-bound value that ties the start of a Google flow to its callback to defeat CSRF and replay; never persisted beyond the flow.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete sign-up and reach the authenticated home view in under 60 seconds via Google, and under 3 minutes via email + password including code retrieval, on a typical broadband connection.
- **SC-002**: At least 95% of sign-up attempts that reach the authenticated home view do so without the user submitting any form more than twice (measured per session, excluding deliberate provider cancellations).
- **SC-003**: Zero user-visible responses across login, sign-up, confirmation, Google callback, and password-reset surfaces reveal whether a given email is registered, unconfirmed, or linked to a provider — verified by an automated enumeration-resistance test suite.
- **SC-004**: 100% of new auth UI strings render correctly in both `en` and `pt` and pass an automated check that no untranslated key reaches the rendered DOM.
- **SC-005**: Existing users (registered before this feature ships) can sign in with their current credentials with zero password resets attributable to this change in the first 14 days post-deploy.
- **SC-006**: When Google credentials are unset in an environment, the API rejects all Google sign-in attempts and the web UI hides or disables the Google control, verified by an automated test that runs with the credentials cleared.
- **SC-007**: All new auth surfaces score at least Lighthouse Accessibility 95 and pass keyboard-only end-to-end traversal on the sign-in, sign-up, code-entry, and signed-out-redirect screens.
- **SC-008**: Confirmation-code abuse caps (per-code attempts, per-email resend cooldown, per-hour resend ceiling) hold under an automated abuse-simulation test, and the user-visible refusal message is identical regardless of which cap was hit.

## Assumptions

- The existing identity bounded context (Argon2 hashing, opaque access tokens, httpOnly refresh cookie at `/auth/refresh`, in-memory rate limiter) is the foundation we extend; we add provider linking and email confirmation alongside it rather than replacing it.
- Google is the only external identity provider in scope for this feature; a generalized provider abstraction is welcome but not required.
- The application supports two locales (`en`, `pt`) today and will continue to; no third locale is being added by this work.
- A transactional email delivery path exists or will be provisioned as part of this feature through a provider-agnostic mailer port with an environment-configured production adapter; the spec does not pick a vendor. Local development MAY use a no-op or console "mailer" provided developers can read codes from logs without those logs leaking to production.
- The web app continues to use its current custom client-side routing; this feature does not require migrating routing libraries even though it introduces new auth-aware redirect behavior.
- The Render deployment continues to host both the API and the web app; environment variables remain the configuration surface for client credentials and feature flags.
- "Account linking" rules in this spec assume Google-verified email is sufficient to link to an existing Campfire account because Campfire's own confirmation step exists for the same purpose; if security review later disputes this, a step-up confirmation can be added without changing the user-facing surface materially.
- Existing tests under `apps/api/tests/{unit,contract,integration}` and the frontend test approach are the home for the new automated coverage required by FR-035.

## Out of Scope

- Multi-factor authentication beyond email confirmation at sign-up.
- Identity providers other than Google (Apple, GitHub, Microsoft, SAML, etc.).
- Password reset / "forgot password" — implied by but not covered by this spec; will be a follow-up if not already tracked.
- A profile-management screen for unlinking a provider.
- Migration of seeded mock users out of the `@campfire.test` namespace.
