<!--
Sync Impact Report
- Version change: 1.0.1 → 1.1.0
- Modified principles:
  * III. Boring, Proven Stack — wording unchanged; the architectural
    invariants previously implied by "Clean Architecture + Hexagonal + DDD,
    applied pragmatically" are now made explicit in a new subsection of
    "Technical Direction & Constraints" (see below). No principle was
    removed, inverted, or narrowed.
- Added sections:
  * Technical Direction & Constraints → "Backend Architecture Invariants"
    subsection. It captures the durable rules that emerged from slice
    002-backend-auth-slice and a comparative review against the reference
    architecture: bounded-context slicing, layer purity enforced by an
    automated test, cross-context references by identifier value objects,
    and HTTP translation of application errors at the adapter boundary.
- Removed sections: N/A
- Companion artifacts (non-normative; produced alongside this amendment):
  * ADR-0006 — "Backend Hexagonal + DDD Architecture Pattern"
    (specs/002-backend-auth-slice/adr/0006-backend-hexagonal-ddd-pattern.md)
  * Backend architecture playbook
    (docs/backend/architecture.mdx)
  * Comparative architecture review
    (specs/002-backend-auth-slice/analysis/architecture-review.md)
- Templates requiring updates:
  * ✅ .specify/templates/plan-template.md — Constitution Check gate is
    generic; new invariants are testable through the existing AST guard
    test. No template edit required.
  * ✅ .specify/templates/spec-template.md — no principle-level coupling.
  * ✅ .specify/templates/tasks-template.md — lean stance still matches.
- Mirror requiring updates:
  * ✅ docs/sdd/methodology/constitution.mdx — updated in the same change
    set (version block + new "Backend Architecture Invariants" callout).
- Follow-up TODOs:
  * Re-evaluate the invariants when a second backend bounded context lands
    (e.g. repertoire). Trigger: any cross-context import beyond identifier
    value objects, or any new transactional flow that cannot express its
    boundary through the current `session_scope`.
-->

# Campfire Constitution

Campfire is a private music hub for small, informal music circles. The MVP
helps users track songs they know, see what they are still learning, and share
that repertoire with the people they play with. This constitution keeps the
project lean so a solo builder working with heavy AI assistance can ship.

## Core Principles

### I. Narrow MVP Scope

The MVP MUST only serve three user jobs: (1) record songs a user already
knows, (2) capture songs the user is still learning, and (3) share that
repertoire with a small circle. Any feature outside those jobs is out of
scope until explicitly re-scoped through an amendment. YAGNI is the default
answer.

**Rationale**: Scope creep is the primary failure mode for solo-built MVPs.
A hard perimeter lets AI-assisted work stay coherent and shippable.

### II. Incremental Delivery

Work MUST ship in thin, demonstrable slices that follow this build order:
frontend → backend → LocalStack-based local validation → Terraform-managed
AWS infrastructure → GitHub Actions deployment pipeline. Earlier stages MUST
be usable (even with mocked data) before later stages begin. No stage blocks
on a later stage being "ready."

**Rationale**: Each slice produces something the user can see or run, which
keeps feedback loops short and avoids big-bang integration risk.

### III. Boring, Proven Stack

The long-term stack is fixed and MUST NOT be re-litigated per feature:
- Frontend: scalable web stack, chosen once, applied consistently.
- Backend: Python managed with `uv`, FastAPI, relational database.
- Backend architecture: Clean Architecture + Hexagonal + DDD, applied
  pragmatically — layers exist to serve the domain, not the other way around.
- Infrastructure: AWS-native, defined in Terraform.
- Local validation: Docker + LocalStack.
- CI/CD: GitHub Actions.
- Docs: Mintlify, docs-as-code, updated alongside the code that changes.

Introducing a new language, framework, or cloud provider requires an
amendment (see Governance).

**Rationale**: A stable stack removes decision fatigue and lets AI tooling
generate consistent code.

### IV. Proportional Rigor

Tests, accessibility work, observability, formal reviews, and governance
artifacts MUST be added when a concrete need justifies them, not preemptively.
Acceptable triggers include: a recurring bug class, a user-facing regression,
an operational incident, a compliance or distribution requirement, or a piece
of logic complex enough that a test is the cheapest way to reason about it.
"We might need it later" is not a trigger.

**Rationale**: Upfront process ceremony is the single biggest tax on a solo
MVP. Rigor earns its place by paying for itself.

### V. Docs-as-Code, Continuously

Every user-facing change or architectural decision MUST land together with
the Mintlify doc update that reflects it, in the same change set. Internal
scratch notes do not count. If a change needs no doc update, that MUST be
obvious from the change itself.

**Rationale**: Docs written later are docs never written. Keeping Mintlify
current from day one is cheap; catching up after the fact is not.

## Technical Direction & Constraints

