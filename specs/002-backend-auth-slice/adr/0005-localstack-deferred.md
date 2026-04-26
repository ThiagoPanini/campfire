# ADR-0005: LocalStack deferred until a slice has a real AWS-service dependency

**Status**: Accepted
**Date**: 2026-04-26
**Deciders**: Maintainer (Thiago Panini)
**Slice**: `002-backend-auth-slice`

## Context

The Campfire constitution (Principle II — Incremental Delivery) names a
build order: *frontend → backend → LocalStack-based local validation →
Terraform → CI/CD*. Reading that literally would put a LocalStack stage
*now*, before the auth slice's local validation is considered complete.

Reality check: this slice does not call any AWS service. The persistence
target is plain Postgres, the Google "OAuth" path is a stubbed local
endpoint, and there is no S3 / SQS / Cognito / Secrets Manager / SES
integration. LocalStack has nothing to emulate for us in v1.

## Decision

**Defer LocalStack** until the first slice that integrates with an AWS
service which cannot be substituted by local Postgres or an in-memory
implementation. Concretely, the trigger is any of:

- **S3** — when we need real object storage (uploads, exports).
- **SQS** — when we introduce a real async queue.
- **Cognito** — when we introduce real federated identity.
- **Secrets Manager** — when we want to validate the rotation seam in
  `SettingsProvider` end-to-end.
- **SES** — when we send real email (verification, recovery).

When that slice arrives, this ADR will be superseded by an ADR that
introduces LocalStack alongside the new service.

## Consequences

**Positive**
- The dev stack stays minimal: one Compose service (Postgres). New
  contributors can be productive in minutes.
- We don't carry a 200+ MB image and a second runtime that emulates
  services we don't call.
- The deviation from Principle II is explicit, time-bounded, and has a
  documented reversal trigger — not silent drift.

**Negative / trade-offs**
- We won't have parity with the future cloud surface for AWS-native
  features. Acceptable: there are none in v1.
- A future contributor reading the constitution literally might expect
  LocalStack here. Mitigation: this ADR + Complexity Tracking entry in
  `plan.md` make the deferral discoverable.

## Constitutional note

This is a **deviation** from Principle II's stated build order, captured
in this slice's `Complexity Tracking` table. Principle IV (Proportional
Rigor) supplies the justification — we add tooling when a concrete need
justifies it, not preemptively.

## Alternatives considered

- **Adopt LocalStack now, do nothing with it** — rejected. Tooling that
  doesn't pay for itself is a tax on every future contributor.
- **Adopt LocalStack now, simulate Postgres on it** — rejected.
  LocalStack does not provide Postgres; the Postgres part of our stack
  is a Compose service either way.
- **Wait until the cloud-deployment slice (Terraform) and skip
  LocalStack entirely** — possible. Rejected as the default because the
  constitution does call for local cloud parity once we have something
  to emulate; we'd rather honor that signal.

## Related

- ADR-0003 (AWS target service deferred).
- Constitution v1.0.1, Principle II (Incremental Delivery).
