# Data Model — Identity Slice

**Feature**: `004-backend-auth-slice`
**Bounded context**: `identity` (only context implemented in v1)
**Engine**: PostgreSQL 16, accessed via SQLAlchemy 2.x async + asyncpg.

This document defines the persistent state for the identity slice. It is
the source of truth for migration `0001_identity_initial`. Domain entity
names follow the spec (`User`, `Credentials`, `Preferences`, `Session`,
`RefreshToken`); the table layout adds one operational table
(`login_attempts`) referenced from FR-011a. All tables live in the public
schema for v1 (a `identity` schema is unnecessary while we have a single
context).

## Conventions

- **Primary keys**: `UUID` (v7 preferred via `uuid-utils`; v4 fallback).
  Generated **application-side** — no `pgcrypto`, no `uuid-ossp`. (See
  ADR-004.)
- **Timestamps**: `TIMESTAMPTZ`, always UTC. Default `now() AT TIME ZONE 'UTC'`
  is acceptable; in practice we set values application-side via the `Clock`
  port for testability.
- **Soft deletes**: not used in v1. Sessions and refresh tokens are
  *revoked* (boolean + reason + timestamp), users and preferences are
  hard-deleted only by an explicit admin path that does not exist yet.
- **Email normalization**: lowercase + trim, application-side, **before**
  insertion or lookup. No `citext`.
- **Token storage**: only token *fingerprints* (SHA-256 of the opaque
  random value) are stored — never the token bytes themselves. The actual
  bearer string is shown to the client once and never persisted.
- **Constraints first**: every business rule that can be expressed as a
  table-level constraint is one (`UNIQUE`, `CHECK`, `FOREIGN KEY`).
- **No session-scoped Postgres state** (LISTEN/NOTIFY, advisory locks).
- **No partial indexes that depend on `now()`** — they're not stable and
  don't replan well under serverless.

---

## Entity: User

**Purpose**: persistent identity. One row per registered person.

**Domain attributes** (entity, framework-free):
- `id: UserId` (UUID).
- `email: Email` (normalized value object — lowercase + trimmed).
- `display_name: DisplayName` (derived from email local-part on
  registration; not user-editable in v1, per FR-005).
- `first_login: bool` (true until preferences are saved at least once;
  flips false on first successful `PATCH /me/preferences`, per FR-004).
- `created_at: datetime` (UTC).
- `updated_at: datetime` (UTC, bumped on any mutation including
  `first_login` flip).

**Table `users`**:

| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` |
| `email` | `TEXT` | `NOT NULL`, `UNIQUE`, `CHECK (email = lower(email) AND length(email) BETWEEN 3 AND 320)` |
| `display_name` | `TEXT` | `NOT NULL`, `CHECK (length(display_name) BETWEEN 1 AND 80)` |
| `first_login` | `BOOLEAN` | `NOT NULL`, default `TRUE` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` |

**Indexes**:
- `users_pkey` on `(id)` (implicit).
- `ux_users_email` `UNIQUE` on `(email)` — supports both lookup-by-email
  on login and the conflict check on registration.

**Integrity rules**:
- Email uniqueness is the deduplication boundary (FR-002).
- Registration with an existing normalized email returns 409 Conflict
  *without* leaking which side of the credential pair failed (FR-002,
  FR-011) — application maps the unique-violation to the generic conflict
  response.

**Lifecycle**:
- Created by `register_user` use case or `google_stub_sign_in` (sign-up
  intent for `google.member@campfire.test` if not already present).
- `first_login` flips on the first successful `update_preferences`.
- Never deleted in v1.

---

## Entity: Credentials

**Purpose**: argon2 hash for a User's password. Modeled separately from
`User` to keep the domain entity free of a hash field that has no business
meaning beyond authentication (FR-028 — domain layer free of
infrastructure concerns; here, free of secret material that's never
returned anywhere).

**Domain attributes**:
- `user_id: UserId`.
- `password_hash: PasswordHash` (opaque value object — only the
  `argon2-cffi` adapter knows its structure).
- `created_at: datetime`.
- `updated_at: datetime`.

**Table `credentials`**:

