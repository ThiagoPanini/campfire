# Contract: Google OAuth Hardening

**Surface owner**: `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py`
**Findings**: S-1, S-6, S-7

## `POST /auth/google/start`

Behavior remains the slice-006 contract plus rate limiting.

### Rate Limit

The endpoint enforces the existing auth limiter using:

```text
key = (resolved_client_ip, "google_start")
```

`resolved_client_ip` comes from the trusted-proxy rule documented in [auth-changed.md](./auth-changed.md). The limiter uses `RATE_LIMIT_PER_WINDOW` and `RATE_LIMIT_WINDOW_SECONDS`.

### 429 Response

```json
{ "detail": "too many attempts" }
```

`Retry-After` is required.

## Account Promotion

When Google sign-in sees no existing provider link but finds an existing user by verified email:

| Existing user state | Required outcome |
|---|---|
| Confirmed password account | Insert provider link and issue a session; existing password credentials remain valid. |
| Unconfirmed password account | Invalidate pending confirmations, set `email_confirmed_at`, insert provider link, hard delete the password credential row, send one transactional notice, issue a session. |
| No password credential row | Continue promotion/linking without error. |

After promotion of an unconfirmed password account, `POST /auth/login` with the former password must return the same generic invalid-credentials response used for any failed password login.

## Production Startup

Google OAuth must not be considered production-safe when `ENV=prod` and `OAUTH_FLOW_HMAC_KEY` is missing. Lifespan validation fails before serving traffic.
