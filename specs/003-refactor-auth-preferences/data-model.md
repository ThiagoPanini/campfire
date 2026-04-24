# Data Model: Refactor Campfire Authentication and Preferences MVP

## Overview

The MVP keeps identity credentials in Cognito and stores only Campfire-owned user, identity-link, onboarding, and preference data in DynamoDB. The backend domain should not depend on Cognito SDKs, HTTP handlers, or DynamoDB details.

## Entity: CampfireUser

Represents one person in Campfire. There must be exactly one `CampfireUser` per normalized email.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `user_id` | string | yes | Stable Campfire-owned id, e.g. `user_<uuid>`. |
| `email` | string | yes | User-facing email address from a verified/trustworthy identity. |
| `email_normalized` | string | yes | Lowercase/trimmed email used for uniqueness. |
| `email_verified` | boolean | yes | True only after Cognito email verification or trustworthy Google email. |
| `display_name` | string | yes | From Cognito/Google profile or email fallback. |
| `status` | enum | yes | `active` for MVP. Future values require a new spec or task. |
| `created_at` | datetime | yes | ISO 8601 UTC. |
| `updated_at` | datetime | yes | ISO 8601 UTC. |
| `last_login_at` | datetime | yes | Refreshed on successful `/me` resolution. |

### Validation Rules

- `email_normalized` must be unique.
- `email_verified` must be true before `/me` creates or links a user.
- Passwords, reset codes, verification codes, and provider access tokens are never fields on this entity.
- Updating `display_name` must not create a new user.

### Suggested DynamoDB Shape

- `pk = USER#<user_id>`, `sk = PROFILE`
- GSI for email uniqueness: `gsi_email_pk = EMAIL#<email_normalized>`, `gsi_email_sk = PROFILE`
- Conditional writes must prevent duplicate email records under concurrency.

## Entity: AuthenticationIdentityLink

Associates one Cognito/provider identity with one `CampfireUser`.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `user_id` | string | yes | Owner Campfire user. |
| `provider_name` | string | yes | Examples: `cognito`, `google`. |
| `provider_subject` | string | yes | Stable provider subject from verified token claims. |
| `email_normalized` | string | yes | Copied for lookup/audit. |
| `linked_at` | datetime | yes | ISO 8601 UTC. |
| `last_used_at` | datetime | yes | Refreshed on login. |

### Validation Rules

- `(provider_name, provider_subject)` must be unique.
- A link may be created only when the incoming identity has a verified/trustworthy email.
- If the incoming email matches an existing `CampfireUser`, link to that user instead of creating a new one.
- If the incoming email is not trustworthy, do not link and return a friendly auth error.

### Suggested DynamoDB Shape

- `pk = USER#<user_id>`, `sk = IDENTITY#<provider_name>#<provider_subject>`
- GSI for identity lookup: `gsi_identity_pk = IDENTITY#<provider_name>#<provider_subject>`, `gsi_identity_sk = USER`

## Entity: AuthenticatedSession

Represents the temporary browser/API session created from Cognito tokens. This is not persisted in Campfire-owned storage.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `access_token` | JWT | yes | Stored only in browser session handling. |
| `id_token` | JWT | optional | Used if required by frontend user profile/session library. |
| `expires_at` | datetime/epoch | yes | Used to end local session state. |
| `email` | string | yes | From token claims. |
| `display_name` | string | optional | From token claims. |

### Validation Rules

- Tokens must come from the configured Cognito issuer and app client.
- Expired tokens must not authorize protected routes or API calls.
- Logout clears local session state and invokes Cognito sign-out when applicable.

## Entity: OnboardingState

Tracks whether a user should be routed to onboarding before the main home.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `user_id` | string | yes | Owner Campfire user. |
| `status` | enum | yes | `required`, `completed`, or `deferred`. |
| `completed_at` | datetime | no | Set when preferences are saved. |
| `deferred_at` | datetime | no | Set when user explicitly skips. |
| `updated_at` | datetime | yes | ISO 8601 UTC. |

### State Transitions

```text
required -> completed   when preferences are saved
required -> deferred    when user explicitly defers onboarding
deferred -> completed   when preferences are later saved
completed -> completed  when preferences are updated
```

### Validation Rules

- New users default to `required`.
- Users with `required` must be routed to `/onboarding` before `/app`.
- Users with `deferred` may enter `/app`, and home must keep a clear update-preferences action.
- `completed` does not mean all preference fields are non-empty; it means the user saved the onboarding form.

### Suggested DynamoDB Shape

- May be embedded in `USER#<user_id> / PROFILE` for simplicity, or stored as `pk = USER#<user_id>`, `sk = ONBOARDING`.
- The implementation should choose the simpler shape that keeps `/me` fast and avoids cross-item transactions unless needed.

