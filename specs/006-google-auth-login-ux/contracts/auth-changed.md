# Contract: Existing endpoints — diff

This file documents only the deltas from today's contracts. Endpoints not listed here (`POST /auth/refresh`, `POST /auth/logout`, `GET /me`) are unchanged.

---

## `POST /auth/register` — CHANGED

### Before

- `201 Created` with `{ displayName, email }`.
- Sets refresh cookie immediately.
- Issues an access token in the body via the same path as login.

### After

- `202 Accepted` with `{ "status": "confirmation_required" }`.
- **No refresh cookie set.**
- **No access token in body.**
- Server-side: creates `User` with `email_confirmed_at = NULL`, persists `Credentials`, inserts a `pending` row in `email_confirmations`, calls `EmailSender.send_confirmation_code(...)`.

### Enumeration-resistant duplicate handling (FR-017, FR-018)

| Server-internal case | Response |
|---|---|
| Brand-new email | `202 { "status": "confirmation_required" }`, code sent |
| Existing **unconfirmed** account | `202 { "status": "confirmation_required" }`, prior pending row invalidated, fresh row inserted, code sent — subject to resend caps (silent if capped) |
| Existing **confirmed** account | `202 { "status": "confirmation_required" }`, **no** confirmation code sent, instead `EmailSender.send_duplicate_signup_notice(...)` to the existing address |

The user-visible response body is byte-identical in all three cases (FR-024).

### 400 Response — input validation only

```json
{ "detail": "invalid email or password" }
```

Returned for malformed email or password not meeting strength rules. Domain-level password validation is the source of truth; the HTTP schema's `min_length=10` is a fast-fail UX hint.

### 429 — unchanged

```json
{ "detail": "too many attempts" }
```

`Retry-After: <seconds>`.

---

## `POST /auth/login` — CHANGED

### Behavior change

- If the credentials are correct AND `users.email_confirmed_at IS NULL`:
  - response is `200` with body shape **identical to a normal login** (`{ accessToken, tokenType, expiresIn }`) BUT the access token's session has `revoked_at IS NULL` and the user is, in effect, unconfirmed — *no* — strike that.
  - Actually: the server MUST NOT issue a session for an unconfirmed user. Instead, response is `200` with body:

    ```json
    { "status": "confirmation_required" }
    ```

  This is the one case where a successful credential check yields a non-token response. The frontend recognizes the body shape and routes to the confirm-email page with the email pre-filled. **This is safe against enumeration because the alternate body is only ever returned when the password is actually correct** — an attacker probing emails learns nothing: wrong-password + unknown-email + unconfirmed-with-wrong-password all return the same `401 invalid credentials`.

- If the credentials are correct AND the account is confirmed: unchanged — `200 { accessToken, tokenType, expiresIn }` + refresh cookie.
- If the credentials are wrong, the email is unknown, or the account is Google-only with no `Credentials` row: `401 { "detail": "invalid credentials" }` — unchanged.

### 200 Response shapes (one of)

```json
{ "accessToken": "…", "tokenType": "Bearer", "expiresIn": 900 }
```

or

```json
{ "status": "confirmation_required" }
```

Frontend `auth.api.ts` discriminates on the presence of `accessToken`.

### 401 — unchanged

```json
{ "detail": "invalid credentials" }
```

### 429 — unchanged

```json
{ "detail": "too many attempts" }
```

`Retry-After: <seconds>`.

---

## `POST /auth/logout` — UNCHANGED

Already lands the user logically at "no session". Frontend now navigates to `/` (public landing) explicitly per FR-028. No server-side change.

---

## `GET /me` — UNCHANGED

Same `{ displayName, email }` shape. No new fields surface (provider links and confirmation status are never exposed in `/me` per FR-012).

---

## OpenAPI snapshot

`apps/api/tests/contract/test_openapi_snapshot.py` is updated to include:

- changed `POST /auth/register` (202 + new schema)
- changed `POST /auth/login` (`200` `oneOf` two schemas)
- new `POST /auth/google/start`
- new `GET /auth/google/callback` (302 only — documented but no JSON body)
- new `POST /auth/confirm`
- new `POST /auth/confirm/resend`
- new `GET /auth/config`

The snapshot is regenerated as part of the implementation slice; reviewers diff it deliberately.