| Column | Type | Constraints |
|---|---|---|
| `user_id` | `UUID` | `PRIMARY KEY`, `REFERENCES users(id) ON DELETE CASCADE` |
| `password_hash` | `TEXT` | `NOT NULL` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` |

**Indexes**: just the primary key.

**Integrity rules**:
- One row per user (PK is `user_id`).
- The argon2 string is stored verbatim — its self-describing format
  carries the algorithm + parameters, so we can re-tune without a column
  change.
- No row exists for the Google-stub fixture user when it is created via
  the sign-up intent (managed-google identities have no password). The
  `authenticate_user` use case treats "no credentials row" as a generic
  authentication failure, never disclosing the cause (FR-011).

**Lifecycle**:
- Created with the user during `register_user`.
- Mutated only when (eventually) we add password change / reset — out of
  scope for v1 (spec §Out of Scope).
- Cascade-deleted with the user.

---

## Entity: Preferences (`PreferencesProfile`)

**Purpose**: stored selections owned by a user. Same shape the frontend
already consumes (FR-013).

**Domain attributes**:
- `user_id: UserId`.
- `instruments: list[CatalogId]` — subset of the 12-entry instruments
  catalog.
- `genres: list[CatalogId]` — subset of the 13-entry genres catalog.
- `context: CatalogId | None` — one of the 6 contexts (or null).
- `goals: list[CatalogId]` — subset of the 6 goals.
- `experience: ExperienceLevel | None` — one of
  `beginner | learning | intermediate | advanced`, or null.
- `updated_at: datetime`.

**Table `preferences`**:

| Column | Type | Constraints |
|---|---|---|
| `user_id` | `UUID` | `PRIMARY KEY`, `REFERENCES users(id) ON DELETE CASCADE` |
| `instruments` | `JSONB` | `NOT NULL`, default `'[]'::jsonb`, `CHECK (jsonb_typeof(instruments) = 'array')` |
| `genres` | `JSONB` | `NOT NULL`, default `'[]'::jsonb`, `CHECK (jsonb_typeof(genres) = 'array')` |
| `context` | `TEXT` | nullable |
| `goals` | `JSONB` | `NOT NULL`, default `'[]'::jsonb`, `CHECK (jsonb_typeof(goals) = 'array')` |
| `experience` | `TEXT` | nullable, `CHECK (experience IS NULL OR experience IN ('beginner','learning','intermediate','advanced'))` |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` |

**Indexes**: just the primary key. No GIN index on the JSONB arrays in v1
(no preference-search query exists).

**Integrity rules**:
- Catalog id validation is enforced **application-side** in
  `update_preferences`, against the frozen sets in
  `contexts/identity/domain/catalogs.py`. The DB does not enforce
  membership of array values — we deliberately keep that logic in the
  domain so the catalog can evolve in lockstep with the frontend
  data-model file (FR-014, spec §Assumptions on catalog authoritative
  source).
- `PATCH /me/preferences` is a **full replacement** (FR-015). Any partial
  semantics happen application-side; the database write is a single
  `UPDATE … SET …` covering every column.

**Lifecycle**:
- Created with the user (`register_user` inserts an empty preferences
  row) so `GET /me` always has something to return.
- `first_login` on `users` flips false on the first
  `update_preferences` call (FR-004).
- Cascade-deleted with the user.

---

## Entity: Session

**Purpose**: a long-lived identity for a logged-in client. Both opaque
access tokens and refresh tokens reference a session; revoking the session
revokes everything in its family.

**Domain attributes**:
- `id: SessionId` (UUID).
- `user_id: UserId`.
- `family_id: SessionFamilyId` — the same UUID as `id` for the head
  session; for *family* tracking we keep a separate column so a refresh
  rotation that opens a new session row can still inherit the family.
- `access_token_fingerprint: bytes` — SHA-256 of the current opaque
  access token. Replaced on every refresh.
- `access_token_expires_at: datetime`.
- `created_at: datetime`.
- `last_seen_at: datetime` (best-effort, updated lazily; not used for
  contract decisions).
- `revoked_at: datetime | None`.
- `revoked_reason: SessionRevokedReason | None` —
  `signed_out | refreshed | reuse_detected | expired`.

**Table `sessions`**:

| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES users(id) ON DELETE CASCADE` |
| `family_id` | `UUID` | `NOT NULL` |
| `access_token_fingerprint` | `BYTEA` | `NOT NULL` |
| `access_token_expires_at` | `TIMESTAMPTZ` | `NOT NULL` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` |
| `last_seen_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` |
| `revoked_at` | `TIMESTAMPTZ` | nullable |
| `revoked_reason` | `TEXT` | nullable, `CHECK (revoked_reason IN ('signed_out','refreshed','reuse_detected','expired'))` |

