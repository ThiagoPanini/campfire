<!--
Sync Impact Report
- Version change: 1.0.0 → 1.0.1
- Modified principles:
  * I. Narrow MVP Scope — wording fix only: restored the missing second user
    job ("capture songs the user is still learning") and corrected the broken
    numbering "(1)…(3)…" that omitted (2). Semantics unchanged; the opening
    paragraph already asserted all three jobs.
- Added sections: N/A
- Removed sections: N/A
- Templates requiring updates:
  * ✅ .specify/templates/plan-template.md — re-reviewed, Constitution Check
    gate is generic; still compatible.
  * ✅ .specify/templates/spec-template.md — re-reviewed, no principle-level
    coupling; no edit required.
  * ✅ .specify/templates/tasks-template.md — re-reviewed, lean stance still
    matches; no edit required.
  * ⚠ .specify/templates/commands/*.md — directory not present in this repo;
    skipped.
  * ⚠ README.md / docs/quickstart.md — out-of-scope manual repo reorganization
    moved docs to `docs/` and the web app to `apps/web/`; Constitution stays
    high-level (no path coupling), so no edit required for this amendment.
- Follow-up TODOs:
  * TODO(DOCS_BOOTSTRAP): Stand up Mintlify docs skeleton when frontend work
    begins; link this constitution from it. (Carried over; partially in
    progress under `docs/`.)
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

**Version**: 1.0.1 | **Ratified**: 2026-04-24 | **Last Amended**: 2026-04-25
