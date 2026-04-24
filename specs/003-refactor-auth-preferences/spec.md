# Feature Specification: Refactor Campfire Authentication and Preferences MVP

**Feature Branch**: `003-refactor-auth-preferences`  
**Created**: 2026-04-24  
**Status**: Draft  
**Input**: User description: "Create a new specification for the Campfire Authentication and Preferences MVP Refactor. Consolidate Campfire into a simpler, better-organized MVP centered on landing, sign-up, authentication, preferences onboarding, and the initial authenticated home, using the already implemented frontend screens as the mandatory functional and visual baseline. The landing page -> sign-up/login -> onboarding -> home flow must be clear, with email/password and Google authentication, no duplicate users for the same email, protected pages, logout, friendly error handling, and a simple, useful preferences model."

## Clarifications

### Session 2026-04-24

- Q: When a user signs in with Google for the first time and the email may already exist in Campfire, should the system create, link, or block the account? -> A: Google automatically creates an account on first login; if the same email already exists, Google login must be linked to the existing account when the email identity is trustworthy.
- Q: Is email verification part of the authentication MVP? -> A: Yes. Email/password accounts must verify email, and Google is accepted only when the provider marks the email as verified or trustworthy.
- Q: Is password recovery part of the MVP? -> A: Yes. The MVP must include minimal password recovery with a reset request and new-password creation through a secure, time-limited flow.
- Q: What is the expected behavior when an authenticated user has not completed onboarding or has already completed onboarding? -> A: Users without completed onboarding are redirected to onboarding first, but may explicitly defer it and enter home; users with completed onboarding enter home directly.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand the product and enter Campfire (Priority: P1)

An unauthenticated person opens Campfire, quickly understands that the product helps small groups of friends organize repertoire and musical practice, and chooses to create an account or sign in to an existing account.

**Why this priority**: A clear landing page connected to authentication is the MVP entry point. Without it, new users cannot understand the product or reach sign-up.

**Independent Test**: Can be tested by opening the public experience without an active session, verifying the product proposition, entry calls to action, and navigation to sign-up or login.

**Acceptance Scenarios**:

1. **Given** an unauthenticated person opens Campfire, **When** the public experience loads, **Then** the landing page is shown without protected content and with a clear call to sign up or sign in.
2. **Given** an unauthenticated person decides to start, **When** they choose the primary landing-page action, **Then** they are taken to sign-up or to a clear choice between sign-up and login.
3. **Given** a person already has an account, **When** they choose to sign in from the public experience, **Then** they can access the login flow without going through onboarding or home content.

---

### User Story 2 - Create an account and authenticate securely (Priority: P1)

A new user creates an account with email/password or Google. An existing user signs in with email/password or Google. In all cases, Campfire recognizes a single account per email and communicates authentication failures in a friendly way.

**Why this priority**: Sign-up and login are the functional core of this MVP. The product can only proceed to preferences and home if the user's identity is clear, secure, and free of duplication.

**Independent Test**: Can be tested by creating a new account with email/password, creating a new account with Google, signing in with an existing account through both allowed methods when applicable, and attempting duplicate sign-up with the same email.

**Acceptance Scenarios**:

1. **Given** a new user provides a valid email and password, **When** they submit sign-up, **Then** an account is created, the user is required to verify email, and they proceed to onboarding after verification.
2. **Given** a new user chooses to continue with Google using an email not yet associated with Campfire, **When** Google authentication completes successfully, **Then** a Campfire account is automatically created for that email, the user is authenticated, and they proceed to preferences onboarding.
3. **Given** an existing user provides valid email/password credentials, **When** they submit login, **Then** they are authenticated and go to home if they have completed onboarding.
4. **Given** an existing user chooses to continue with Google using the same email as their Campfire account, **When** Google authentication completes successfully, **Then** they enter the same existing account and no duplicate account is created.
5. **Given** someone attempts to sign up with an email already in use, **When** sign-up is submitted, **Then** the system rejects duplicate creation and shows a clear message directing the person to sign in with the existing account or use an allowed method for that email.
6. **Given** a user creates an email/password account, **When** the email has not yet been verified, **Then** the system must require email verification before treating the account as trusted for the main authenticated experience.
7. **Given** a user forgot their password, **When** they request password recovery, **Then** they can start a secure, time-limited flow to set a new password.