## Entity: UserPreferences

Captures initial musical context for the MVP.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `user_id` | string | yes | Owner Campfire user. |
| `instruments` | list[string] | yes | Zero or more values from allowed set. |
| `genres` | list[string] | yes | Zero or more values from allowed set. |
| `play_context` | enum/null | no | Usual playing context. |
| `goals` | list[string] | yes | Zero or more values from allowed set. |
| `experience_level` | enum/null | no | General self-declared level, not song proficiency. |
| `updated_at` | datetime | yes | ISO 8601 UTC. |

### Allowed Values

`instruments`:

- `Guitar`
- `Bass`
- `Drums`
- `Piano / Keys`
- `Vocals`
- `Violin`
- `Cavaquinho`
- `Ukulele`
- `Cajon`
- `Mandolin`
- `Flute`
- `Other`

`genres`:

- `Rock`
- `MPB`
- `Samba`
- `Jazz`
- `Forro`
- `Bossa Nova`
- `Pop`
- `Blues`
- `Country`
- `Metal`
- `Reggae`
- `Funk`
- `Other`

`play_context`:

- `friends`
- `amateur`
- `pro`
- `solo`
- `church`
- `sessions`

`goals`:

- `Learn new songs faster`
- `Track my full repertoire`
- `Share my set with the group`
- `Prepare for jam sessions`
- `Practice more consistently`
- `Know what I can already play`

`experience_level`:

- `beginner`
- `learning`
- `intermediate`
- `advanced`

### Validation Rules

- Values outside the allowed sets are rejected with `400 invalid_preferences`.
- Duplicate list values are de-duplicated while preserving first occurrence.
- Empty lists are allowed so users can save partial preferences.
- Preferences are private to the authenticated account.
- Saving preferences sets onboarding state to `completed`.
- Preference text must not imply full repertoire, groups, recommendations, or song capability exists in the MVP.

### Suggested DynamoDB Shape

- `pk = USER#<user_id>`, `sk = PREFERENCES`

## Entity: PasswordRecoveryRequest

Represents Cognito-managed password recovery. Campfire does not persist this entity, but the frontend must expose the flow.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `email` | string | yes | Submitted by user. |
| `delivery_destination` | string | optional | Masked destination returned by Cognito if available. |
| `expires_at` | datetime | provider-owned | Cognito-managed; not stored by Campfire. |

### Validation Rules

- User-facing reset request responses must not publicly confirm whether the email exists.
- New password submission must fail safely for invalid or expired reset codes.
- Password policy is owned by Cognito/Terraform configuration.

## Entity: EmailVerificationChallenge

Represents Cognito-managed email verification for email/password accounts. Campfire does not persist this entity, but routing and copy must support it.

| Field | Type | Required | Notes |
|---|---|---:|---|
| `email` | string | yes | Submitted by user. |
| `verification_code` | string | yes | User-entered code sent by Cognito; never logged. |

### Validation Rules

- Email/password accounts must verify email before being trusted for the main authenticated experience.
- Google identities are accepted only when the provider email is verified/trustworthy.
- Verification failures must show friendly, actionable errors.

## `/me` View Model

The frontend needs a single user-context response after authentication.

| Field | Type | Notes |
|---|---|---|
| `user.id` | string | Campfire user id. |
| `user.email` | string | Verified/trustworthy email. |
| `user.displayName` | string | Display name. |
| `user.status` | enum | `active`. |
| `user.lastLoginAt` | datetime | Last successful user-context resolution. |
| `auth.emailVerified` | boolean | Whether the current identity is trusted. |
| `auth.methods` | list[string] | Optional known methods, e.g. `email_password`, `google`. |
| `onboarding.status` | enum | `required`, `completed`, `deferred`. |
| `onboarding.hasPreferences` | boolean | True when preferences exist. |
| `bootstrap.firstLogin` | boolean | True only when Campfire local user was created during this request. |

## Lifecycle Summary

```text
New email/password signup
  Cognito creates unverified account
  -> user verifies email
  -> frontend obtains Cognito session
  -> GET /me creates CampfireUser + identity link + onboarding required
  -> /onboarding
  -> PUT /me/preferences marks completed
  -> /app

New Google login
  Cognito receives verified/trustworthy Google email
  -> link trigger checks existing email or creates provider identity
  -> frontend obtains Cognito session
  -> GET /me resolves by identity or email
  -> onboarding required unless already completed/deferred

Existing user with completed onboarding
  Cognito authenticates
  -> GET /me resolves existing CampfireUser
  -> route directly to /app

Existing user without completed onboarding
  Cognito authenticates
  -> GET /me returns onboarding required
  -> route to /onboarding
  -> save preferences or explicitly defer
```
