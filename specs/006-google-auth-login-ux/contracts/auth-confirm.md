# Contract: Email-confirmation endpoints

**Surface owner**: `apps/api/src/campfire_api/contexts/identity/adapters/http/routers/confirm.py` (NEW)
**Spec refs**: FR-013…FR-020, US2 acceptance scenarios, SC-008

---

## `POST /auth/confirm`

Verifies a confirmation code and, on success, opens a normal Campfire session.

### Request

```http
POST /auth/confirm HTTP/1.1
Content-Type: application/json
```

```json
{ "email": "user@example.com", "code": "482915" }
```

| Field | Type | Validation |
|---|---|---|
| `email` | `string` | trimmed, lowercased, `Email` VO rules |
| `code` | `string` | exactly 6 ASCII digits |

### 200 Response (success)

Identical shape to `POST /auth/login`:

```json
{ "accessToken": "…", "tokenType": "Bearer", "expiresIn": 900 }
```

`Set-Cookie: campfire_refresh=…; Path=/auth/refresh; HttpOnly; Secure=…; SameSite=…; Max-Age=…` — same attributes as login.

### 400 Response — generic invalid

Returned for every failure mode (FR-024 — no enumeration):

```json
{ "detail": "confirmation invalid" }
```

Triggers (server-internal — never reflected in body or status):

| Internal cause | Internal error |
|---|---|
| Email maps to no user | `ConfirmationCodeInvalid` |
| User has no pending confirmation | `ConfirmationCodeInvalid` |
| Code mismatch | `ConfirmationCodeInvalid` (after `attempt_count++`) |
| Code expired | `ConfirmationCodeExpired` |
| `attempt_count >= MAX_ATTEMPTS` | `ConfirmationAttemptsExceeded` |

### 429 Response — rate limited

```json
{ "detail": "too many attempts" }
```

`Retry-After: <seconds>` header. Triggered by `(client_ip, email)` rate-limiter on confirm submissions.

### Side effects (success path)

1. `email_confirmations.status = 'verified'`.
2. `users.email_confirmed_at = now`.
3. New `Session` + `RefreshToken` rows (`IssueSession`).
4. Refresh cookie set.

---

## `POST /auth/confirm/resend`

Issues a fresh confirmation code, invalidating any prior pending one. Always returns `202 Accepted` with the same body, regardless of whether the email maps to a user, an unconfirmed user, or a confirmed user — to prevent enumeration (FR-016, FR-017).

### Request

```http
POST /auth/confirm/resend HTTP/1.1
Content-Type: application/json
```

```json
{ "email": "user@example.com" }
```

| Field | Type | Validation |
|---|---|---|
| `email` | `string` | `Email` VO rules |

### 202 Response

```json
{ "status": "ok" }
```

### Side effects (varies by case — never visible)

| Case | Effect |
|---|---|
| Unknown email | none |
| Confirmed user | sends a `someone_tried_signup` notification (no code) — FR-017 |
| Unconfirmed user, within cooldown | none (silently rate-limited) |
| Unconfirmed user, hourly cap reached | none (silently rate-limited) |
| Unconfirmed user, allowed | invalidate prior pending → insert fresh → send confirmation email |

### 429 Response

Returned only for the (client_ip)-keyed in-memory rate limiter (a global throttle to deter scripted resend storms). DB caps are silent.

```json
{ "detail": "too many attempts" }
```

`Retry-After: <seconds>`.

---

## Caps & timings (defaults — all configurable per [research.md](../research.md) R11)

| Cap | Default | Setting |
|---|---|---|
| Code TTL | 15 min | `EMAIL_CONFIRMATION_TTL_SECONDS=900` |
| Max wrong attempts per code | 5 | `EMAIL_CONFIRMATION_MAX_ATTEMPTS=5` |
| Min seconds between resends per account | 60 | `EMAIL_CONFIRMATION_RESEND_COOLDOWN_SECONDS=60` |
| Resends per rolling hour per account | 3 | `EMAIL_CONFIRMATION_RESEND_HOURLY_CAP=3` |
| In-memory IP rate limit (confirm submit) | 10 / 5 min | reuses existing `RATE_LIMIT_PER_WINDOW` / `RATE_LIMIT_WINDOW_SECONDS` |

---

## Email content (informational — verified by integration tests)

- **Subject**: localized (en/pt) — e.g. `"Your Campfire confirmation code"` / `"Seu código de confirmação Campfire"`.
- **Body**: code in fixed-width, expiry in user-readable form, security note. **No links**, **no tokens**, **no internal IDs** (FR-019).
- **From**: `MAIL_FROM`.
- **`someone_tried_signup` notice**: separate template, no code, plain message that someone tried to sign up using this address; advises to ignore if not them.
