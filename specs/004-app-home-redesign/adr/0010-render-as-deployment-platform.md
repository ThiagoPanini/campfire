# ADR-0010: Render selected as the deployment platform

**Status**: Accepted
**Date**: 2026-04-29
**Deciders**: Maintainer (Thiago Panini)
**Slice**: `004-app-home-redesign` (decision applies project-wide)

## Context

The original constitution (v1.1.0) named AWS-native infrastructure managed
with Terraform, complemented by LocalStack for local cloud parity, as the
target hosting stack. That commitment was made before any deployment had
shipped and was justified by long-term ambitions rather than current
operational needs.

In practice, the project is built and maintained by a single person with
heavy AI assistance, and the priority is to validate product hypotheses
(Principle I — Narrow MVP Scope) and keep delivery cycles short
(Principle II — Incremental Delivery, Principle IV — Proportional Rigor).
A full AWS + Terraform + LocalStack track adds significant operational
surface (IAM, networking, IaC review loops, cost monitoring, secret
rotation) that pays for itself only once the product has real users and
real operational signals.

A readiness review (`RENDER_DEPLOYMENT_READINESS_REPORT.md`) confirmed
that the existing application architecture — a Vite SPA in `apps/web`,
a FastAPI service in `apps/api`, and a PostgreSQL database — maps cleanly
onto Render's primitives:

- Render Static Site for the frontend.
- Render Web Service for the FastAPI backend.
- Render PostgreSQL for the database.

## Decision

- **Render is the deployment platform for Campfire**, for the MVP and
  for the foreseeable post-MVP period. It is not framed as an interim
  shortcut.
- The production topology is exactly three Render resources:
  1. A **Static Site** for `apps/web` (Vite build, served via Render's
     CDN with SPA rewrites configured in the dashboard).
  2. A **Web Service** for `apps/api` (FastAPI on `uv`, listening on
     `0.0.0.0:$PORT`, no `--reload`).
  3. A **PostgreSQL** managed database (see ADR-0012).
- Deployment is automated through Render's native pipeline (push-to-
  deploy from `main`, with pre-deploy migrations on the Web Service).
  A `render.yaml` blueprint may be added later but is not required for
  the first production deploy.
- Application code MUST remain free of Render-specific assumptions.
  Render is reached only through adapters: HTTP entrypoint, settings
  provider, persistence adapter. Anything Render-specific (e.g. DSN
  normalization from `postgresql://` to `postgresql+asyncpg://`) lives
  in those adapters, not in `domain/` or `application/`.

## Consequences

**Positive**
- Time-to-deploy shrinks from "build a full IaC track" to "configure
  three Render resources." The maintainer can validate product
  decisions against real users before paying any infrastructure tax.
- A single managed platform owns TLS, build pipelines, log aggregation,
  health checks, and managed Postgres. No per-feature infra work.
- The Backend Architecture Invariants (constitution §
  "Backend Architecture Invariants") were already platform-agnostic;
  this decision validates that posture rather than disturbing it.

**Negative / trade-offs**
- Render imposes its own pricing curve. A successful product would
  eventually bump into per-service costs (paid Web Services, Postgres
  tiers) that AWS-native equivalents could optimize.
- No multi-region, no VPC peering, no fine-grained IAM. Acceptable
  given current scale (single maintainer, no users yet).
- Some operational primitives (managed secrets rotation, fine-grained
  observability, IaC drift detection) are weaker than AWS equivalents.
  Tracked as known gaps, surfaced only if Principle IV triggers fire.

## Non-goals (explicit)

- Multi-region deployment.
- VPC / network isolation beyond Render defaults.
- Infrastructure-as-Code for Render resources in the first production
  cut. (`render.yaml` is acceptable later but is not load-bearing.)
- External observability stack (Datadog, Grafana Cloud, etc.).

## Trigger for revisiting

The trigger to migrate off Render is **not** an application or scale
metric. It is the maintainer's stated desire to learn the AWS-native
infrastructure path end-to-end. When that desire converts into actual
work, a new ADR MUST be opened that supersedes ADR-0011 (and, if the
hosting choice itself changes, this ADR).

## Alternatives considered

- **AWS-native + Terraform now** (the original constitution v1.1.0
  position). Rejected: pre-product complexity. ADR-0011 captures the
  full reasoning.
- **Fly.io / Railway / other PaaS**. Not deeply evaluated. Render was
  selected because it covers all three workloads (static, web service,
  Postgres) under one billing surface and the readiness review already
  validated it.
- **Self-hosted on a single VPS**. Rejected: the operational tax
  (TLS, log rotation, OS patching, manual Postgres) outweighs Render's
  monthly cost.

## Related

- ADR-0011 (AWS / Terraform / LocalStack deprioritized).
- ADR-0012 (Render PostgreSQL as production database).
- `RENDER_DEPLOYMENT_READINESS_REPORT.md` (tactical readiness review).
