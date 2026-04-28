# ADR-0003: AWS as production target; specific managed service deferred

**Status**: Accepted
**Date**: 2026-04-26
**Deciders**: Maintainer (Thiago Panini)
**Slice**: `002-backend-auth-slice`

## Context

The constitution names AWS as the cloud provider (Principle III). The
spec calls Aurora Serverless v2 (Postgres) the "leading candidate" for
production but also requires this slice to remain agnostic of the exact
managed offering. The team will not run application code that pins us to
RDS-vs-Aurora-vs-Aurora-Serverless-v2 before the infrastructure slice has
made that call with cost and latency data.

## Decision

- The application targets a **Postgres-compatible** engine generically.
  No code, migration, or configuration in this slice presumes a specific
  managed offering.
- The DSN is read through a **`SettingsProvider`** seam (`pydantic-
  settings`-backed in v1) so a future `AwsSecretsManagerSettingsProvider`
  can replace it for rotation-aware credential handling **without
  changing the application code**.
- The production-target choice (RDS Postgres / Aurora Postgres / Aurora
  Serverless v2) is a **Terraform decision** in a future infrastructure
  slice. That slice will compare cold-start, scaling, and pricing data
  before committing.

## Consequences

**Positive**
- The application can be moved between RDS / Aurora / Aurora Serverless
  v2 by changing infrastructure only (DSN, parameter groups, network
  layout) — no code change, no migration change.
- We never have to "re-decide" the managed offering inside an
  application slice.

**Negative / trade-offs**
- We forgo any Aurora-specific feature in this slice (Aurora-native
  cluster cache, IAM auth, etc.). Acceptable — none of those features
  are load-bearing for identity.
- A small amount of optionality (e.g., extension allowlists) has to be
  documented in the plan rather than enforced by infrastructure.

## Constraints this decision imposes on the slice

These are the rules that keep the optionality real (mirrored in
`plan.md` § AWS readiness):

1. Postgres-only.
2. `asyncpg` driver (no sync drivers).
3. DSN via `SettingsProvider`, not boot-time `os.getenv`.
4. No session-scoped Postgres state (LISTEN/NOTIFY, advisory locks,
   request-spanning temp tables).
5. No Postgres extensions outside the Aurora-supported list — and none
   in this slice (ADR-0004).
6. `timestamptz` UTC throughout.

## Alternatives considered

- **Pin Aurora Serverless v2 now** — would unlock IAM auth and Aurora-
  native pooling primitives. Rejected: premature; the cost/latency
  profile of Aurora Serverless v2 v. RDS Postgres is exactly what the
  infrastructure slice will measure. We'd be building on an unverified
  default.
- **Pin RDS Postgres now** — cheapest, simplest. Rejected: same reason
  in reverse — we'd close off serverless before measuring it.

## Related

- ADR-0001 (engine).
- ADR-0004 (extension allowlist, UUID v7, `timestamptz`).
- ADR-0005 (LocalStack deferred).