---

### User Story 3 - Complete preferences onboarding before the main experience (Priority: P1)

An authenticated user without completed onboarding is sent first to the initial onboarding flow, enters how they play and what they want to organize in Campfire, or explicitly defers that step before accessing home.

**Why this priority**: Preferences provide the minimum musical context for home and future product evolution without prematurely introducing complex repertoire, groups, or recommendation features.

**Independent Test**: Can be tested by authenticating a user without completed onboarding, verifying redirection to onboarding, saving simple preferences or explicitly deferring the step, and confirming arrival at home.

**Acceptance Scenarios**:

1. **Given** an authenticated user has not completed or explicitly deferred onboarding, **When** authentication finishes, **Then** they are sent to onboarding before home.
2. **Given** the user selects instruments, genres, playing context, goals, and experience level, **When** they save preferences, **Then** the preferences are associated with their account and they proceed to home.
3. **Given** the user chooses to defer onboarding, **When** they confirm that decision, **Then** they can access home, but home continues to offer a clear action to update preferences.
4. **Given** saving preferences fails, **When** the user attempts to finish onboarding, **Then** the system preserves visible choices when possible and shows an actionable error message.

---

### User Story 4 - Enter home directly after completed onboarding (Priority: P2)

An authenticated user with completed onboarding enters home directly, sees their member state, and finds a clear action to update preferences or sign out.

**Why this priority**: Fast return to home makes the MVP usable after first access and avoids repeating steps already completed.

**Independent Test**: Can be tested by authenticating an account with completed onboarding, verifying that the user reaches home without going through onboarding, and confirming they can end the session.

**Acceptance Scenarios**:

1. **Given** an existing user has completed onboarding, **When** they sign in successfully, **Then** they enter the authenticated home directly.
2. **Given** a user is on home, **When** they choose to update preferences, **Then** they can access authenticated onboarding to review and save preferences.
3. **Given** an authenticated user chooses to sign out, **When** logout completes, **Then** they lose access to protected pages and return to a public or login experience.

---

### User Story 5 - Keep the MVP lean and aligned with existing screens (Priority: P3)

A maintainer or reviewer can understand which screens, flows, data, and behaviors belong to the MVP and which capabilities should be removed, deferred, or planned separately.

**Why this priority**: The project already has previous specifications and manual changes. The new specification must reduce ambiguity for product, frontend, backend, infrastructure, tests, and documentation.

**Independent Test**: Can be tested by reviewing the specification and confirming that every MVP flow is covered, out-of-scope items are explicitly bounded, and the existing visual experience is preserved as the baseline.

**Acceptance Scenarios**:

1. **Given** an existing capability does not contribute to landing, authentication, onboarding, preferences, or initial home, **When** the feature is planned, **Then** that capability must be marked for removal, deferral, or isolation outside the MVP.
2. **Given** a future decision proposes expanding repertoire, groups, sessions, or recommendations, **When** it is evaluated against this specification, **Then** it must be treated as a new feature, not as a requirement of this MVP.

### Edge Cases

