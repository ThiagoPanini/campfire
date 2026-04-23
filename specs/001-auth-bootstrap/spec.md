# Feature Specification: Auth Bootstrap

**Feature Branch**: `001-auth-bootstrap`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "Create the feature spec for `auth-bootstrap`.

Goal: define the first end-to-end vertical slice that establishes the application’s minimal secure foundation on AWS, allowing a user to access the site through a domain, authenticate, and enter a protected authenticated area.

Scope:
- Frontend: choose a modern frontend stack appropriate for this purpose; include public landing page, sign-in/sign-out flow, protected routes, authenticated shell, and `/me` bootstrap screen.
- Backend: include health endpoint, auth/session validation, token verification, `GET /me`, and create/bootstrap local user on first login.
- Infrastructure: define Terraform for all required AWS resources to run this securely in AWS, including domain access, hosting, auth provider/integration, API/runtime, secrets/config, networking/security basics, and deployment baseline.

Requirements:
- Prioritize security, simplicity, and production-oriented defaults.
- Prefer managed AWS-native services where appropriate.
- Treat identity as infrastructure/platform capability, not business logic.
- Define clear boundaries across frontend, backend, and infra.
- Include assumptions, constraints, acceptance criteria, risks, and out-of-scope items.
- Specify the minimum deployable solution only.

Expected result:
A spec that enables implementation of `auth-bootstrap` so the system is deployable on AWS and supports secure navigation to the site domain plus user authentication end to end."

## Clarifications

### Session 2026-04-23

- Q: How should the first deployable environment control who can access authentication? → A: Sign-in only for pre-provisioned users created/administered outside the public app.
- Q: How should the first deployable environment expose web and API domain access? → A: Use one root domain with separate subdomains for web and API.
- Q: What identity-provider assurance is required before a user can enter Campfire for the first time? → A: Require a verified email claim for initial access and local user bootstrap.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reach and enter the application securely (Priority: P1)

A visitor can open the Campfire site from its public domain, view a simple public landing experience, start sign-in, complete authentication, and arrive in a protected authenticated area without seeing infrastructure or security failures.

**Why this priority**: This is the first end-to-end proof that Campfire exists as a real deployable product rather than a local prototype. Without this flow, there is no secure user entry point for any later feature.

**Independent Test**: Can be fully tested by opening the production-like domain, initiating sign-in, authenticating successfully, and confirming that the user reaches a protected screen that is inaccessible before authentication.

**Acceptance Scenarios**:

1. **Given** a visitor is not authenticated, **When** the visitor opens the Campfire domain, **Then** the public landing page is shown over a secure connection and offers a clear sign-in entry point.
2. **Given** a visitor is not authenticated, **When** the visitor attempts to open a protected route directly, **Then** the visitor is redirected into the authentication flow and is not shown protected content before successful sign-in.
3. **Given** a visitor completes authentication successfully, **When** Campfire establishes the authenticated session, **Then** the visitor is taken into the protected authenticated area and can continue without re-authenticating during the active session.

---

### User Story 2 - Enter a usable authenticated shell on first login (Priority: P2)

An authenticated user can enter a minimal authenticated shell and see a `/me` bootstrap screen that confirms who they are inside Campfire, even on their first login when no local application profile exists yet.

**Why this priority**: Authentication alone is only plumbing. Campfire needs an initial authenticated experience that proves the platform can recognize a signed-in person as a Campfire user and establish the minimal local foundation for future product features.

**Independent Test**: Can be fully tested by authenticating with a first-time identity, verifying that Campfire creates the local user record automatically, and confirming that the `/me` bootstrap screen displays the authenticated identity context.

**Acceptance Scenarios**:

1. **Given** an authenticated person signs in for the first time, **When** the application requests their Campfire identity context, **Then** the system creates the minimal local user record and returns a successful `/me` response.
2. **Given** an authenticated returning user opens the authenticated area, **When** the application loads the bootstrap screen, **Then** the existing local user record is reused and the user sees their current Campfire identity context.
3. **Given** an authenticated session becomes invalid or expires, **When** the user refreshes or re-enters the protected area, **Then** the application removes access to protected content and returns the user to a sign-in path.

---

### User Story 3 - Operate the foundation safely and predictably (Priority: P3)

An operator can deploy and verify the minimal Campfire foundation in AWS using repeatable infrastructure definitions and can confirm the application and API are reachable, secure, and observable enough for continued development.

**Why this priority**: The feature is intended to establish the first production-oriented foundation. A secure user path without a deployable and verifiable platform baseline would leave the project fragile from day one.

