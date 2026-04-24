# Contract: Cognito Authentication Configuration

This contract describes the required Cognito behavior for the MVP. Terraform may organize resources differently, but the deployed behavior must satisfy this contract.

## User Pool

| Capability | Required behavior |
|---|---|
| Public sign-up | Enabled for email/password users. `allow_admin_create_user_only` must not remain enabled for the MVP user pool. |
| Sign-in identifier | Email is the user-facing identifier. Implementation may keep Cognito username internals opaque. |
| Email verification | Required for email/password accounts before trusted main experience access. |
| Password policy | Strong password policy configured in Terraform. Exact values may keep the current stricter baseline unless user experience requires adjustment. |
| Password recovery | Enabled for email/password accounts using Cognito-managed reset flow. |
| User existence protection | Enabled where Cognito supports it, and frontend responses remain non-enumerating. |
| Token issuer | API Gateway JWT authorizer validates issuer and web app client audience. |
| Callback URL | Includes deployed web `/auth/callback` and any approved local/dev callback used for real auth validation. |
| Logout URL | Includes deployed public landing page and any approved local/dev logout URL. |

## App Client

| Setting | Required behavior |
|---|---|
| Public client | No client secret in the browser. |
| OAuth flow | Authorization code with PKCE for redirect/federated flows. |
| Scopes | At minimum `openid`, `email`, and `profile`. |
| Supported providers | Cognito native provider and Google. |
| Token validity | Short-lived access/id tokens and bounded refresh lifetime appropriate for MVP. |

## Google Identity Provider

| Setting | Required behavior |
|---|---|
| Provider | Google configured as Cognito identity provider. |
| Secrets | Google client secret stored in AWS Secrets Manager or SSM SecureString/KMS path; never committed. |
| Attribute mapping | Email, email verified/trustworthy signal, name/display fields mapped into Cognito claims where available. |
| Trust rule | Google identities are accepted only when the email is verified/trustworthy. |

## Account Linking

The system must prevent duplicate users for the same email at both identity and Campfire-data levels.

Required behavior:

1. Normalize incoming email before comparison.
2. If Google returns a verified/trustworthy email with no existing account, allow first-login account creation.
3. If Google returns a verified/trustworthy email that matches an existing email/password account, link the Google provider identity to that existing account.
4. If email is missing or not trustworthy, fail safely and do not create or link an account.
5. Backend `/me` must still enforce normalized-email uniqueness even if provider linking is delayed or retried.

Implementation options:

- Preferred: Cognito pre-sign-up or pre-token-generation trigger performs provider linking with `AdminLinkProviderForUser` or equivalent provider-supported action, scoped by least-privilege IAM.
- Acceptable fallback: Provider state remains distinct in Cognito temporarily, but backend enforces one Campfire user by verified normalized email and implementation tasks include a follow-up trigger before production release.

The fallback is not acceptable as final MVP behavior if it lets users see two Campfire accounts for the same email.

## Frontend Auth Functions

The frontend `features/auth` boundary should expose behavior equivalent to:

| Function | Behavior |
|---|---|
| `signUpWithEmail(email, password)` | Creates Cognito email/password user and enters verification-required state if needed. |
| `confirmEmail(email, code)` | Confirms email verification. |
| `signInWithEmail(email, password)` | Authenticates email/password user and stores real Cognito session state. |
| `signInWithGoogle()` | Starts Cognito Google redirect. |
| `completeRedirect()` | Completes `/auth/callback`, stores real session state, and returns authenticated status. |
| `requestPasswordReset(email)` | Starts Cognito password reset with safe user-facing response. |
| `confirmPasswordReset(email, code, newPassword)` | Completes password reset. |
| `signOut()` | Clears local session state and performs Cognito sign-out where applicable. |
| `getSession()` | Returns valid non-expired session or null. |

## Security Requirements

- No plaintext password logging.
- No Cognito client secret in frontend code.
- No Google secret in Terraform variables committed with values.
- No raw provider error shown to users.
- No access token stored in backend persistence.
- JWT validation remains at API Gateway in AWS and at the local server boundary for local backend tests.
