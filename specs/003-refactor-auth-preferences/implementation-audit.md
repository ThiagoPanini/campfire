# Implementation Audit

## Preserve

### Frontend

- Preserve `apps/web/src/routes/public/LandingPage.tsx` as the mandatory public entry baseline.
- Preserve `apps/web/src/routes/public/AuthPage.tsx` visual structure while replacing mock auth actions.
- Preserve `apps/web/src/routes/protected/OnboardingPage.tsx` as the mandatory preferences onboarding screen.
- Preserve `apps/web/src/routes/protected/AppHome.tsx` as the mandatory authenticated home baseline.

### Backend

- Preserve the domain/application/infrastructure separation around user context and preferences.
- Preserve local JWT signing only for backend and controlled test validation.

### Infra

- Preserve Terraform modules for identity, persistence, API runtime, and dev composition.

### Tests

- Preserve focused unit, contract, integration, and Playwright coverage around the MVP routes.

### Docs

- Preserve Mintlify docs-as-code and mirror the OpenAPI contract in `docs/openapi.yaml`.

## Refactor

- Refactor user identity resolution from provider-subject-only lookup to provider identity plus normalized email linking.
- Refactor frontend auth actions to call Cognito email/password and redirect boundaries.
- Refactor protected routing to use `/me.onboarding.status`.
- Refactor preferences save to complete onboarding and explicit skip to defer onboarding.

## Remove/Defer

- Remove mock session creation from user-facing auth buttons as an MVP acceptance path.
- Defer repertoire, groups, recommendations, song capability, and social discovery features.
- Defer full production hardening evidence until dev Cognito/Google credentials are available.

## Verification Notes

- US1: Landing, sign-in, and sign-up routes remain public; protected routes redirect unauthenticated users to sign-in.
  - LandingPage primary CTA "ENTER CAMPFIRE" routes to `/signup`; Nav sign-in action routes to `/signin`.
  - `/signin` and `/signup` are defined as bare public routes in `router.tsx` with no ProtectedRoute wrapper.
  - `ProtectedRoute` redirects unauthenticated `/app` and `/onboarding` access to `/signin?returnTo=<path>`.
  - Public copy updated: replaced "WITH OTHERS." with "WITH YOUR GROUP." to reflect private-music-hub alpha scope.
  - Playwright coverage in `public-entry.spec.ts` validates landing content, CTA routing, and protected-route blocking.
  - Unit routing coverage in `auth-routing.test.tsx` validates all unauthenticated and onboarding-status redirect cases.
- US2: Email/password auth functions and Google redirect functions are implemented behind `features/auth`.
  - `cognitoEmailPassword.ts` — sign-up, confirm email, sign-in, password reset request, reset confirm.
  - `cognitoRedirect.ts` — Google sign-in start, redirect callback, Cognito sign-out.
  - `session.ts` — `persistSessionFromTokens`, `signOut`, `beginGoogleSignIn`, `completeRedirectSignIn`.
  - Backend: `GetOrBootstrapLocalUser` resolves by provider identity → normalized email → creates user.
  - Backend: `DynamoDbLocalUserRepository` uses GSI1 (email) and GSI2 (provider identity) for lookups.
  - Terraform: Cognito user pool with public sign-up, email verification, Google provider, password recovery.
  - Terraform: Lambda pre-sign-up trigger wired via `aws_lambda_permission` for account linking.
  - Terraform: API Gateway routes added for `PUT /me/preferences`, `PATCH /me/onboarding`.
- US3: Preferences save and onboarding deferral call backend APIs.
  - `OnboardingPage.tsx` — loads preferences, saves updates, defers, shows errors, preserves visible choices.
  - `ProtectedRoute` routes onboarding-required users to `/onboarding`, allows completed/deferred into `/app`.
  - Backend: `GET /me/preferences`, `PUT /me/preferences`, `PATCH /me/onboarding` all wired and tested.
- US4: Home renders `/me` user and onboarding state and exposes sign-out plus update preferences.
  - `AppHome.tsx` — renders extended `/me` context, sign-out button, update preferences action.
  - `session.ts` — `signOut` clears session, dispatches `campfire-auth-changed`, triggers Cognito sign-out.
- US5: Resolved decisions:
  - Removed: `AppShell.tsx`, `MeBootstrapPage.tsx`, `me-bootstrap.spec.ts` (deleted files, not in router).
  - Preserved: `/app/me` as a compatibility redirect to `/app` only.
  - Backend: No admin-only auth assumptions remain; service always resolves through verified identity.
  - AGENTS.md: No update required — direction already reflects MVP real-auth requirement.
  - README.md: Updated to describe MVP scope, real-auth requirement, and LocalStack boundary.

## Final Decision Record

| Area | Decision | Status |
|------|----------|--------|
| Mock auth acceptance path | Removed from user-facing auth buttons | ✓ Done |
| `bootstrap.firstLogin` routing source | Replaced by `me.onboarding.status` | ✓ Done |
| `AppShell` / `MeBootstrapPage` | Deleted; replaced by `OnboardingPage` + `AppHome` | ✓ Done |
| Cognito triggers | `pre_sign_up` Lambda wired in Terraform | ✓ Done |
| `/me/preferences`, `/me/onboarding` routes | Added to API Gateway in `api_runtime/main.tf` | ✓ Done |
| Repertoire / groups / social features | Deferred to future spec | ✓ Deferred |