**Indexes**:
- `sessions_pkey` on `(id)`.
- `ux_sessions_access_token_fingerprint` `UNIQUE` on
  `(access_token_fingerprint)` — supports the per-request lookup that
  validates the bearer token (FR-007). Uniqueness is safe because each
  rotation generates a fresh random.
- `ix_sessions_user_id` on `(user_id)` — supports family-wide revocation.
- `ix_sessions_family_id_active` on `(family_id) WHERE revoked_at IS NULL`
  — supports "revoke this entire family" without a full scan.

**Integrity rules**:
- A session is *active* iff `revoked_at IS NULL` and
  `access_token_expires_at > now()`. Application-side check on every
  authorized request.
- Revocation is set-once; `revoked_at` is never cleared.
- The fingerprint column stores SHA-256 bytes (32 bytes) — no token
  plaintext at rest.

**Lifecycle**:
- Created on successful `authenticate_user`, `register_user`,
  `refresh_session`, or `google_stub_sign_in`.
- Rotated by `refresh_session`: a new session row is inserted with the
  same `family_id`; the previous session and its refresh token are marked
  `revoked_at = now()`, `revoked_reason = 'refreshed'`.
- Sign-out marks `revoked_reason = 'signed_out'`.
- A reuse-detection event marks the entire family
  (`UPDATE sessions SET revoked_at=now(), revoked_reason='reuse_detected' WHERE family_id=$1 AND revoked_at IS NULL`).

---

## Entity: RefreshToken

**Purpose**: single-use, server-recorded token tied to a Session family.

**Domain attributes**:
- `id: RefreshTokenId` (UUID).
- `session_id: SessionId` (the session this token currently authorizes
  refresh for).
- `family_id: SessionFamilyId` (denormalized for fast family-wide
  invalidation without joining `sessions`).
- `user_id: UserId` (denormalized for the same reason).
- `token_fingerprint: bytes` — SHA-256 of the opaque random value.
- `issued_at: datetime`.
- `expires_at: datetime`.
- `consumed_at: datetime | None` — set when the token is exchanged.
- `revoked_at: datetime | None`.
- `revoked_reason: RefreshTokenRevokedReason | None` —
  `rotated | signed_out | reuse_detected | family_revoked | expired`.

**Table `refresh_tokens`**:

| Column | Type | Constraints |
|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` |
| `session_id` | `UUID` | `NOT NULL`, `REFERENCES sessions(id) ON DELETE CASCADE` |
| `family_id` | `UUID` | `NOT NULL` |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES users(id) ON DELETE CASCADE` |
| `token_fingerprint` | `BYTEA` | `NOT NULL` |
| `issued_at` | `TIMESTAMPTZ` | `NOT NULL`, default `now()` |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` |
| `consumed_at` | `TIMESTAMPTZ` | nullable |
| `revoked_at` | `TIMESTAMPTZ` | nullable |
| `revoked_reason` | `TEXT` | nullable, `CHECK (revoked_reason IN ('rotated','signed_out','reuse_detected','family_revoked','expired'))` |

**Indexes**:
- `refresh_tokens_pkey` on `(id)`.
- `ux_refresh_tokens_fingerprint` `UNIQUE` on `(token_fingerprint)` —
  supports the lookup that the `/auth/refresh` endpoint performs.
- `ix_refresh_tokens_family_id_active` on `(family_id) WHERE revoked_at IS NULL`.
- `ix_refresh_tokens_user_id` on `(user_id)`.

**Integrity rules**:
- A refresh token is *valid for exchange* iff `consumed_at IS NULL`,
  `revoked_at IS NULL`, and `expires_at > now()`.
- The exchange itself MUST be transactional: in one DB transaction the
  `consumed_at` is set on the supplied row, a fresh row is inserted, the
  prior session is marked `refreshed`, and a new session row is created.
  Concurrent exchange attempts race on the `consumed_at` update — the
  loser sees `consumed_at IS NOT NULL` and treats it as reuse (FR-009).
- Reuse-detection: any exchange attempt where `consumed_at IS NOT NULL`
  triggers a family-wide revocation pass on `sessions` and
  `refresh_tokens` for that `family_id` and returns 401 to the client
  (FR-009).

**Lifecycle**:
- Issued alongside a session.
- Consumed exactly once.
- Either ends in `rotated` (normal happy path), `signed_out`,
  `reuse_detected`, `family_revoked`, or `expired`.

---

## Entity: LoginAttempt (operational, FR-011a)

**Purpose**: persists nothing for the contract; this entity is the
*future* shared-store target for the rate limiter. In v1 the limiter is
in-memory — a per-process dict keyed on `(client_ip, target_email)`. We
sketch the table here so the schema review captures the planned shape; the
table is **not** created by the v1 migration.

**Planned shape** (NOT in `0001_identity_initial.py`):

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK |
| `ip` | `INET` | client IP after trust-proxy normalization |
| `email_normalized` | `TEXT` | the email the request claimed |
| `attempt_kind` | `TEXT` | `register | login` |
| `outcome` | `TEXT` | `denied_429 | accepted` |
| `attempted_at` | `TIMESTAMPTZ` | partition column eventually |

The slice that introduces a multi-process deployment will create this
table (or pick an alternative: Redis, DynamoDB, etc.) and migrate the
limiter implementation behind the existing `RateLimiter` port.

---

## Relationships

```text
users (1) ──< credentials (0..1)        # password-based users only
users (1) ──< preferences (1)           # always present from registration
users (1) ──< sessions    (0..n)
users (1) ──< refresh_tokens (0..n)
sessions (1) ──< refresh_tokens (0..n)  # always exactly 1 active per session in v1
sessions (n) ──── family_id ──── refresh_tokens (n)  # logical grouping for reuse-detection
```

`ON DELETE CASCADE` from `users` covers all four child tables.

## State machines

### Session

```
        ┌── refresh ──> revoked(refreshed)
