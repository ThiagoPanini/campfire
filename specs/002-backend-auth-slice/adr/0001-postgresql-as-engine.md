# ADR-0001: PostgreSQL as the persistence engine

**Status**: Accepted
**Date**: 2026-04-26
**Deciders**: Maintainer (Thiago Panini)
**Slice**: `004-backend-auth-slice`

## Context

The Campfire constitution mandates a relational database (Principle III)
and the spec's Assumptions further require Postgres-compatibility so a
future move to an Aurora-family target is unblocked. The slice must pick
one engine for both local development and any forthcoming deployment.

## Decision

Use **PostgreSQL 16** as the only persistence engine for Campfire.
Locally we run the `postgres:16-alpine` container; the production target
will be Postgres-compatible (the specific managed service is deferred —
see ADR-0003).

## Consequences

**Positive**
- One engine across local, CI, and production — no dialect drift.
- Postgres 16's feature surface (`JSONB`, partial indexes, `timestamptz`,
  rich constraints) covers every requirement in this slice without
  forcing extensions.
- Aurora Postgres 16.x is GA; this choice keeps the Aurora migration
  trivial when the infrastructure slice arrives.
- Mature SQLAlchemy + Alembic + asyncpg toolchain.

**Negative / trade-offs**
- Higher local footprint than SQLite. Mitigated: alpine image is small;
  Compose already uses it for Postgres only.
- Forces "real Postgres" in tests (we accept this — see the spec's
  testing requirements).

## Alternatives considered

- **SQLite** — rejected. The spec's Assumptions explicitly rule it out
  for production-parity reasons, and we'd lose `JSONB`, `timestamptz`,
  and constraint expressiveness.
- **MySQL / MariaDB** — rejected. Also relational, but the constitution
  and the Aurora-readiness constraint both point to Postgres specifically.
- **Managed NoSQL (DynamoDB, Firestore)** — rejected. Constitution
  forbids NoSQL unless a feature demonstrably requires it; this slice
  does not.

## Related

- ADR-0002 (driver / ORM choice).
- ADR-0003 (specific AWS service deferred).
- ADR-0004 (UUID v7 + `timestamptz` UTC; no extensions).
