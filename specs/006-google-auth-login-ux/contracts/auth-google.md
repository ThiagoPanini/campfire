# Contract: Google OAuth endpoints

**Surface owner**: `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/google_oauth.py` (NEW)
**Replaces (functionally)**: `POST /auth/google-stub` (kept gated for tests)
**Spec refs**: FR-001…FR-007, SC-001, SC-006

---

## `POST /auth/google/start`

Initiates a Google sign-in/sign-up flow. Idempotent per call (each call mints a fresh state row).

### Request

```http
POST /auth/google/start HTTP/1.1
Content-Type: application/json
```

```json
{ "intent": "sign-in", "next": "/repertoire" }
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `intent` | `"sign-in" \| "sign-up"` | yes | enum |
| `next` | `string \| null` | no | server re-validates: starts with `/`, not `//`, no `://`. Else dropped. |

### 200 Response

```json
{ "authorizeUrl": "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=…&…" }
```

### Side effects

- Sets cookie `campfire_oauth_state={state_id}.{state_secret}` with `Path=/auth/google; HttpOnly; Secure={REFRESH_COOKIE_SECURE}; SameSite=lax; Max-Age=600`.
- Inserts an `oauth_flow_states` row.

### Errors

| Status | Body | When |
|---|---|---|
| `503` | `{"detail":"google sign-in unavailable"}` | `GOOGLE_OAUTH_ENABLED=false` or required env var unset |
| `429` | `{"detail":"too many attempts"}` + `Retry-After` | rate-limit by `(client_ip, "google_start")` exceeded |

---

## `GET /auth/google/callback`

Receiver for Google's redirect. Always responds with a 302 — never a JSON body. Browser-only endpoint.

### Request (success)

```
GET /auth/google/callback?code=4/0Ad…&state=018f…&scope=email+profile+openid&authuser=0&prompt=none
Cookie: campfire_oauth_state=018f….abc123…
```

### Request (failure)

```
GET /auth/google/callback?error=access_denied&state=018f…
```

### 302 Response (success)

```
Location: ${WEB_BASE_URL}${return_to or "/home"}?auth=ok
Set-Cookie: campfire_refresh=…; Path=/auth/refresh; HttpOnly; Secure=…; SameSite=…; Max-Age=…
Set-Cookie: campfire_oauth_state=; Path=/auth/google; Max-Age=0       (clears the state cookie)
```

The frontend, on landing at `${WEB}${return_to}?auth=ok`, calls `POST /auth/refresh` to mint its access token from the just-set refresh cookie, then `history.replaceState` to strip `?auth=ok`.

### 302 Responses (failure — all generic)

| Cause | Location |
|---|---|
| User clicked "Cancel" on Google's consent (`?error=access_denied`) | `${WEB_BASE_URL}/signin?auth_error=google_cancelled` |
| Any other Google `?error=…`, missing/invalid `state`, missing/invalid state cookie, expired flow row, code-exchange failure, ID-token verification failure, `email_verified=false`, nonce mismatch, audience mismatch | `${WEB_BASE_URL}/signin?auth_error=google_failed` |
| `GOOGLE_OAUTH_ENABLED=false` | `${WEB_BASE_URL}/signin?auth_error=google_unavailable` |

### Logged (server-side, never returned)

A single structured line per failure:

```
event=google_oauth_failure reason=<short_code> request_id=<id>
```

`reason` is one of: `state_cookie_missing | state_cookie_invalid | state_row_missing | state_row_expired | state_row_consumed | state_query_mismatch | google_error_<code> | code_exchange_failed | id_token_invalid | nonce_mismatch | audience_mismatch | email_not_verified | unavailable`. No tokens, no claims, no email.

---

## Behavior matrix (account linking — FR-008…FR-011)

| `provider_links` lookup by (google, sub) | `users` lookup by email | Outcome |
|---|---|---|
| hit | (n/a) | use `link.user_id`, IssueSession |
| miss | hit, `email_confirmed_at IS NOT NULL` | insert ProviderLink, IssueSession |
| miss | hit, `email_confirmed_at IS NULL` (unconfirmed password account) | invalidate any pending `email_confirmations`, set `email_confirmed_at=now`, insert ProviderLink, IssueSession |
| miss | miss | create User (`display_name` from Google `name`, `email_confirmed_at=now`), insert ProviderLink, IssueSession |

In every successful case, `IssueSession` returns the same shape as `POST /auth/login`'s session creation — same fingerprint format, same TTL, same refresh cookie attributes (FR-029, FR-011).

---

## Removed/changed

- `POST /auth/google-stub` is **kept** but `GOOGLE_STUB_ENABLED` defaults to `false` (was `true`). Production sets it `false`; integration tests override to `true` via fixture.
