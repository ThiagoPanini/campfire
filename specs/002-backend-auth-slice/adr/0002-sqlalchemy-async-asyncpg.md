# ADR-0002: SQLAlchemy 2.x async + asyncpg as the persistence stack

**Status**: Accepted
**Date**: 2026-04-26
**Deciders**: Maintainer (Thiago Panini)
**Slice**: `002-backend-auth-slice`

## Context

The application is async end-to-end (FastAPI on ASGI). The persistence
adapter must therefore be async without forcing a thread-pool hop on
every query. The spec also mandates `asyncpg` over `psycopg` sync, both
to maximize throughput on serverless Postgres targets and to avoid
mixing sync/async paint in the request handler.

## Decision

- **ORM**: SQLAlchemy `>=2.0.36,<2.1`, using the 2.x async API
  (`AsyncEngine`, `AsyncSession`, `Mapped[T]`-style declarative models).
- **Driver**: `asyncpg >=0.30,<0.31`, configured as the SQLAlchemy async
  dialect (`postgresql+asyncpg://...`).
- **Migrations**: Alembic with an async-aware `env.py` that uses the same
  `AsyncEngine`.

## Consequences

**Positive**
- Pure async — no thread-pool hops, no `run_in_executor` wrappers in the
  request path.
- `asyncpg` is the fastest mainstream Postgres driver for Python; it also
  cooperates well with RDS Proxy and serverless Postgres as long as we
  size pools per-pod.
- SQLAlchemy 2.x's `Mapped[T]` annotations give us an ORM that type
  checks; a real benefit for refactor confidence as more contexts arrive.
- Alembic ships with SQLAlchemy — no third-party migration glue.

**Negative / trade-offs**
- The 2.x style is younger than 1.4; some ecosystem libraries still ship
  1.4-shaped helpers. We accept the friction; the migration story is
  clear and one-way.
- `asyncpg` does not expose a synchronous fallback API. Any future tool
  that needs sync DB access (one-off scripts, Alembic offline mode) has
  to use a separate engine. Acceptable.

## Alternatives considered

- **`psycopg` (psycopg3) async** — closer to legacy psycopg2 ergonomics
  and has both sync and async in one driver. Rejected: measurably slower
  than asyncpg in benchmarks; we have no legacy psycopg2 code to ease
  the transition for.
- **`psycopg2` (sync) behind a thread pool** — explicitly forbidden by
  the spec's Stack constraints.
- **Tortoise ORM** — async-native, simpler API. Rejected: smaller
  community, weaker Alembic-equivalent (Aerich), less typing.
- **SQLModel** — Pydantic-first wrapper on SQLAlchemy. Rejected: blurs
  the ORM↔DTO boundary that our hexagonal layering preserves.
- **Raw `asyncpg`, no ORM** — fastest possible queries. Rejected at this
  slice's complexity; we'd be hand-rolling identity-map and migration
  story for negligible gain.

## Related

- ADR-0001 (engine).
- ADR-0004 (no Postgres extensions in v1).