**Independent Test**: Can be fully tested by provisioning the environment from versioned infrastructure definitions, verifying the domain and API health endpoint, and confirming that secrets and protected configuration are not exposed through the application.

**Acceptance Scenarios**:

1. **Given** the environment has been provisioned from the repository definitions, **When** an operator accesses the site domain and API health endpoint, **Then** both are reachable through the expected secure public endpoints.
2. **Given** the environment is deployed, **When** an operator inspects the runtime configuration path, **Then** secrets and protected settings are sourced from managed secure configuration rather than being embedded in code or public assets.
3. **Given** authentication or API validation fails, **When** the failure occurs, **Then** the system produces enough operational evidence to diagnose whether the issue is in the user-facing application, API validation, or platform integration.

### Edge Cases

- What happens when a user opens a protected route with no active session? The system must block protected content and route the user back into a valid authentication entry point.
- How does the system handle a valid identity-provider login when the local Campfire user record does not yet exist? The system must create the minimum local user record once and continue the user into the authenticated area.
- What happens when the token presented to the backend is expired, malformed, revoked, or issued for the wrong audience? The backend must reject the request, return an authentication failure outcome, and the frontend must clear protected access.
- What happens when the authenticated identity lacks a verified email claim? The system must deny protected access and must not create a local user record.
- How does the system handle a user who signs out in one browser tab and then interacts with another protected tab? The next protected interaction must detect the invalid session and remove access.
- What happens when the public site is reachable but the backend health or identity validation dependency is unavailable? The system must avoid exposing broken protected content, communicate that sign-in is temporarily unavailable, and preserve diagnostic visibility for operators.
- How does the system handle a repeat deployment or infrastructure drift correction? The minimum environment must be reprovisionable from versioned definitions without requiring manual recreation of durable resources.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a public Campfire site reachable through a configured Campfire domain over secure transport.
- **FR-001a**: The first deployable environment MUST expose the web application and API through separate subdomains under one shared Campfire root domain.
- **FR-002**: The public site MUST provide a public landing page with a clear path into authentication and MUST NOT expose protected application content before successful authentication.
- **FR-003**: The system MUST provide a standards-based sign-in flow through a managed identity capability and MUST treat identity verification as a platform concern rather than as custom business logic.
- **FR-003a**: The first deployable environment MUST restrict authentication to pre-provisioned users managed outside the public Campfire application and MUST NOT include public self-service sign-up.
- **FR-004**: The system MUST allow an authenticated user to sign out and MUST remove access to protected routes after sign-out or session invalidation.
- **FR-005**: The frontend MUST enforce protected-route behavior so unauthenticated visitors cannot access the authenticated shell or `/me` bootstrap screen.
- **FR-006**: The backend MUST expose a health endpoint that can be used to verify API availability independently of the authentication flow.
- **FR-007**: The backend MUST validate the authenticity and intended audience of presented identity tokens before serving protected application data.
- **FR-007a**: The system MUST allow initial Campfire access and local user bootstrap only when the authenticated identity includes a verified email claim from the managed identity provider.
- **FR-008**: The backend MUST expose an authenticated user-context retrieval capability that returns the authenticated user’s Campfire identity context for the bootstrap experience.
- **FR-009**: When an authenticated person successfully reaches Campfire for the first time, the system MUST create the minimum local Campfire user record required to support future authenticated features.
- **FR-010**: When an authenticated returning user requests their bootstrap identity context, the system MUST return the existing local Campfire user record rather than creating a duplicate record.
- **FR-011**: The minimum local user record MUST be limited to identity-bootstrap data required for secure account recognition and future profile growth.
- **FR-012**: The authenticated area MUST provide a minimal authenticated shell and a `/me` bootstrap screen that confirms the signed-in user has entered Campfire successfully.
- **FR-013**: The system MUST separate responsibilities clearly across the public frontend, protected application behavior, backend identity validation, and infrastructure-managed identity services.
- **FR-014**: The infrastructure definition MUST provision all minimum resources required to host the public frontend, run the protected API, support the managed identity flow, serve the domain securely, and supply runtime configuration through managed secure mechanisms.
- **FR-015**: The infrastructure definition MUST be sufficient to create a minimum deployable AWS environment without requiring manual creation of long-lived production resources.
- **FR-016**: The system MUST store secrets and protected configuration outside source-controlled application code and outside publicly served frontend assets.
- **FR-017**: The minimum deployable solution MUST include basic networking, access control, and encryption defaults appropriate for an internet-reachable authenticated application.
- **FR-018**: The system MUST produce enough logs and deployment-time verification signals to distinguish failures in domain access, authentication, protected-route access, token validation, and bootstrap identity retrieval.

