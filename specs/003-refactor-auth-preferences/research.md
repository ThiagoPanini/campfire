# Research: Refactor Campfire Authentication and Preferences MVP

## 1. Identity Provider and Credential Ownership

**Decision**: Use Amazon Cognito User Pool as the system of record for credentials, email verification, password recovery, Google federation, and JWT issuance.

**Rationale**: Campfire already uses Cognito, API Gateway JWT authorizers, and a backend that consumes verified claims. Keeping credentials in Cognito satisfies the security requirement that Campfire never stores plaintext passwords, avoids custom password handling, and fits the AWS-native Terraform direction. The MVP needs custom-looking screens, but the security boundary should still be a managed identity provider.

**Alternatives considered**:
- Custom backend password storage: rejected because it increases security burden and violates the preference for managed AWS services.
- Keep admin-only Cognito users: rejected because the new MVP explicitly requires public email/password sign-up.
- Third-party auth SaaS outside AWS: rejected for now because Cognito is already provisioned and integrated with API Gateway.

## 2. Frontend Authentication Strategy

**Decision**: Preserve the existing `/signin` and `/signup` screens as the visual baseline, but refactor `features/auth` so email/password fields call real Cognito-backed sign-up, sign-in, verification, and recovery flows. Google continues through a redirect-based Cognito federated flow and returns through `/auth/callback`.

**Rationale**: The spec makes the implemented screens mandatory, and the user explicitly ruled out visual-only authentication. A single frontend auth boundary lets screens remain stable while the implementation changes from the current dev mock/session shortcut to functional auth. Google is naturally redirect-based; email/password can remain in the app UI as long as it delegates to Cognito and never stores credentials.

**Alternatives considered**:
- Use only Cognito Hosted UI for every method: rejected because it would bypass the existing email/password screen fields or make them decorative.
- Keep dev-mode `beginSignIn()` as the main behavior: rejected because it is a mock acceptance path.
- Split Google and email/password across unrelated libraries: rejected unless required during implementation; one auth boundary should hide provider details from routes.

## 3. Google Account Creation and Linking

**Decision**: Google first login creates a Cognito/Campfire account when no verified normalized email exists. When a verified Google email matches an existing email/password account, the Google identity must be linked to the existing account. Campfire backend persistence must also enforce this by resolving verified normalized email before creating a local user.

**Rationale**: Cognito federation can otherwise produce distinct provider identities for the same email. The product requirement is one Campfire user per email. A Cognito trigger or equivalent identity-linking path handles identity-provider state, while backend email uniqueness protects Campfire-owned data even under concurrent or edge-case provider events.

**Alternatives considered**:
- Block Google login when email already exists: rejected because the clarification selected linking for trustworthy email identities.
- Allow separate users per provider subject: rejected because it violates the single-email account requirement.
- Link solely in frontend state: rejected because it cannot protect backend data or concurrent sign-ins.

## 4. Email Verification and Password Recovery

**Decision**: Include Cognito email verification and minimal password recovery in the MVP. Email/password users must verify email before entering the trusted main experience. Password recovery uses Cognito's reset request and secure confirmation flow, with non-enumerating user-facing responses.

**Rationale**: The spec clarifies both behaviors as in scope. Cognito provides these flows without exposing passwords or reset secrets to Campfire. The frontend needs verification and recovery states that match the existing visual style.

**Alternatives considered**:
- Defer verification: rejected by clarified requirement.
- Defer password recovery: rejected by clarified requirement.
- Build custom reset tokens in Campfire: rejected because Cognito already owns credentials.

## 5. Backend User Identity Model

**Decision**: Refactor the current `LocalUser` model from provider-subject-only uniqueness to a Campfire user with normalized email uniqueness and one or more authentication identity links. `/me` resolves by provider identity first, then by verified normalized email, links the new identity when appropriate, and only creates a user when neither exists.

**Rationale**: Current persistence queries only `provider_name + provider_subject`, which was enough for admin-provisioned auth bootstrap but not for multi-method sign-in. The new model keeps the backend independent from Cognito internals while preventing duplicate Campfire users for the same email.

