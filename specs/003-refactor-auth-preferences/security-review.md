# Security Review

## Email/Password Auth

Cognito owns passwords, email verification, password policy, and reset codes. Campfire frontend delegates sign-up, verification, sign-in, and recovery to Cognito and never persists plaintext credentials.

## Google Account Linking

Backend `/me` resolves provider identity first, then verified normalized email, and creates an identity link before creating a new Campfire user. Terraform account-linking trigger wiring is tracked for dev validation.

## Token/Session Handling

Browser session state stores bearer tokens and expiry metadata only. Logout clears local session state and dispatches same-tab/cross-tab change events. Backend persistence never stores access tokens or Google tokens.

## Password Recovery

Recovery requests and reset confirmations are Cognito-managed. User-facing copy must avoid account enumeration and raw provider errors.

## Public Endpoints

`/health`, `/`, `/signin`, `/signup`, and `/auth/callback` are public. `/me`, `/me/preferences`, `/me/onboarding`, `/app`, and `/onboarding` require a valid session.

## User/Preferences Data Access

Preferences are stored under the authenticated Campfire user id. Saving preferences marks onboarding completed; explicit deferral records onboarding status without creating fake preference data.

## Risks

- Real Cognito/Google validation depends on dev environment secrets and callback URLs.
- DynamoDB normalized-email uniqueness needs cloud validation under concurrent sign-in.
- Local JWT signer is useful for backend validation but is not MVP auth acceptance.

## Mitigations

- Keep real auth e2e gated by explicit environment variables.
- Store Google OAuth secret values in managed secret storage, not files.
- Keep observability events free of passwords, tokens, reset codes, and raw provider payloads.

## Validation Evidence

- Local backend tests validate claim mapping, `/me`, preferences, and onboarding behavior.
- Terraform validation checklist is recorded in `infra/terraform/tests/identity_validation.md`.
- Final command results belong in `validation-report.md`.
