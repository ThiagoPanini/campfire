# ADR-0012: Render PostgreSQL as production database

**Status**: Accepted
**Date**: 2026-04-29
**Deciders**: Maintainer (Thiago Panini)
**Slice**: `004-app-home-redesign` (decision applies project-wide)

## Context

ADR-0001 fixed PostgreSQL as the only persistence engine. ADR-0002
fixed SQLAlchemy async + `asyncpg` as the driver stack. ADR-0003
originally deferred the choice of *managed* Postgres offering on AWS.
ADR-0011 has now superseded that posture: the project no longer targets
AWS by default.

ADR-0010 selected Render as the deployment platform, including its
managed PostgreSQL service. This ADR records the application-level
consequences of using Render Postgres specifically, and the rules that
keep host portability intact (so a future migration — to AWS-managed
Postgres or anywhere else — remains an adapter-level change).

## Decision

- The production database is **Render PostgreSQL**, provisioned in the
  same region as the Render Web Service that runs `apps/api`, and
  reached over the **internal** Render network URL (not the public
  external URL).
- The DSN provided by Render uses the scheme `postgresql://`. The
  application uses SQLAlchemy async with `asyncpg`, which requires
  `postgresql+asyncpg://`. **DSN normalization (`postgresql://` →
  `postgresql+asyncpg://`) lives in the settings adapter**, not in
  `domain/` or `application/`. Application code reads only the already-
  normalized DSN through the `SettingsProvider` port.
- Schema migrations run as a **Render pre-deploy command** on the Web
  Service (`alembic upgrade head`). The pre-deploy command is the
  single, ordered place migrations execute against the production
  database; no migration runs from local machines against production.
- The same migration set (`apps/api/alembic`) is the source of truth for
  local Docker Postgres and for Render Postgres. There is no
  Render-specific migration path.
- **No Render-specific Postgres feature may leak into application
  code.** The application MUST remain compatible with any standard
  PostgreSQL ≥ 16. Specifically, the application MUST NOT depend on
  Render-only extensions, Render-specific connection pooling
  primitives, or Render's internal hostname format anywhere outside
  the settings adapter.
- The host-portability constraints originally documented in ADR-0003
  (Postgres-only; `asyncpg` driver; DSN via `SettingsProvider`; no
  session-scoped Postgres state; no non-allowlisted extensions;
  `timestamptz` UTC) **remain in force**.

## Consequences

**Positive**
- Migrations run in a single, well-defined slot (pre-deploy), which
  matches the "transactions have an explicit owner" backend invariant
  at the deployment level.
- Application code stays portable. A future migration off Render is an
  infrastructure change plus a settings adapter change, not a domain
  rewrite.
- Local development continues to use Docker `postgres:16-alpine`
  (per ADR-0001 / ADR-0005), so dev ↔ prod parity is preserved.

**Negative / trade-offs**
- Render Postgres has no read replicas at the lower tiers and limited
  observability primitives. Acceptable at current scale.
- Render's free Postgres tier expires; production requires a paid plan.
  This is a budget reality, not an architectural concern.
- Backups, point-in-time recovery, and rotation rely on Render's
  managed defaults. If those become insufficient, the response is to
  open a new ADR — not to special-case the application code.

## Operational notes (non-normative)

These are pointers for whoever runs the next deployment; they are not
part of the decision and may evolve without an ADR amendment:

- Set `DATABASE_URL` on the Web Service from the Render Postgres
  internal URL.
- Set `PYTHON_VERSION=3.12.x` (or commit `apps/api/.python-version`)
  to match `pyproject.toml` `>=3.12,<3.13`.
- Pre-deploy command: `uv run alembic upgrade head` (run from
  `apps/api`).
- Start command: `uv run uvicorn campfire_api.main:app --host 0.0.0.0
  --port $PORT`.
- See `RENDER_DEPLOYMENT_READINESS_REPORT.md` for the full readiness
  walk-through.

## Alternatives considered

- **External managed Postgres (Neon, Supabase, etc.) connected to a
  Render Web Service.** Rejected for the first cut: introduces a
  second billing surface and a second SLA without a current need.
- **Self-hosted Postgres on a Render Private Service or VPS.**
  Rejected: re-introduces operational tax (backups, patching) that
  Render's managed Postgres absorbs.
- **Pin a specific managed offering now (as ADR-0003 originally
  warned against).** Adopted in spirit only — Render Postgres is the
  current host, but the rules in ADR-0003 about not letting that
  choice leak into application code are kept verbatim.

## Related

- ADR-0001 (PostgreSQL as engine).
- ADR-0002 (SQLAlchemy async + `asyncpg`).
- ADR-0003 (AWS managed-service deferred) — superseded by ADR-0011;
  application-level constraints carried forward into this ADR.
- ADR-0010 (Render as deployment platform).
- ADR-0011 (AWS / Terraform / LocalStack deprioritized indefinitely).
