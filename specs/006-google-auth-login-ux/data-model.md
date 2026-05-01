# Data Model: Google Authentication and Login Experience Improvements

**Phase**: 1 · **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Research**: [research.md](./research.md)

This document captures the entity model, schema deltas, state machines, and validation rules introduced by this feature. Schema deltas land as a single Alembic migration `0003_identity_oauth_and_confirmation` (down-revision is the current head — `0002_repertoire_initial`, which already exists on `main`). The schema content is unchanged from earlier drafts; only the revision identifiers are sequenced after the existing repertoire migration.

---

## 1. Entities

### 1.1 User (existing — one column added)

Changed:

| Field | Type | Constraint | Notes |
|---|---|---|---|
| `email_confirmed_at` | `datetime \| None` | nullable | NEW. NULL means the email-bearing account is awaiting confirmation. Backfilled to `created_at` for all rows existing before this migration. |

All other fields unchanged: `id: UserId`, `email: Email`, `display_name: DisplayName`, `created_at: datetime`, `updated_at: datetime`.

Domain invariants:

- A user with `email_confirmed_at IS NULL` MUST also have a `Credentials` row (it was a password sign-up that hasn't been confirmed yet) OR it MUST have at least one `ProviderLink` (the linker is responsible for setting `email_confirmed_at = now`). The empty case is impossible — either invariant holds.
- Once `email_confirmed_at` is set, it MUST NOT be cleared by any code path.

### 1.2 Credentials (existing — unchanged)

`user_id: UserId (pk)`, `password_hash: HashedPassword`, `created_at`, `updated_at`. A user MAY have no `Credentials` row (Google-only account). Per FR-011, an existing `Credentials` row MUST NOT be touched by Google linking.

### 1.3 Session, RefreshToken (existing — unchanged)

Issuance now flows through a shared `IssueSession` use case instead of being inlined in `AuthenticateUser`. Schema, fingerprints, revocation reasons, and TTLs are unchanged. Per FR-030, this migration MUST NOT invalidate any existing rows.

### 1.4 ProviderLink (NEW)

| Field | Type | Constraint |
|---|---|---|
| `id` | `UUID` | pk |
| `user_id` | `UUID` | not null, fk → `users.id` ON DELETE CASCADE |
| `provider` | `TEXT` | not null, CHECK `provider IN ('google')` |
| `subject` | `TEXT` | not null. Google's stable `sub` claim. Length ≤ 255. |
| `email_at_link` | `TEXT` | not null. Lowercase. Diagnostic only — never used for re-lookup. |
| `created_at` | `TIMESTAMPTZ` | not null, default `now()` |
| `updated_at` | `TIMESTAMPTZ` | not null, default `now()` |

Indexes / constraints:

- UNIQUE (`provider`, `subject`) → name `ux_provider_links_provider_subject` — one user per (provider, subject).
- INDEX (`user_id`) → name `ix_provider_links_user_id`.
- A user MAY have at most one `ProviderLink` per provider (FR-008). Enforced by a partial UNIQUE: UNIQUE (`user_id`, `provider`) → `ux_provider_links_user_provider`.

Domain VO: `ProviderSubject(value: str)` — frozen, validates 1 ≤ len ≤ 255 and ASCII.

### 1.5 EmailConfirmation (NEW)

| Field | Type | Constraint |
|---|---|---|
| `id` | `UUID` | pk |
| `user_id` | `UUID` | not null, fk → `users.id` ON DELETE CASCADE |
| `email` | `TEXT` | not null. Lowercase. The address the code was sent to (mirrors `users.email` at issuance time). |
| `code_hash` | `BYTEA` | not null. `HMAC-SHA256(EMAIL_CONFIRMATION_HMAC_KEY, code)` (32 bytes). |
| `created_at` | `TIMESTAMPTZ` | not null, default `now()` |
| `expires_at` | `TIMESTAMPTZ` | not null. `created_at + EMAIL_CONFIRMATION_TTL_SECONDS`. |
| `attempt_count` | `INT` | not null, default `0`. CHECK `>= 0`. |
| `resend_count` | `INT` | not null, default `0`. CHECK `>= 0`. Used for the "≤ 3 resends per rolling hour" cap; counts resends issued *into* this row's predecessor chain. |
| `last_resent_at` | `TIMESTAMPTZ` | nullable. NULL on a freshly-issued row. |
| `status` | `TEXT` | not null, default `'pending'`. CHECK `status IN ('pending','verified','expired','invalidated')`. |
| `invalidated_reason` | `TEXT` | nullable. CHECK `invalidated_reason IS NULL OR invalidated_reason IN ('attempts_exceeded','resent','upgraded_by_google','admin')`. |

Indexes:

- `ix_email_confirmations_user_id` (`user_id`).
- Partial unique `ux_email_confirmations_user_pending` UNIQUE (`user_id`) WHERE `status = 'pending'` — at most one pending row per user. (Resend invalidates the previous one in the same transaction before inserting the new one.)
- `ix_email_confirmations_expires_at` (`expires_at`) — drives the optional sweep job.

State machine:

```
                 +----------+   verify-success    +-----------+
       create -->| pending  |--------------------->| verified  |   (terminal)
                 +----------+                      +-----------+
                  |   |   |
                  |   |   +--- expires_at <= now -->+-----------+
                  |   |                              |  expired  |   (terminal)
                  |   |                              +-----------+
                  |   |
                  |   +--- attempt_count >= MAX  --->+--------------+
                  |                                  | invalidated  |   (terminal)
                  |        resent (new row inserted) |    reason    |
                  +--------------------------------->|              |
                                                     +--------------+
```

Transitions are one-way; a verified/expired/invalidated row is never reopened. A new `pending` row is inserted instead.

Domain VO: `ConfirmationCode(value: str)` — frozen, exactly 6 ASCII digits.

### 1.6 OAuthFlowState (NEW)

| Field | Type | Constraint |
|---|---|---|
| `id` | `UUID` | pk. The `state_id` shared with the browser via the state cookie. |
| `state_token_hash` | `BYTEA` | not null. `HMAC-SHA256(OAUTH_FLOW_HMAC_KEY, state_secret)` (32 bytes). |
| `pkce_verifier` | `TEXT` | not null. Plaintext (single-use, ≤ 10 min lifetime, see research R4). 43–128 chars per RFC 7636. |
| `nonce_hash` | `BYTEA` | not null. `HMAC-SHA256(OAUTH_FLOW_HMAC_KEY, nonce)` (32 bytes). |
| `intent` | `TEXT` | not null. CHECK `intent IN ('sign-in','sign-up')`. |
| `return_to` | `TEXT` | nullable. Server-validated same-origin path; NULL means "go to /home". |
| `created_at` | `TIMESTAMPTZ` | not null, default `now()` |
| `expires_at` | `TIMESTAMPTZ` | not null. `created_at + OAUTH_FLOW_TTL_SECONDS`. |
| `consumed_at` | `TIMESTAMPTZ` | nullable. Set on successful or failed callback consumption. |
| `consumed_reason` | `TEXT` | nullable. CHECK `IS NULL OR IN ('completed','invalid','expired','user_cancelled','google_error')`. |

Indexes:

- UNIQUE (`state_token_hash`) → `ux_oauth_flow_states_state_token_hash`.
- `ix_oauth_flow_states_expires_at` (`expires_at`) — drives the optional sweep job.

State machine:

```
       create  --->  issued  --(consume on callback)-->  consumed (terminal, with reason)
                       |
                       +----(expires_at <= now, no callback)----> expired (terminal)
```

Sweep policy: rows older than `expires_at + 7 days` MAY be deleted by an offline job; not required for correctness.

### 1.7 AuthAntiForgeryValue (in-flight — not persisted as such)

Spec entity. Concretely realized as the `(state_id, state_secret)` pair carried by the `campfire_oauth_state` cookie plus the `state_token_hash` column on `OAuthFlowState`. Never persisted in plaintext, never exposed to client JS (cookie is `HttpOnly`).

---

## 2. Migration `0003_identity_oauth_and_confirmation`

**Revision**: `0003_identity_oauth_and_confirmation`
**Down revision**: `0002_repertoire_initial` (current head; the unrelated repertoire migration already occupies the `0002` slot on `main`).

### Up

```sql
-- 1. Add email_confirmed_at to users.
ALTER TABLE users ADD COLUMN email_confirmed_at TIMESTAMPTZ NULL;
UPDATE users SET email_confirmed_at = created_at WHERE email_confirmed_at IS NULL;
-- (No NOT NULL — by design, future password sign-ups insert NULL.)

-- 2. provider_links
CREATE TABLE provider_links (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google')),
    subject TEXT NOT NULL CHECK (length(subject) BETWEEN 1 AND 255),
    email_at_link TEXT NOT NULL CHECK (email_at_link = lower(email_at_link)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_provider_links_provider_subject ON provider_links (provider, subject);
CREATE UNIQUE INDEX ux_provider_links_user_provider    ON provider_links (user_id, provider);
CREATE INDEX        ix_provider_links_user_id          ON provider_links (user_id);

-- 3. email_confirmations
CREATE TABLE email_confirmations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL CHECK (email = lower(email)),
    code_hash BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    resend_count  INT NOT NULL DEFAULT 0 CHECK (resend_count  >= 0),
    last_resent_at TIMESTAMPTZ NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','verified','expired','invalidated')),
    invalidated_reason TEXT NULL
        CHECK (invalidated_reason IS NULL
               OR invalidated_reason IN ('attempts_exceeded','resent','upgraded_by_google','admin'))
);
CREATE INDEX        ix_email_confirmations_user_id      ON email_confirmations (user_id);
CREATE UNIQUE INDEX ux_email_confirmations_user_pending ON email_confirmations (user_id) WHERE status = 'pending';
CREATE INDEX        ix_email_confirmations_expires_at   ON email_confirmations (expires_at);

-- 4. oauth_flow_states
CREATE TABLE oauth_flow_states (
    id UUID PRIMARY KEY,
    state_token_hash BYTEA NOT NULL,
    pkce_verifier TEXT NOT NULL CHECK (length(pkce_verifier) BETWEEN 43 AND 128),
    nonce_hash BYTEA NOT NULL,
    intent TEXT NOT NULL CHECK (intent IN ('sign-in','sign-up')),
    return_to TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ NULL,
    consumed_reason TEXT NULL
        CHECK (consumed_reason IS NULL
               OR consumed_reason IN ('completed','invalid','expired','user_cancelled','google_error'))
);
CREATE UNIQUE INDEX ux_oauth_flow_states_state_token_hash ON oauth_flow_states (state_token_hash);
CREATE INDEX        ix_oauth_flow_states_expires_at       ON oauth_flow_states (expires_at);
```

### Down

Reverse in dependency order: drop `oauth_flow_states`, `email_confirmations`, `provider_links`, then `ALTER TABLE users DROP COLUMN email_confirmed_at`. Down is for emergencies only — running it after this feature has been live drops verification state and provider links. The `0003` migration intentionally backfills so down + up is non-destructive on the user table (the column comes back populated again from `created_at`). Pending email confirmations and Google links are NOT recoverable on down — operators must communicate.

---

## 3. Validation rules (where each lives)

| Rule | Layer | Implementation |
|---|---|---|
| Email format `[^@\s]+@[^@\s]+\.[^@\s]+`, length 3–320, lowercase | Domain `Email` VO | unchanged |
| Password length ≥ 10 (sign-up only), 3-of-4 char classes, not in common-pw blocklist | Domain `Password` VO + `validation.ts` mirror | new |
| Confirmation code: exactly 6 ASCII digits | Domain `ConfirmationCode` VO | new |
| Display name length 1–80 | Domain `DisplayName` VO | unchanged |
| OAuth `next` path: starts with `/`, not `//`, no `://` | Backend in `start_google_sign_in`; frontend in `redirect.ts` | new — server is source of truth |
| Provider subject length 1–255 ASCII | Domain `ProviderSubject` VO | new |
| Transport-shape email/code/intent/next | Pydantic schemas at the HTTP boundary | new |

Per backend invariant 6: HTTP-layer schemas are a fast-fail UX hint; the domain VOs hold the canonical invariants.

---

## 4. Repository ports (new)

All under `apps/api/src/campfire_api/contexts/identity/domain/ports.py`. All methods are `async`. Concrete adapters live under `adapters/persistence/`.

```python
class ProviderLinkRepository(Protocol):
    async def get(self, provider: str, subject: ProviderSubject) -> ProviderLink | None: ...
    async def get_for_user(self, user_id: UserId, provider: str) -> ProviderLink | None: ...
    async def add(self, link: ProviderLink) -> None: ...

class EmailConfirmationRepository(Protocol):
    async def get_pending_for_user(self, user_id: UserId) -> EmailConfirmation | None: ...
    async def add(self, confirmation: EmailConfirmation) -> None: ...
    async def update(self, confirmation: EmailConfirmation) -> None: ...
    async def invalidate_pending_for(
        self, user_id: UserId, *, reason: str, now: datetime
    ) -> None: ...
    async def count_resends_in_window(
        self, user_id: UserId, window_start: datetime
    ) -> int: ...

class OAuthFlowStateRepository(Protocol):
    async def add(self, flow: OAuthFlowState) -> None: ...
    async def consume_atomic(
        self, flow_id: UUID, *, reason: str, now: datetime
    ) -> OAuthFlowState | None: ...
        # UPDATE … SET consumed_at=now, consumed_reason=reason
        # WHERE id=… AND consumed_at IS NULL AND expires_at > now
        # RETURNING *. Returns None if already consumed or expired.

class ConfirmationCodeHasher(Protocol):
    def hash(self, code: ConfirmationCode) -> bytes: ...        # HMAC-SHA256
    def verify(self, code: ConfirmationCode, digest: bytes) -> bool: ...  # constant-time

class GoogleIdentityProvider(Protocol):
    async def exchange_code(
        self, *, code: str, code_verifier: str, redirect_uri: str
    ) -> GoogleIdentity: ...
        # POSTs to oauth2.googleapis.com/token, verifies the returned id_token,
        # returns parsed identity. Raises GoogleSignInFailed on any error.

class EmailSender(Protocol):
    async def send_confirmation_code(
        self, *, to: Email, code: ConfirmationCode, locale: Language, expires_at: datetime
    ) -> None: ...
    async def send_duplicate_signup_notice(
        self, *, to: Email, locale: Language
    ) -> None: ...
```

`GoogleIdentity` is a frozen dataclass: `subject: ProviderSubject, email: Email, email_verified: bool, name: str | None, nonce: str`.

---

## 5. Use case shapes (new + changed)

| Use case | Inputs | Outputs | Errors |
|---|---|---|---|
| `IssueSession` (NEW, extracted) | `user_id: UserId` | `IssuedSession` | none expected (DB integrity errors bubble up) |
| `RegisterUser` (CHANGED) | `email: str, password: str, locale: Language` | `RegistrationResult { user_id, confirmation_id }` (no session) | `EmailAlreadyRegistered` (mapped to neutral 202 by HTTP layer per FR-017), `RateLimited`, validation errors |
| `ConfirmEmail` (NEW) | `email: str, code: str` | `IssuedSession` | `ConfirmationCodeInvalid`, `ConfirmationCodeExpired`, `ConfirmationAttemptsExceeded`, `RateLimited` |
| `ResendConfirmation` (NEW) | `email: str, locale: Language` | `None` | `ConfirmationResendCooldown`, `RateLimited` (both collapse to identical generic refusal at the HTTP boundary) |
| `AuthenticateUser` (CHANGED) | `email: str, password: str` | `IssuedSession` OR `UnconfirmedAccount(user_id)` (a typed result, not an exception) | `InvalidCredentials`, `RateLimited` |
| `StartGoogleSignIn` (NEW) | `intent: 'sign-in'\|'sign-up', next: str \| None` | `StartResult { authorize_url, state_cookie_value }` | `GoogleSignInUnavailable` |
| `CompleteGoogleSignIn` (NEW) | `code: str, query_state: str, state_cookie_value: str` | `IssuedSession` + `return_to: str \| None` | `GoogleSignInFailed`, `GoogleSignInUnavailable` |

`UnconfirmedAccount` is a result type, not an error — it lets the HTTP layer set the `unconfirmed=true` flag in the response body only when password verification has already succeeded (per research R10). For all other login failures, `InvalidCredentials` is raised, ensuring the response body is byte-identical (FR-024).

---

## 6. Error hierarchy (extended)

```python
class IdentityError(Exception): ...

# existing
class InvalidCredentials(IdentityError): ...
class EmailAlreadyRegistered(IdentityError): ...
class RefreshTokenInvalid(IdentityError): ...
class RefreshTokenReused(IdentityError): ...
class RateLimited(IdentityError):
    retry_after: int
class GoogleStubDisabled(IdentityError): ...
class SessionRevokedError(IdentityError): ...
class UnknownCatalogId(IdentityError): ...

# new
class GoogleSignInUnavailable(IdentityError): ...        # 503
class GoogleSignInFailed(IdentityError): ...             # collapses to a 302 to /signin?auth_error=…
class ConfirmationCodeInvalid(IdentityError): ...        # 400 generic
class ConfirmationCodeExpired(IdentityError): ...        # 400 generic (mapped to same body as Invalid)
class ConfirmationAttemptsExceeded(IdentityError): ...   # 400 generic (same body)
class ConfirmationResendCooldown(IdentityError):         # 429 generic
    retry_after: int
class EmailNotConfirmed(IdentityError): ...              # internal — never escapes to HTTP
```

HTTP mapping additions in `error_mapping.py`:

| Error | Status | Body | Headers |
|---|---|---|---|
| `GoogleSignInUnavailable` | 503 | `{"detail":"google sign-in unavailable"}` | — |
| `GoogleSignInFailed` | (302) | (redirect to `${WEB}/signin?auth_error=google_failed`) | `Location` |
| `ConfirmationCodeInvalid` / `Expired` / `AttemptsExceeded` | 400 | `{"detail":"confirmation invalid"}` | — |
| `ConfirmationResendCooldown` | 429 | `{"detail":"too many attempts"}` | `Retry-After` |

Per FR-024, three distinct internal errors collapse to one user-visible body. Diagnosis happens server-side via the existing structured logger — never via response shape.

---

## 7. Backwards-compatibility notes

- **Active sessions**: untouched. `email_confirmed_at` backfill populates every existing user row to `created_at`, so `AuthenticateUser` continues to accept all current passwords (FR-026, FR-030, SC-005).
- **`/auth/google-stub`**: kept, default-flipped to `GOOGLE_STUB_ENABLED=false` in prod. Tests that need an "external Google" continue to enable it via fixture. Once real Google is verified in prod, removal is a follow-up.
- **`/auth/register` 200 vs 202**: response now is `202 Accepted` with body `{ "status": "confirmation_required" }` (was `201 Created` with `{ displayName, email }`). Frontend already handles either by inspecting status; OpenAPI snapshot covers the change.