- **Build sequence (short-term, non-negotiable order)**:
  1. Frontend (with mocked data where the backend does not yet exist).
  2. Backend (Python, `uv`, FastAPI, relational DB, Clean/Hex/DDD).
  3. LocalStack-based local testing and debug scripts.
  4. AWS infrastructure via Terraform.
  5. GitHub Actions deployment pipeline.
- **Data**: relational by default; no NoSQL, queues, or caches unless a
  specific feature demonstrably requires them.
- **Environments**: local-first via Docker + LocalStack; cloud parity is a
  goal, not a gate.
- **Secrets and credentials**: never committed; local via `.env` files
  excluded by `.gitignore`, cloud via AWS-native secret stores.
- **Architecture discipline**: the domain layer MUST NOT import frameworks,
  ORMs, or AWS SDKs. Adapters live at the edges.

### Backend Architecture Invariants

These invariants codify the pattern adopted in slice
`002-backend-auth-slice`. They apply to every backend feature unless
amended. The mechanism by which each invariant is satisfied (e.g. choice
of Python idiom) is documented in **ADR-0006** and the backend playbook
at `docs/backend/architecture.mdx`. The constitution fixes the *what*;
those companion documents fix the *how*.

1. **Slicing is by bounded context.** Backend code lives under
   `apps/api/src/campfire_api/contexts/<context>/`. A new context is
   created when its business rules can be described without referencing
   another context's rules. A context owns its own `domain/`,
   `application/`, and `adapters/` folders.
2. **Layer purity is enforced by test, not by review.** An automated
   test MUST fail the build if `domain/` or `application/` imports any
   web framework, ORM, password-hashing library, JWT library, or cloud
   SDK. The current implementation lives at
   `apps/api/tests/unit/test_architecture.py`; equivalent guards MUST
   exist for any new context.
3. **Cross-context references travel as identifier value objects.**
   One context MUST NOT import another context's entities, ORM rows, or
   repositories. It MAY import that context's identifier value objects
   (e.g. `UserId`) or call public application services exposed at the
   adapter boundary.
4. **Application errors translate to HTTP only at the adapter
   boundary.** Use cases raise domain exceptions (a single
   `<Context>Error` hierarchy). A registered FastAPI exception handler
   maps that hierarchy to status codes and bodies. Use cases MUST NOT
   raise `HTTPException` or any framework-specific error type.
5. **Persistence transactions have an explicit boundary.** Every
   write-bearing application flow runs inside a single transactional
   scope owned by an adapter. The session/UoW MUST NOT be closed or
   committed by the use case itself; it is opened and closed by the
   adapter that called the use case (HTTP request, scheduled job, CLI,
   etc.). When a non-HTTP trigger is added, the boundary MUST be lifted
   to an explicit `UnitOfWork` port rather than relying on the request
   lifecycle.
6. **Validation lives at the layer it actually protects.** Pydantic
   schemas validate the *transport contract* at the HTTP boundary;
   value objects and entities validate the *domain invariants*. The
   same rule MUST NOT be enforced in three places — when in doubt,
   the domain wins and the HTTP layer is a fast-fail UX hint.
7. **Settings and time are ports, not modules.** Application code
   reads configuration through a `SettingsProvider` Protocol and the
   current time through a `Clock` Protocol. Direct `os.getenv`,
   `datetime.utcnow()`, or hard-coded URLs are forbidden in `domain/`
   and `application/`.

## Development Workflow

- **Solo + AI default**: the maintainer is the sole reviewer. AI-generated
  changes MUST be read and understood before commit; unreviewed AI output is
  not acceptable.
- **Branches and commits**: feature branches off `main`; small, focused
  commits; conventional-style messages encouraged but not enforced.
- **Definition of done for an MVP slice**: the slice runs locally, its
  Mintlify docs are updated, and — where applicable — its LocalStack / CI
  paths are green.
- **Tests**: write tests where Principle IV justifies them. Absence of tests
  is acceptable for throwaway or exploratory code; presence of tests is
  required once behavior is depended on by another slice.
- **Performance, accessibility, observability**: tracked as known gaps until
  a real user, device, or incident forces the work. When forced, the fix
  MUST include enough instrumentation or regression coverage to prevent
  recurrence.

## Governance

- This constitution supersedes ad-hoc preferences. When an AI agent or a
  template conflicts with it, the constitution wins.
- **Amendments**: the maintainer may amend this document at any time.
  An amendment commit MUST (a) update the version line below per the rules,
  (b) update `Last Amended`, and (c) include a one-paragraph rationale in
  the commit message.
- **Versioning**:
  - MAJOR: a principle is removed, inverted, or materially narrowed.
  - MINOR: a new principle or section is added, or an existing one is
    meaningfully expanded.
  - PATCH: wording, clarification, or non-semantic refinement.
- **Compliance review**: none scheduled. The maintainer re-reads this file
  whenever a feature feels like it is fighting the rules; that is the
  trigger to either comply or amend.

**Version**: 1.1.0 | **Ratified**: 2026-04-24 | **Last Amended**: 2026-04-26