created ┼── sign-out ─> revoked(signed_out)
        ┼── reuse-detected (any token in family) ─> revoked(reuse_detected)
        └── access TTL elapses ──────────────────> revoked(expired) [lazy, on next request]
```

### RefreshToken

```
                       ┌── exchange ok ──> consumed=now, revoked(rotated)
issued ─ valid window ─┤── exchange replay ─> revoked(reuse_detected) + family revoke
                       ├── sign-out ──> revoked(signed_out)
                       ├── family revoke ──> revoked(family_revoked)
                       └── expires_at past ──> revoked(expired) [lazy]
```

## Seeds

The seed migration `0002_seed_ada.py` is idempotent (FR-021):

```sql
INSERT INTO users (id, email, display_name, first_login, created_at, updated_at)
VALUES ('<deterministic UUID>', 'ada@campfire.test', 'Ada', false, now(), now())
ON CONFLICT (email) DO NOTHING;

INSERT INTO credentials (user_id, password_hash, created_at, updated_at)
SELECT id, '<argon2id hash of campfire123>', now(), now()
FROM users WHERE email = 'ada@campfire.test'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO preferences (user_id, instruments, genres, context, goals, experience, updated_at)
SELECT id,
       '["Guitar","Vocals"]'::jsonb,
       '["Rock","MPB","Bossa Nova"]'::jsonb,
       'friends',
       '["Track my full repertoire","Share my set with the group"]'::jsonb,
       'intermediate',
       now()
FROM users WHERE email = 'ada@campfire.test'
ON CONFLICT (user_id) DO NOTHING;
```

The argon2 hash is computed once at seed-write time and committed verbatim
into the migration file. Re-running the migration is a no-op — it neither
rotates the hash nor resets preferences (FR-021, SC-005).

The Google-stub fixture user (`google.member@campfire.test`) is **not**
seeded; it is upserted lazily by `google_stub_sign_in` when first invoked
with the sign-up intent, so its `firstLogin = true` state is honored
exactly once per fresh database.

## Aurora-readiness checklist

This data model uses zero Postgres extensions and no engine-specific
features that would block a move to Aurora Postgres / Aurora Serverless v2:

- ✅ UUIDs are application-generated.
- ✅ Hashing is application-side (`argon2-cffi`), not `pgcrypto`.
- ✅ Email normalization is application-side, not `citext`.
- ✅ Only baseline types: `UUID`, `TEXT`, `BOOLEAN`, `JSONB`, `BYTEA`,
  `INET` (planned, not in v1), `TIMESTAMPTZ`.
- ✅ No `LISTEN/NOTIFY`, no advisory locks, no temp tables in request paths.
- ✅ All timestamps are `TIMESTAMPTZ` UTC.
