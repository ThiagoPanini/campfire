# ADR-0011: AWS, Terraform, and LocalStack deprioritized indefinitely

**Status**: Accepted (supersedes ADR-0003)
**Date**: 2026-04-29
**Deciders**: Maintainer (Thiago Panini)
**Slice**: `004-app-home-redesign` (decision applies project-wide)

## Context

Constitution v1.1.0 named AWS-native infrastructure (managed via Terraform)
and LocalStack-based local cloud parity as part of the fixed long-term
stack (Principle III) and as mandatory steps in the build sequence
(Principle II). ADR-0003 deferred the *exact* AWS managed service while
keeping AWS itself as the production target. ADR-0005 deferred LocalStack
on the same kind of "not yet, but eventually" framing.

In practice, none of those three commitments has produced delivered code,
and the project has now picked Render as its hosting platform (ADR-0010).
Carrying a paper commitment to AWS / Terraform / LocalStack while shipping
on Render creates exactly the kind of "AI agent vs. constitution" conflict
the Governance section warns against: a future feature plan could
legitimately claim it must run on AWS because the constitution said so.

The maintainer has also been explicit that the only realistic motivation
for adopting AWS / Terraform is **a desire to learn the AWS-native path
end-to-end**, not any application, user, cost, or compliance signal.

## Decision

- AWS-native infrastructure, Terraform-managed cloud resources, and
  LocalStack-based local cloud parity are **deprioritized indefinitely**.
  None is a current obligation of the project.
- This ADR **supersedes ADR-0003**. The application-level constraints
  ADR-0003 enumerated (Postgres-only, `asyncpg`, DSN via
  `SettingsProvider`, no session-scoped Postgres state, no
  non-allowlisted Postgres extensions, `timestamptz` UTC) **remain in
  force**, because they protect host portability — not because they
  protect AWS-specific optionality.
- This ADR **complements ADR-0005** (LocalStack deferred). LocalStack
  remains deferred and is rolled into the same "future evolution"
  framing as AWS and Terraform.
- **No feature, plan, spec, or template MAY assume that AWS / Terraform
  / LocalStack work is on the roadmap.** Any such assumption is a bug
  to be removed.
- The trigger to revisit this decision is **the maintainer's desire to
  learn**, captured explicitly. There is no automatic trigger tied to
  user count, revenue, latency, or compliance.

## Consequences

**Positive**
- The constitution and the ADR set now match what is actually being
  built (Render-hosted MVP, Postgres-portable application code).
- Future feature work cannot accidentally inherit an obligation to
  AWS-native primitives.
- The maintainer's actual motivation (learning) is recorded honestly,
  which makes the eventual "we're doing it now" decision easier to
  recognize and ADR.

**Negative / trade-offs**
- The project gives up the implicit option of starting AWS work
  opportunistically inside an unrelated feature slice. Adopting AWS
  later requires an explicit ADR — that is the point.
- Some prior planning artifacts (e.g. `specs/002-backend-auth-slice`
  AWS-readiness language) reference AWS as if it were imminent. Those
  are **left as historical context**, per the maintainer's instruction
  not to alter implemented spec documents. This ADR is the canonical
  source of truth for the current direction.

## Constraints this decision imposes

1. The application MUST remain Postgres-host-agnostic. Specifically,
   the constraints enumerated in ADR-0003 §"Constraints this decision
   imposes on the slice" are kept verbatim — Postgres-only, `asyncpg`,
   DSN through `SettingsProvider`, no session-scoped Postgres state,
   no non-allowlisted extensions, `timestamptz` UTC.
2. New plans MUST NOT cite "we will need this on AWS" as justification.
   Any such argument requires a fresh ADR adopting AWS first.
3. New plans MUST NOT cite "LocalStack will validate this locally."
   Local validation runs against Docker PostgreSQL and the real APIs
   the application talks to.

## Trigger for revisiting

The maintainer decides — for learning, curiosity, or career-development
reasons — to invest engineering time in the AWS-native path. At that
point a new ADR MUST:

- Supersede this ADR explicitly.
- State which workloads move to AWS and on what timeline.
- Decide the fate of ADR-0010 (does Render stay for some workloads, or
  is the project fully migrated?).

Until that ADR exists, no AWS / Terraform / LocalStack code may land in
the repository.

## Alternatives considered

- **Keep ADR-0003 / ADR-0005 as-is and treat Render as a side note.**
  Rejected: the constitution already lists AWS in Principles II and III,
  so the AWS commitment would still be load-bearing. The "AI agent vs.
  constitution" conflict would persist.
- **Frame Render as MVP-only and AWS as a fixed post-MVP milestone.**
  Rejected at the maintainer's request: the migration is not
  application-driven and tying it to MVP validation would be misleading.

## Related

- ADR-0003 (AWS as production target) — superseded by this ADR.
- ADR-0005 (LocalStack deferred) — complemented by this ADR.
- ADR-0010 (Render selected as the deployment platform).
- ADR-0012 (Render PostgreSQL as production database).
- Constitution v1.2.0, Principles II and III.
