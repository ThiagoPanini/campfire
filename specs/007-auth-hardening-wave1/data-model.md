# Data Model: Auth Hardening Wave 1

No database schema changes or migrations are planned for Wave 1. Existing tables and entities remain authoritative; this slice changes behavior, repository ports, HTTP response schemas, and configuration validation.

## Existing Entities Touched

### User Account

Represents the user's identity, email address, display name, confirmation state, and linked sign-in methods.

**Fields used by this slice**:
- `id`
- `email`
- `display_name`
- `email_confirmed_at`

**Behavior changes**:
- When an unconfirmed password account is promoted by verified Google sign-in, `email_confirmed_at` is set as it is today, provider link creation remains unchanged, and stale password credentials are deleted.
- Existing sessions and refresh-token families are preserved.

### Password Credential

Represents password authentication for a user.

**Behavior changes**:
- Add repository port method `CredentialsRepository.delete_for_user(user_id)`.
- Google promotion of an unconfirmed account hard deletes the row for that user.
- No sentinel hash or new credential state is introduced.

### Provider Link

Represents the relationship between a user and a verified Google subject.

**Behavior changes**:
- No schema change. The promotion path now deletes stale credentials before session issuance.

### Refresh-Token Family

Represents refresh-session continuity and rotation history.

**Behavior changes**:
- No schema change. `POST /auth/refresh` and `POST /auth/logout` reject disallowed Origins before rotating, revoking, or consuming tokens.

### Rate-Limit Counter

In-memory counter keyed by resolved client IP and endpoint target.

**Behavior changes**:
- Resolved client IP is computed by the HTTP adapter using `TRUSTED_PROXIES` and `X-Forwarded-For`.
- Google-start uses target `"google_start"` with existing global auth limiter settings.

### Email Confirmation

Represents pending or completed email confirmation attempts.

**Behavior changes**:
- Repository update/invalidate methods no longer commit inline.
- Confirmation row changes and user confirmation changes commit or roll back with the request transaction.

### Auth Configuration

Public booleans used by the frontend to render auth surfaces.

**Schema change (HTTP only, not DB)**:

```json
{
  "google": { "enabled": true },
  "passwordSignUp": {
    "enabled": true,
    "requiresEmailConfirmation": true
  }
}
```

`passwordSignUp.requiresEmailConfirmation` is sourced from `settings.email_confirmation_required()`.

## Validation Rules

- `Password()` remains the domain source of password strength validation.
- `RegisterUser` invokes `Password()` after the route-level rate-limit check and before branching on known/unknown email.
- `ValueError` from `Password()` is caught and translated to a domain error; it must not escape as a 500.
- `TRUSTED_PROXIES` entries must parse as valid CIDR blocks or individual IP addresses normalized to networks.
- `Origin` on refresh/logout must be present in `CORS_ORIGINS` for session-mutating cookie requests in production-like operation.
- In `ENV=prod`, `EMAIL_CONFIRMATION_HMAC_KEY` and `OAUTH_FLOW_HMAC_KEY` are mandatory before serving traffic.

## State Transitions

### Google Promotion

```text
unconfirmed password account
  -> verified Google sign-in succeeds
  -> pending confirmations invalidated
  -> user.email_confirmed_at set
  -> provider link inserted
  -> password credential hard deleted
  -> transactional notice sent
  -> session issued
```

### Cross-Origin Refresh/Logout

```text
request received
  -> Origin dependency checks allow-list
  -> rejected: no refresh/session mutation
  -> allowed: existing refresh/logout use case proceeds unchanged
```

### Email Confirmation Transaction

```text
confirmation row update + user.email_confirmed_at update
  -> request succeeds: request-scope commit persists both
  -> downstream failure: request-scope rollback reverts both
```