- What happens when an unauthenticated person attempts to access home, authenticated onboarding, or profile? The system must block protected content and route the person to login, preserving a safe return intent when appropriate.
- How does the system handle invalid credentials, a missing account, or an incorrect password? It must show a friendly message without exposing sensitive data or confirming information beyond what is necessary.
- What happens when a user requests password recovery for an email that does not exist? The system must respond in a friendly and safe way without publicly confirming whether the account exists.
- What happens when Google fails, is cancelled, does not return a trustworthy email, or returns an email already in use? The person must receive clear guidance, and no duplicate account must be created.
- What happens when an email already exists with another authentication method? The system must link Google login to the existing Campfire account when the email identity is trustworthy, without creating duplication; when it is not trustworthy, it must direct the user to the already associated method.
- What happens when an authenticated user has not completed onboarding? They must be redirected first to onboarding; if they explicitly defer it, they can enter home, which must keep a clear action to update preferences.
- How does the system handle a temporary failure loading home or preferences? It must keep the user in a safe state, offer recovery, and never show another account's data.
- What happens after logout in one tab while another tab remains open? The next protected interaction must recognize the ended session and remove access to protected content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show a public landing page to unauthenticated users, with a clear value proposition and visible paths to sign-up and login.
- **FR-002**: The system MUST provide sign-up with email and password.
- **FR-003**: The system MUST provide login with email and password.
- **FR-004**: The system MUST provide sign-up and login with Google.
- **FR-005**: Google login MUST automatically create a Campfire account on first login when the email does not already exist in Campfire.
- **FR-006**: The system MUST maintain a single Campfire account per email and MUST NOT create duplicate users for the same email.
- **FR-007**: When Google login uses an email already associated with a Campfire account created by email/password, the system MUST link the Google method to the existing account and enter that same account when the email identity is trustworthy; otherwise, it MUST show a clear message guiding the next step without creating a duplicate account.
- **FR-008**: When someone attempts to sign up with an email already in use, the system MUST reject duplication and direct the person to sign in with the existing account or use an allowed method for that email.
- **FR-009**: Passwords MUST NOT be stored, displayed, returned in responses, logged, or exposed in plaintext.
- **FR-010**: Accounts created with email/password MUST require email verification before being considered trustworthy for the main authenticated experience.
- **FR-011**: Google authentication MUST be accepted for creation, login, or linking only when the provider indicates that the email is verified or trustworthy.
- **FR-012**: The system MUST provide minimal password recovery for email/password accounts, allowing users to request a reset and set a new password through a secure, time-limited flow.
- **FR-013**: Password recovery responses MUST be friendly and safe, without publicly confirming whether an email has a Campfire account.
- **FR-014**: An authenticated user with completed onboarding MUST be redirected directly to home.
- **FR-015**: An authenticated user without completed onboarding and without explicit deferral MUST be redirected first to preferences onboarding before accessing home.
- **FR-016**: An authenticated user without completed onboarding MUST be able to explicitly defer onboarding and access home with a clear action to update preferences later.
- **FR-017**: Unauthenticated users MUST NOT access protected pages, including home, authenticated onboarding, profile, and any future experience marked as authenticated.
- **FR-018**: The system MUST provide a clear logout action in authenticated areas and MUST remove access to protected content after logout.
- **FR-019**: The system MUST handle authentication errors with friendly messages for invalid credentials, missing account, unverified email, Google failure, Google cancellation, and attempted sign-up with an email already in use.
- **FR-020**: Onboarding MUST allow users to enter and update their initial preferences.
- **FR-021**: The preferences model MUST remain simple and useful for the MVP, limited to initial musical context: instruments, genres, usual playing context, Campfire goals, and experience level.
- **FR-022**: Preferences MUST be associated with a single authenticated account and MUST NOT be visible or editable by unauthenticated users or by another account.
- **FR-023**: Authenticated home MUST present a functional initial experience, with user identification, member state, short explanation of what comes later, and a clear action to update preferences.
- **FR-024**: The visual and functional experience of the already implemented landing page, sign-in, sign-up, onboarding, and home screens MUST be preserved as the mandatory MVP baseline, except for changes required to satisfy these requirements.
- **FR-025**: Flows, screens, data, or code that do not contribute to landing, authentication, preferences onboarding, or initial home MUST be removed, deferred, or isolated outside the MVP during planning and implementation.
- **FR-026**: MVP tests and documentation MUST cover the landing page -> sign-up/login -> onboarding -> home flow, behavior for new and existing users, protected-page access, logout, authentication errors, and preference updates.

### Key Entities *(include if feature involves data)*