**Alternatives considered**:
- Store only Cognito `sub` as user id: rejected because Google/native linking and future provider changes should not redefine the Campfire user id.
- Store only email with no identity links: rejected because provider-subject lookup is useful for idempotent returning sessions and auditability.
- Introduce a separate relational database: rejected as overengineering for the MVP.

## 6. Preferences and Onboarding State

**Decision**: Keep preferences simple: instruments, genres, usual playing context, Campfire goals, and experience level. Store onboarding state separately enough to distinguish `required`, `completed`, and `deferred`; saving preferences marks onboarding `completed`, while explicit skip marks it `deferred`.

**Rationale**: Preferences have a clear MVP purpose: initial musical context for the authenticated home and future product direction. Explicit deferral must persist, otherwise users who skip onboarding would be redirected repeatedly. Keeping deferral separate from preferences avoids fake or empty preference data.

**Alternatives considered**:
- Require fully completed preferences before home: rejected because clarification allows explicit deferral.
- Treat empty preferences as completed: rejected because it hides whether the user skipped intentionally.
- Expand preferences into repertoire, groups, or recommendations: rejected as out of scope.

## 7. Protected Routing and Redirect Rules

**Decision**: Make route guards state-aware: unauthenticated users go to `/signin`; authenticated users load `/me`; users with onboarding `required` go to `/onboarding`; users with `completed` or `deferred` may enter `/app`. Home always provides an update-preferences action.

**Rationale**: Auth state alone is insufficient for the MVP. Routing must combine session validity and onboarding state while avoiding protected content flash. The existing `ProtectedRoute` is the right boundary to preserve, but it needs loading, error, and onboarding routing states.

**Alternatives considered**:
- Navigate immediately after frontend sign-up without checking `/me`: rejected because backend state determines whether onboarding is required.
- Put onboarding checks inside every protected page: rejected because it duplicates routing policy.
- Block deferred users from home: rejected by clarification.

## 8. Local Validation Strategy

**Decision**: Use LocalStack for Campfire-owned AWS dependencies and backend integration tests, but require a real dev Cognito/Google configuration for full user-facing auth acceptance. Keep local signed JWT support only as a backend contract test tool.

**Rationale**: LocalStack Community does not provide full Cognito Hosted UI and Google federation parity. Calling that a complete auth test would violate the no-mocks requirement. The honest split is: LocalStack validates backend persistence/API behavior; dev Cognito validates real auth.

**Alternatives considered**:
- Mock Cognito for all local e2e auth: rejected as insufficient for MVP acceptance.
- Require cloud AWS for every backend test: rejected because it slows iteration and weakens local repeatability.
- Add LocalStack Pro as a required dependency: rejected for now due MVP simplicity and solo-maintainer cost.

## 9. Documentation and Design Palette

**Decision**: Update Mintlify docs to describe the new MVP, replace admin-only auth language, mirror the OpenAPI contract, and align docs colors with the Campfire design palette: primary `#E8813A`, dark `#131313`, and supporting warm/dark tones from `DESIGN.md`.

**Rationale**: Docs currently describe the earlier auth-bootstrap slice and use an older aqua palette. The MVP changes user-facing behavior and product positioning; docs must stay first-class and visually aligned.

**Alternatives considered**:
- Leave docs until after implementation: rejected by constitution and user request.
- Keep old aqua docs palette: rejected because `DESIGN.md` explicitly says not to reintroduce it.

## 10. Process File Alignment

**Decision**: Update only the active Spec-Kit plan pointer in `AGENTS.md` during planning. Do not rewrite constitution, Copilot instructions, or equivalent process docs unless implementation reveals a concrete mismatch.

**Rationale**: Existing process docs already support Spec-Kit, AWS/Terraform, Mintlify, and simple AI-assisted workflows. The new MVP direction changes product/auth requirements, not the repository operating model.

**Alternatives considered**:
- Rewrite constitution for the MVP: rejected because the current constitution already allows a lean auth/preferences slice and keeps broader music-domain features out of scope.
- Rewrite all AI instructions: rejected as unnecessary churn.