### Key Entities *(include if feature involves data)*

- **Identity Session**: The authenticated context established by the managed identity capability for a signed-in person, used to determine whether protected content may be accessed.
- **Local User**: The minimum Campfire-owned user record created or reused after successful identity validation so the person can exist inside Campfire’s domain model.
- **Authenticated Shell**: The minimum protected application area that proves the user is inside Campfire and can safely access authenticated experiences.
- **Bootstrap Identity View**: The `/me` result presented to the authenticated user, containing the Campfire-recognized identity context necessary for the first post-login experience.
- **Deployment Environment**: The minimum AWS-hosted runtime footprint required to expose the domain, frontend, backend, identity integration, and secure configuration path.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can reach the Campfire domain and begin sign-in in under 30 seconds without encountering broken navigation or unsecured content warnings.
- **SC-002**: At least 95% of successful sign-in attempts result in the user reaching the protected authenticated area and `/me` bootstrap screen on the first attempt without manual operator intervention.
- **SC-003**: A first-time authenticated user can complete first login and see their Campfire bootstrap identity context in under 2 minutes.
- **SC-004**: 100% of unauthenticated requests to protected routes and protected user-context endpoints are denied access to protected content.
- **SC-005**: A clean environment can be provisioned and exposed through the intended public domain using only repository-defined setup steps, with no manual creation of long-lived application resources.
- **SC-006**: Operators can determine within 10 minutes whether a reported login failure is caused by domain access, authentication initiation, token validation, or local user bootstrap failure.

## Assumptions

- Campfire is still pre-launch, so the minimum deployable solution targets one primary web experience and one primary AWS environment for active development, with production-oriented defaults but minimal surface area.
- The first secure user entry point is limited to web access through a managed identity flow; additional sign-up variants, invitations, and multi-role authorization are not required for this feature.
- Access to the first deployable environment is limited to pre-provisioned users managed outside the public app; public self-service sign-up is intentionally excluded from this slice.
- A reasonable default for the first local user record is a minimal Campfire-owned identity profile derived from validated identity-provider claims, without expanding into full profile management.
- Initial Campfire access assumes the managed identity provider can supply a verified email claim suitable for bootstrap and operator administration.
- Domain registration and ownership can be satisfied by the project maintainer before deployment, but the application-facing configuration of the domain is part of this feature.
- The first deployable environment uses one shared root domain with separate web and API subdomains as the public entry pattern.
- The feature should prefer managed AWS-native capabilities whenever they reduce operational burden without weakening the security posture.
- The authenticated shell is intentionally minimal and exists to prove secure entry and account bootstrap, not to deliver downstream music-domain features yet.

## Constraints

- The feature MUST remain the minimum deployable solution only and MUST avoid introducing nonessential product capabilities such as groups, jam sessions, song data, or recommendation logic.
- Identity MUST be modeled as an infrastructure/platform capability; Campfire business logic must only consume validated identity context and local user records.
- The solution MUST favor simplicity and production-oriented defaults over architectural breadth or premature extensibility.
- The feature MUST preserve clear boundaries between frontend concerns, backend concerns, and infrastructure concerns so later planning can assign responsibilities cleanly.
- The deployable baseline MUST be expressible through versioned repository assets and MUST avoid dependence on undocumented manual steps for long-lived resources.

## Risks

- Authentication integration failures can appear as generic sign-in problems unless the system clearly distinguishes frontend initiation failures from backend token-validation failures.
- Domain, certificate, and DNS setup can delay the first deployable milestone even when application code is ready.
- First-login bootstrap logic can accidentally create duplicate local users if identity matching rules are ambiguous.
- Over-designing the first foundation could slow delivery and pull the feature beyond the minimum secure slice.
- Under-investing in observability at this stage could make every later authentication issue expensive to diagnose.

## Out of Scope

- User invitations, password recovery customization, social login expansion beyond the chosen minimum identity path, and advanced account management.
- Public self-service registration, public account onboarding, and invite-flow UX inside the Campfire application.
- Roles, permissions, organization membership models, or any authorization model beyond basic authenticated-versus-unauthenticated protection.
- Jam-session, group, song, instrument, proficiency, or recommendation features.
- Rich profile editing, avatar management, notification settings, or any nonessential post-login product experience beyond the minimal `/me` bootstrap view.
- Multi-region resilience, advanced autoscaling strategy, staging-environment expansion, or complex release orchestration beyond the minimum deployable baseline.
