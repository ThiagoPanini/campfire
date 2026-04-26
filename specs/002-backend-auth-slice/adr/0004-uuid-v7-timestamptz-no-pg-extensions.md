# ADR-0004: UUID v7 PKs + `timestamptz` UTC + no Postgres extensions in v1

**Status**: Accepted
**Date**: 2026-04-26
**Deciders**: Maintainer (Thiago Panini)
**Slice**: `004-backend-auth-slice`

## Context

The schema needs primary keys, timestamps, and a stance on extensions.
Wrong defaults here become migration debt — they're hard to revert once
production rows exist. The slice must also stay Aurora-portable
(ADR-0003), which constrains both the extension surface and the time
representation.

## Decision

### Primary keys

- **UUID v7** generated **application-side** via `uuid-utils` (or any
  v7-capable library). If a library proves unavailable in some
  environment, fall back to **UUID v4** — also application-generated.
- **No `pgcrypto`, no `uuid-ossp`** — DB-side UUID generation would lock
  us into an extension and remove our ability to set the id at creation
  time in domain code.

UUID v7 is preferred because it embeds a millisecond timestamp prefix,
which gives us natural insertion-order locality on B-tree indexes
without revealing sensitive ordering. UUID v4 is acceptable as fallback;
identity tables are small enough that index locality is not a hot path
in v1.

### Timestamps

- All timestamp columns are `TIMESTAMPTZ`. All values are written as
  **UTC**.
- Application code uses an explicit `Clock` port (`SystemClock`
  implementation in v1) so tests can control time. Naïve
  `datetime.utcnow()` calls are banned in domain and application
  layers.

### Extensions in this slice

- **None.** The implementation does not enable or use `pg_trgm`,
  `citext`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, or any other
  extension.
- For each capability we'd otherwise reach for an extension:
  - **UUIDs** → application-generated.
  - **Case-insensitive email** → application-side normalization (lowercase
    + trim) before insert and before lookup; columns store normalized
    text.
  - **Password hashing** → `argon2-cffi` in the application.

### Extension allowlist (for future slices)

If a later slice introduces an extension, the PR MUST:
1. Cite the [Aurora Postgres supported-extensions list](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraPostgreSQLReleaseNotes/AuroraPostgreSQL.Extensions.html).
2. Justify why no application-side alternative is adequate.
3. Add the extension to a new `docs/backend/extensions.mdx` page.

If the extension is not on the Aurora list, **pick a different
mechanism**.

## Consequences

**Positive**
- Schema is portable to RDS / Aurora / Aurora Serverless v2 with no
  extension toggling.
- Domain code owns id and time generation, which makes use cases
  deterministic in tests.
- No engine-side feature creep into the domain.

**Negative / trade-offs**
- Slightly more application code for normalization (lowercase email)
  than `citext` would require. Trivial.
- We give up `pg_trgm`-backed fuzzy email search if we ever wanted it
  (we don't — privacy-by-default forbids email lookup endpoints anyway).

## Alternatives considered

- **`UUID` PKs generated via `gen_random_uuid()` (pgcrypto)** —
  rejected. Would require enabling `pgcrypto` and would prevent setting
  the id at object construction time in domain code.
- **Bigserial integers** — rejected. Forwarding integer ids in URLs
  leaks ordering and growth signals; we don't need the small-key
  performance win at this scale.
- **`citext` for email** — rejected. Adds an extension dependency for
  what is one normalization step in the application.
- **Naïve `timestamp` (no tz)** — rejected. Forces app-server-local
  time math, which is a class of bug we don't need to invite.

## Related

- ADR-0001, ADR-0002, ADR-0003.
