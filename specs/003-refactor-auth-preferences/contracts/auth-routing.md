# Contract: Frontend Authentication Routing

This contract defines visible route behavior for the MVP. The implementation may change internal component names, but these route outcomes must hold.

## Routes

| Route | Audience | Expected behavior |
|---|---|---|
| `/` | Public | Shows the landing page. Authenticated users may still view it, but primary entry actions should take them to the correct authenticated destination. |
| `/signin` | Public/auth entry | Shows sign-in page with Google and email/password. If already authenticated, route according to onboarding state. |
| `/signup` | Public/auth entry | Shows sign-up page with Google and email/password. If already authenticated, route according to onboarding state. |
| `/auth/callback` | Public callback | Completes Cognito/Google redirect, persists real session state, then loads `/me` to decide next route. |
| `/onboarding` | Protected | Requires valid session. Shows preference onboarding for users with `required`, `deferred`, or `completed` state. Save marks completed. Explicit skip marks deferred. |
| `/app` | Protected | Requires valid session. Shows home only after onboarding is `completed` or `deferred`. If onboarding is `required`, redirect to `/onboarding`. |
| `/app/me` | Compatibility | Redirects to `/app`; old bootstrap page is no longer the primary surface. |

## Route Decision Matrix

| Session state | `/` | `/signin` or `/signup` | `/onboarding` | `/app` |
|---|---|---|---|---|
| No session | landing | auth page | redirect to `/signin?returnTo=/onboarding` | redirect to `/signin?returnTo=/app` |
| Session loading/unknown | landing or loading auth state | loading auth state | protected loading state | protected loading state |
| Authenticated, `/me` fails 401 | clear session, route to sign-in | sign-in | clear session, route to sign-in | clear session, route to sign-in |
| Authenticated, onboarding `required` | landing allowed | redirect to `/onboarding` | onboarding | redirect to `/onboarding` |
| Authenticated, onboarding `deferred` | landing allowed | redirect to `/app` | onboarding update page | home |
| Authenticated, onboarding `completed` | landing allowed | redirect to `/app` | onboarding update page | home |

## Sign-Up and Login Outcomes

### Email/password sign-up

1. User submits email and password from `/signup`.
2. Frontend calls the Cognito-backed sign-up function.
3. If Cognito requires email verification, show verification state in the same visual system.
4. After successful verification and sign-in, call `/me`.
5. If `/me.onboarding.status` is `required`, route to `/onboarding`.
6. If status is `completed` or `deferred`, route to `/app`.

### Email/password login

1. User submits email and password from `/signin`.
2. Frontend calls the Cognito-backed sign-in function.
3. Invalid credentials, missing account, or unverified email show friendly errors.
4. On success, call `/me`.
5. Route according to onboarding state.

### Google sign-up/login

1. User selects Google from `/signin` or `/signup`.
2. Frontend starts Cognito federated Google redirect.
3. `/auth/callback` completes the real provider flow.
4. Frontend calls `/me`.
5. Backend resolves/creates/links the Campfire user without duplicate email accounts.
6. Route according to onboarding state.

### Password recovery

1. User starts recovery from `/signin`.
2. Frontend requests Cognito password reset.
3. The visible response is safe and friendly whether or not the email exists.
4. User submits reset code and new password.
5. On success, user returns to sign-in or is signed in if the chosen Cognito client flow supports it safely.

## Logout

1. Authenticated home and authenticated onboarding must expose a clear logout path.
2. Logout clears local session state before redirecting.
3. Production/dev-cloud logout invokes Cognito sign-out where applicable.
4. The next protected interaction in any tab must re-check session state and block protected content.

## Error Message Requirements

Messages must be friendly and actionable for:

- Invalid credentials.
- Account not found or not available through that method.
- Email already used during sign-up.
- Unverified email.
- Google cancellation.
- Google provider failure.
- Google email missing or not trustworthy.
- Session expired.
- Preferences save failure.

Messages must not expose passwords, raw provider errors, reset codes, access tokens, or whether a password-recovery email exists.

## Non-Acceptance Paths

The following may exist only in isolated unit/component testing and must not count as MVP acceptance:

- Local mock session creation from the sign-in button.
- Hardcoded tokens in browser storage.
- Visual sign-up that navigates to onboarding without a Cognito account/session.
- Google button that calls the same behavior as email/password without a provider redirect.