- **Campfire User**: A person's single Campfire account, identified by email and used to associate session, preferences, and authenticated experience.
- **Authentication Method**: An allowed way to enter an account, including email/password and Google. One account may have one or more methods associated with it, while remaining unique by email.
- **Email Verification State**: Indicator that the account email was confirmed through email/password verification or marked verified/trustworthy by Google.
- **Password Recovery Request**: Temporary, secure request that lets an email/password account set a new password without publicly exposing whether the email exists.
- **Authenticated Session**: Temporary state that allows access to protected pages and must end on logout or when it becomes invalid.
- **User Preferences**: Simple set of initial musical context for the user, including instruments, genres, usual playing context, goals, and experience level.
- **Onboarding State**: Indicates whether the user still needs onboarding, completed onboarding by saving preferences, or explicitly deferred the step to update later.
- **Authenticated Home**: The user's first protected experience, with basic account information, member state, and a path to update preferences.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An unauthenticated person can understand Campfire's proposition and reach a sign-up or login path within 60 seconds, without accessing protected content.
- **SC-002**: A new user can create an account with email/password and reach onboarding within 3 minutes, in at least 90% of flow tests without external failures.
- **SC-003**: A new user can create an account or enter for the first time with Google and reach onboarding within 3 minutes, in at least 90% of flow tests without external failures.
- **SC-004**: An existing user with completed onboarding can sign in and reach home directly within 30 seconds, in at least 95% of flow tests without external failures.
- **SC-005**: 100% of unauthenticated attempts to access protected pages are blocked before any protected content is displayed.
- **SC-006**: 100% of attempts to create or enter with the same email result in at most one Campfire account associated with that email.
- **SC-007**: At least 90% of test users without completed onboarding can save preferences or explicitly defer onboarding within 2 minutes before entering home.
- **SC-008**: 100% of required authentication error scenarios show a friendly and actionable message without exposing passwords, sensitive details, or another account's data.
- **SC-009**: 100% of accounts entering the main authenticated experience have a verified or trustworthy email.
- **SC-010**: 100% of password recovery flows allow reset completion with a valid temporary request and reject invalid or expired requests without exposing sensitive data.
- **SC-011**: An MVP review can identify, within 30 minutes, which screens, flows, and data belong to scope and which must be removed, deferred, or handled as future features.

## Assumptions

- The web experience is the primary MVP surface for this stage.
- The already implemented landing page, sign-in, sign-up, onboarding, and home screens are the mandatory functional and visual baseline for this feature.
- This specification supersedes, for the current MVP, the previous assumption that access is limited only to pre-provisioned users: self-service sign-up with email/password and Google is now mandatory.
- Campfire remains in alpha and should communicate that maturity without presenting itself as a broad public social network.
- Onboarding should stay lightweight: preferences may be partially completed, and a user without completed onboarding may explicitly defer the step without losing the path to update later.
- Preferences exist to guide the initial experience and prepare future evolution of repertoire and groups, but those capabilities must not be implemented in this feature.
- The user account is treated as private; preference information is not public in the MVP.

## Constraints

- The MVP MUST remain centered on landing, authentication, preferences onboarding, and initial home.
- The feature MUST NOT introduce full repertoire, groups, jam sessions, recommendations, rankings, public profiles, or social mechanics.
- The visual experience MUST preserve Campfire's current direction: dark, typographic, musical, direct, and aligned with the documented design.
- The solution MUST prioritize simplicity, authentication security, and incremental evolution instead of anticipating complex account, authorization, or preference models.
- Any removal or isolation of existing behavior MUST preserve unrelated user changes and must be planned in an auditable way.

## Risks

- Previous specifications may conflict with the new self-service sign-up requirement; planning must make explicit which older assumptions no longer apply.
- Linking Google to an existing account by email can create duplicates or login lockout if identity rules are unclear.
- An overly broad preferences model can pull the MVP into repertoire, groups, or recommendations too early.
- Removing surplus code without flow tests can break screens that are now mandatory.
- Authentication error messages can expose sensitive information if too specific, or confuse users if too generic.

## Out of Scope

- Full repertoire, songs, instruments per song, proficiency per song, and learning history.
- Groups, invitations, jam sessions, sharing with circles, and collaborative memory.
- Recommendations, rankings, social feed, public profiles, or discovery of other users.
- Advanced account recovery beyond the minimal password reset, detailed security settings, multi-factor authentication, and complete authentication-method management beyond what is required for the MVP.
- Rich profile, avatar, notifications, non-musical preferences, and product settings.
- Full internationalization, native mobile apps, and multiple launch environments as an objective of this feature.
