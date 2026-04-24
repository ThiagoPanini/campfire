<!--
SYNC IMPACT REPORT
==================
Version change: 2.0.0 → 3.0.0
Change type: MAJOR — backward-incompatible relaxation of mandatory testing governance
to align with early-stage MVP workflow and AI-assisted development velocity.

Modified sections:
  - Backend Governance > Testing discipline
      (mandatory MUST unit + integration + test-first → MVP-proportional guidance;
       security/identity/data-integrity paths retain mandatory targeted tests)
  - Spec-Driven Development Discipline
      (removed "Test-first for critical paths" MUST rule;
       replaced with "Proportional testing" + softened integration test guidance)
  - AI-Assisted Development Governance > No discipline bypass
      (softened: testing now governed by proportional policy; security paths remain non-negotiable)

Added sections:
  - N/A

Removed sections:
  - N/A (rules softened, not removed)

Templates requiring updates:
  - ✅ .specify/templates/tasks-template.md (already aligned: tests marked OPTIONAL by default)
  - ✅ .specify/templates/spec-template.md (compatible; no structural changes required)
  - ✅ .specify/templates/plan-template.md (compatible; Constitution Check gate will reflect new policy)
  - ⚠ .specify/templates/checklist-template.md (verify test-related checklist items are framed
      as optional/proportional rather than mandatory)

Follow-up TODOs (carried forward from v2.0.0):
  - TODO(DOMAIN-GLOSSARY): Publish the ubiquitous language defined here as a living
      glossary under the documentation surface (Mintlify).
  - TODO(SECURITY-BASELINE): On first infrastructure commit, produce a baseline threat
      model and an AWS account/identity strategy document.
  - TODO(OBSERVABILITY-BASELINE): On first backend commit, define the canonical log,
      metric, and trace schemas, including correlation ID propagation.
-->

# Campfire Constitution

> Campfire is a music hub for groups of friends who meet sporadically for amateur jam
> sessions. It helps people learn songs on their chosen instruments, makes informal jam
> meetups more rewarding, and preserves useful musical memory across sessions.
>
> This constitution is the foundational, durable law of the project. It governs every
> future spec, plan, task, implementation, review, and operational decision. It is
> opinionated on direction, strict on discipline, and deliberately silent where it is
> still too early to decide. When this document is silent, contributors MUST declare a
> decision gate (ADR or `/speckit.clarify`) rather than invent a tacit rule.

## Core Principles

### I. Musical Growth Over Vanity Mechanics

Campfire MUST be optimized for helping people learn songs and enjoy playing together.
Features MUST NOT introduce competitive scoreboards, follower counts, public popularity
signals, streaks intended to induce guilt, or any mechanic whose primary purpose is
engagement extraction rather than musical progress or group enjoyment.

- **Rule**: Every user-facing feature proposal MUST answer, in its spec, the question
  "How does this help someone learn a song, enjoy a jam, or preserve group memory?"
  Proposals that cannot answer this question MUST be rejected or reframed.
- **Rule**: Metrics exposed to users MUST be framed as personal progress or shared group
  context, never as public ranking.
- **Rationale**: Amateur musicians are motivated by encouragement and belonging. Vanity
  mechanics corrode that and are anti-correlated with the product mission.

### II. Contextualized Musical Identity (NON-NEGOTIABLE)

A user's relationship to a song is never generic. It is ALWAYS contextualized by a
specific Instrument Context and a self-declared Proficiency. A bare `user ↔ song`
relationship does not exist in Campfire's domain model and MUST NOT be introduced.

- **Rule**: Any data model, API contract, or UI element that associates a User with a
  Song MUST carry Instrument Context and Proficiency as required dimensions. The triple
  `(User, Song, Instrument Context)` forms the primary key of a Song Capability.
- **Rule**: Proficiency MUST be self-declared by the user. Campfire MUST NOT infer or
  publish a "skill score" that the user did not choose to express.
- **Rationale**: The same song played on different instruments by the same person is a
  different learning journey. Collapsing that distinction destroys the product's value
  and misrepresents what a group can actually play together.

### III. Jam Sessions Are First-Class Collaborative Contexts

A Jam Session is a first-class domain aggregate, not metadata attached to users or
songs. It consolidates the capabilities and history of its participants and is the
primary context in which Song Requests, Song Suggestions, Performance Notes, Ratings,
and Comments live.

- **Rule**: Jam Session MUST have its own aggregate, its own lifecycle (scheduled →
  active → concluded → archived), and its own persistent history, even when the session
  is informal and short.
- **Rule**: Social artifacts (requests, suggestions, notes, ratings, comments) MUST be
  bound to a Jam Session context when they originate in one. Rebinding them to a
  context-less global feed is forbidden.
- **Rule**: Group and Jam History MUST be modeled so that a returning group can resume
  "where they left off" — this is a core product capability, not a nice-to-have.
- **Rationale**: Group value compounds over time. Treating sessions as ephemeral loses
  the asset that makes Campfire worth using past session two.

### IV. Explainable Recommendations Over Black-Box Behavior

Every Song Suggestion, ranking, or automated cue MUST be explainable in terms of known,
inspectable facts: Song Capabilities of the participants, Jam History, Ratings, Notes,
Group composition, or explicit user preferences.

- **Rule**: Every suggestion surfaced in the UI MUST be accompanied by, or able to
  reveal on demand, a plain-language reason grounded in the data ("Three of you can play
  this at Intermediate or higher; it was rated 5 last time you played it").
- **Rule**: Opaque machine-learned recommenders MAY be used only when they can produce
  per-suggestion justifications in the same domain vocabulary. Unexplainable models MUST
  NOT be deployed to end users, even if they appear to perform better in offline
  benchmarks.
- **Rationale**: Friends want reasons, not magic. Explainability also makes the system
  debuggable, auditable, and honest about its limits.

### V. Private-First, Small-Group Trust

Campfire is optimized for small, recurring, trusted groups. It is not a social network
and MUST NOT drift into one.

- **Rule**: Default visibility for Groups, Jam Sessions, Performance Notes, Comments,
  and Ratings MUST be private to the group. Broader visibility MUST require an explicit,
  revocable user action.
- **Rule**: Comments, Notes, and Ratings about a specific person's performance MUST be
  treated as sensitive social data: visible only within the relevant Group or Jam
  Session context, and NEVER syndicated, recommended, or surfaced to audiences outside
  that context.
- **Rule**: No feature MAY introduce public profiles, global leaderboards, or
  friend-of-friend discovery without a constitutional amendment.
- **Rationale**: The product is a campfire, not a stadium. Trust is the substrate that
  makes honest feedback possible among amateur musicians.

### VI. Historical Memory as a Product Asset

Jam History, Song Capabilities, and session artifacts are long-term product assets. They
MUST be treated with the same rigor as a production database schema: versioned,
migratable, preserved, and defended against accidental loss.

- **Rule**: Destructive operations on historical session data MUST be irreversible only
  at explicit user/group request. Soft-delete with retention SHOULD be the default.
- **Rule**: Schema changes to historical entities MUST include a migration plan and MUST
  preserve the semantic meaning of prior records. Silent lossy rewrites are forbidden.
- **Rule**: No feature MAY retroactively rewrite a historical Performance Note, Rating,
  or Comment without a visible edit trail.
- **Rationale**: A group's memory is the product's moat. Corrupting or quietly losing it
  violates the core promise to users.

### VII. Copyright-Respecting by Default (NON-NEGOTIABLE)

Campfire is a coordination and memory product, not a content-distribution product. It
MUST NOT store, host, or redistribute copyrighted lyrics, tabs, sheet music, backing
tracks, or audio recordings unless an explicit license has been secured and recorded in
an ADR.

- **Rule**: Song entities MUST reference songs by metadata (title, artist, canonical
  identifiers) without embedding copyrighted content. Links to third-party sources are
  acceptable; mirroring their content is not.
- **Rule**: User-generated content (Notes, Comments, session recordings if ever
  introduced) MUST include explicit consent and retention semantics, defined by a future
  privacy spec before any such feature ships.
- **Rationale**: A solo maintainer cannot carry the legal exposure of unlicensed content
  redistribution. This is a firm red line.

### VIII. Domain-Driven, Hexagonal, Clean Architecture on the Backend

The backend MUST be built so that domain logic is protected from framework, transport,
and infrastructure concerns. Clean Architecture, Hexagonal (Ports & Adapters), and
Domain-Driven Design are the foundational influences.

- **Rule**: The domain layer MUST NOT import from web frameworks, ORMs, AWS SDKs, HTTP
  libraries, or any other infrastructure concern. Dependencies MUST point inward.
- **Rule**: Use cases MUST be expressed as explicit application services orchestrating
  domain objects; they MUST NOT live inside HTTP handlers or ORM models.
- **Rule**: Persistence, messaging, external APIs, and identity MUST be reached through
  ports (interfaces) with infrastructure-side adapters. Swapping an adapter MUST NOT
  require changes in the domain layer.
- **Rule**: Bounded contexts MUST be identified early (at minimum: Identity, Music
  Catalog reference, Capability, Jam Session, Group, History/Analytics) and their
  boundaries MUST NOT be violated by shared mutable models.
- **Rule**: The default starting shape is a **modular monolith**. Splitting into
  separately deployed services requires measurable evidence (scale, team topology,
  deployment coupling) and an ADR. Accidental distributed architecture is forbidden.
- **Rationale**: A small maintainer with heavy AI assistance cannot afford domain drift.
  A disciplined architecture lets the product evolve without rewrites and lets AI agents
  generate code that lands in the right layer.

### IX. Polished, Accessible, Design-Systematic Frontend

The frontend MUST deliver a polished, modern, emotionally warm experience. Quality of
feel is a product requirement, not a nicety.

- **Rule**: A design-system mindset MUST be preferred over one-off UI. A shared token
  set (color, spacing, typography, motion) and component library MUST emerge by the
  first user-facing release; ad-hoc styling is acceptable only during very early
  exploration and MUST be paid down before the first release milestone.
- **Rule**: Accessibility SHOULD be considered from the beginning of user-facing work,
  with obvious blockers treated as bugs: unusable keyboard flows, missing labels on
  primary controls, unreadable contrast, or motion that cannot be reduced. Full WCAG 2.1
  AA validation MUST be formalized before the first public release milestone.
- **Rule**: Every interactive flow MUST provide fast, observable feedback (optimistic
  updates, loading states, error states) within budgets set by the relevant spec.
- **Rule**: Frontend choices MUST favor responsiveness (mobile-first for session-time
  flows) and resilience to flaky connectivity — jam sessions happen in living rooms, not
  datacenters.
- **Rationale**: Campfire's audience is friends, not power users. If the product does
  not feel warm, polished, and frictionless, it will not be used.

### X. AWS-Native Infrastructure, Terraform as Source of Truth

Infrastructure MUST be AWS-native in direction and MUST be defined in Terraform.
Click-ops and out-of-band mutations are forbidden for anything that survives beyond a
throwaway experiment.

- **Rule**: All long-lived cloud resources MUST be created and modified via Terraform in
  this repository. Resources created manually MUST be either imported or destroyed
  within the same change cycle.
- **Rule**: Managed AWS services SHOULD be preferred over self-hosted equivalents when
  they reduce operational burden without compromising product needs or principle
  compliance. Self-hosting requires an ADR.
- **Rule**: Environments (at minimum: development, production; staging OPTIONAL, added
  when justified) MUST be isolated by AWS account or by explicit, auditable boundaries.
  Shared blast radius across environments is forbidden.
- **Rule**: Terraform state MUST be remote, encrypted, versioned, and access-controlled.
  Local state for production is forbidden.
- **Rule**: Least privilege is the default. Every IAM role MUST be scoped to the
  narrowest set of actions and resources that makes the workload function. Wildcard
  permissions MUST be justified in the PR description and reviewed with extra scrutiny.
- **Rule**: Secrets MUST NEVER be committed to the repository. A managed-secrets path
  (e.g., AWS Secrets Manager or SSM Parameter Store with KMS) MUST be chosen before the
  first deployment and used consistently.
- **Rule**: Encryption in transit (TLS) and at rest MUST be the default for every data
  store, queue, and bucket. Exceptions require an ADR.
- **Rule**: Cost awareness is encouraged during early MVP development and MUST be
  formalized before the first production deployment.
- **Rationale**: A solo builder cannot absorb operational chaos. AWS-native managed
  services plus Terraform discipline buy back time, traceability, and safety.

### XI. Docs-as-Code with Mintlify as the First-Class Surface

Documentation is a product asset and an engineering asset. It MUST be maintained as
code, reviewed like code, and treated as a first-class deliverable for both humans and
future AI agents.

- **Rule**: Documentation MUST live in the repository and ship through the same review
  process as code. Out-of-band wiki drift is forbidden.
- **Rule**: Mintlify is the intended public documentation surface. The Mintlify
  configuration and content tree MUST remain valid and buildable on every PR.
- **Rule**: The repository MUST maintain, discoverably, at minimum: a README, an
  onboarding/quickstart path, an architecture overview, an ADR log, a domain glossary
  (the ubiquitous language from this constitution), and runbooks for any
  production-impacting workflow.
- **Rule**: Any user-facing behavior change MUST update the docs in the same PR. "Docs
  later" is not a valid plan.
- **Rule**: AI-assisted work that introduces new concepts MUST update the glossary and
  relevant docs so the next AI session starts informed.
- **Rationale**: Documentation is how a solo maintainer keeps leverage over time and how
  AI agents avoid drifting from the product's intent.

## Domain Foundations & Ubiquitous Language

This section establishes the stable, shared vocabulary. All specs, plans, tasks, code,
tests, docs, and AI prompts MUST use these terms with these meanings. Introducing a
synonym requires an ADR that either replaces the term here or justifies a local
refinement within a bounded context.

- **User**: A person with a Campfire account. Identity is per-person, not per-instrument.
- **Group**: A persistent set of Users who jam together. The primary unit of trust and
  privacy.
- **Jam Session**: A first-class collaborative context (see Principle III) tied to a
  Group, with a lifecycle and its own history. Short or long, planned or impromptu.
- **Song**: A reference to a musical work, identified by metadata only (see Principle
  VII). Not a container of copyrighted content.
- **Instrument Context**: The specific instrument (and, when meaningful, configuration
  such as "acoustic guitar" vs. "electric guitar") in which a User relates to a Song.
- **Proficiency**: A self-declared level expressing how ready the User is to play a
  Song in a given Instrument Context. Self-declared, editable, and never inferred
  without user confirmation.
- **Song Capability**: The `(User, Song, Instrument Context, Proficiency)` fact. The
  atomic unit of "who can play what, how, how well."
- **Song Request**: A User's ask, within a Jam Session, to play a specific Song.
- **Song Suggestion**: A system- or peer-proposed Song to play, accompanied by an
  explanation grounded in Song Capabilities and Jam History (see Principle IV).
- **Performance Note**: A contextual note captured during or after a Jam Session about
  how a Song was played. Bound to the session.
- **Comment**: Free-form text tied to a session context (session, song-in-session, or
  performance). Governed by Principle V.
- **Rating**: A lightweight evaluation (scoped to either a performance within a session
  or to a song within a group), bound to a session context.
- **Jam History**: The persistent record of Jam Sessions, their Song Requests,
  Suggestions, Performance Notes, Ratings, and Comments. Governed by Principle VI.

These entities are authoritative at the ubiquitous-language level. Their precise
attributes and relationships are deliberately **not** fixed here — that is the role of
`/speckit.specify` and `/speckit.plan`. This constitution fixes their meaning, not their
schema.

## Engineering Governance

### Frontend Governance

- The frontend MUST be a single cohesive application rooted in the repository and
  MUST use a component model, design tokens, and accessibility primitives consistent
  with Principle IX.
- Performance budgets (initial load, interaction latency, bundle size) MUST be declared
  in the plan of any user-facing feature once the application has a baseline. Budgets
  MUST be observable in CI or in production telemetry.
- Frontend state related to a Jam Session MUST tolerate connectivity interruptions
  gracefully: optimistic local state, clear reconciliation, and no silent data loss.

### Backend Governance

- The backend MUST preserve the layering required by Principle VIII. Pull requests that
  cause the domain layer to depend on infrastructure MUST be rejected.
- Every bounded context MUST expose explicit application-layer entry points (use cases
  or command/query handlers). HTTP/transport layers are adapters, not homes for
  business logic.
- Contracts at the system edge (HTTP APIs, asynchronous messages, persisted schemas)
  MUST be defined first and versioned. Breaking contract changes MUST be deliberate,
  documented, and migration-aware.
- Testing discipline (MVP-proportional):
  - Testing effort MUST be proportional to the maturity and risk of the feature.
    Security-sensitive paths, identity flows, and data-integrity invariants MUST have
    targeted tests. All other paths MAY rely on smoke tests, manual validation, or
    lightweight automated checks during MVP iteration.
  - Domain logic SHOULD be covered by fast, infrastructure-free unit tests when the
    logic is non-trivial. Simple pass-through or scaffolding code MAY be validated
    manually or via smoke test.
  - Integration tests are encouraged for critical paths but MUST NOT be a blanket
    requirement that blocks MVP feature delivery. They SHOULD be added incrementally
    as features stabilize and prove their value.
  - Test-first development is encouraged but not mandatory. Writing tests alongside or
    after implementation is acceptable during MVP iteration. Security and data-integrity
    paths MUST have tests in place before reaching production.

### Infrastructure Governance

- All infrastructure changes MUST flow through Terraform in this repository (see
  Principle X).
- Terraform modules SHOULD be organized so that environment composition is explicit and
  module reuse is possible without copy/paste.
- Every environment MUST have a documented and tested recovery path for its primary
  data store. "We'll figure it out during an incident" is not acceptable.
- Changes that affect identity, public endpoints, networking, or data at rest MUST be
  reviewed with explicit attention to security impact.

### Documentation Governance

- The `docs/` tree (or Mintlify-configured equivalent) MUST remain buildable on every
  PR. A broken docs build MUST block merge.
- Every ADR MUST be numbered, dated, and include Context / Decision / Consequences at a
  minimum. ADRs MUST be created for: constitutional amendments, non-default technology
  choices, bounded-context splits, and any exception to a `MUST` in this constitution.
- Runbooks MUST exist for any workflow whose failure impacts users, before that
  workflow is relied upon in production.

## AI-Assisted Development Governance

Campfire is built by a solo maintainer with heavy AI assistance. The constitution
embraces this reality while refusing to let it degrade quality, traceability, security,
or maintainability.

- **Human authority**: A human maintainer MUST be the authority for constitutional
  changes, risky architectural decisions, security-sensitive changes, and
  production-impacting operations. AI agents MAY draft, plan, and implement, but MUST
  NOT self-approve changes in these categories.
- **Traceability**: AI-generated work MUST be reviewable the same way human work is:
  through diffs, commits, PR descriptions, and the Spec-Kit artifact trail (constitution
  → spec → plan → tasks → implementation). AI output that cannot be traced back to a
  spec or a recorded request MUST NOT be merged into main.
- **First-class AI assets**: Specs, plans, tasks, skills, agent instructions, prompts,
  MCP configurations, and related AI artifacts are first-class project assets. They
  MUST live in the repository, be reviewed, and be maintained — not scattered in chat
  logs.
- **Vendor-neutral authority**: The constitution is authoritative over any single AI
  tool. The repository MUST make room for multiple AI assistants (for example Claude
  Code, GitHub Copilot, Codex, and successors) without coupling its rules to one
  vendor. If a rule currently depends on a specific tool, that dependency MUST be
  explicit and revisitable.
- **No discipline bypass**: AI assistance MUST NOT be used to skip architecture
  review, documentation, or security review. Testing requirements are governed by the
  proportional testing policy in Engineering Governance; AI assistance MUST NOT skip
  tests on security-sensitive or data-integrity paths. Speed is earned by the leverage
  of the system, not by removing essential guardrails.
- **Prompt and skill hygiene**: Prompts and skills that materially shape generated code
  MUST be stored in the repository, reviewed, and versioned like any other code. Secrets
  MUST NEVER be embedded in prompts or skills.
- **AI-authored content labeling**: Where reasonable, commits and PRs produced with
  heavy AI assistance SHOULD note that fact, and the maintainer remains accountable for
  what lands.

## Non-Functional Baselines

These are constitutional obligations. Concrete numerical targets belong in the specs
and plans that introduce the relevant scope; the obligations themselves are fixed here.

- **Security by default**: Least privilege; encryption in transit and at rest; no
  hardcoded secrets; authentication/authorization designed into every user-exposed
  surface from day one; explicit threat consideration for any feature touching identity,
  data access, public endpoints, or infrastructure.
- **Privacy by default**: Private-to-group defaults (Principle V); explicit consent for
  any data use beyond the immediate product loop; minimal personal data collection;
  documented retention semantics for any personal, social, or behavioral data.
- **Accessibility by maturity**: Early MVP work SHOULD avoid obvious accessibility
  blockers in primary flows. WCAG 2.1 AA validation becomes a release gate before the
  first public release milestone, and accessibility regressions after that point are bugs,
  not enhancements.
- **Reliability and recoverability**: Every production data store MUST have a tested
  backup/restore path; user-visible failures MUST degrade gracefully; destructive
  operations MUST be reversible or confirmed.
- **Observability and diagnosability**: Structured logs, metrics, and traces are
  first-class. Critical user actions (auth, group/session lifecycle, rating/comment
  creation, suggestion generation) MUST be observable end-to-end with correlation IDs
  connecting frontend actions to backend flows. Observability MUST be designed in at
  feature planning time, not bolted on after incidents.
- **Performance awareness**: Performance budgets MUST be declared for user-visible
  flows once a baseline exists, and MUST be revisited when the scope of a flow changes
  materially.
- **Cost awareness**: Early MVP infrastructure changes SHOULD consider cost, and cost
  expectations MUST be formalized before the first production deployment.
- **Maintainability, simplicity, evolvability**: Prefer boring, composable, well-named
  building blocks over clever ones. Abstractions MUST pay for themselves; three similar
  lines are better than a premature generalization. Future optionality MUST be bought
  only with evidence of need.

## Spec-Driven Development Discipline

Campfire is developed through Spec-Kit. This constitution enforces the separation of
concerns between its artifacts.

- **Constitution = durable principles.** This document. It MUST NOT contain
  feature-level implementation details, API shapes, schemas, or today's tech choices
  beyond what is already named here. Anything narrower belongs in a spec, plan, or ADR.
- **Spec (`/speckit.specify`) = WHAT and WHY.** User stories, acceptance criteria,
  success metrics, and explicit assumptions. Specs MUST NOT prescribe technical HOW
  decisions. Specs MUST surface unknowns as explicit `NEEDS CLARIFICATION` markers
  rather than inventing answers.
- **Plan (`/speckit.plan`) = HOW.** Technical approach, structure, and constitution
  check. Every plan MUST include a Constitution Check referencing the principles above;
  any violation MUST be either removed, justified in a Complexity Tracking entry with a
  named rejected alternative, or escalated to a constitutional amendment.
- **Tasks (`/speckit.tasks`) = executable decomposition.** Dependency-ordered,
  user-story-aligned, independently testable work items.
- **Implementation (`/speckit.implement`) = execution constrained by the above.**
  Implementation MUST NOT silently expand scope beyond the spec or deviate from the
  plan; material deviations require updating the upstream artifact first.

Additional discipline:

- **Ambiguity MUST be surfaced, not guessed.** When a contributor or AI agent
  encounters an under-specified requirement, the correct action is to mark it
  `NEEDS CLARIFICATION` (in a spec) or open a decision gate (ADR), not to invent.
- **Contract-first thinking.** External-facing contracts (HTTP APIs, async messages,
  persisted schemas) MUST be designed before the code that satisfies them is written.
- **Proportional testing.** Testing MUST be proportional to feature maturity and
  risk. Security-sensitive, identity, and data-integrity paths MUST have targeted
  tests. General feature work MAY rely on manual validation, smoke tests, or
  lightweight automated checks during MVP iteration. Broad test coverage is not a
  prerequisite for shipping a feature at this stage.
- **Integration tests for high-risk flows.** Flows that cross security or data
  boundaries (identity, persistence, session lifecycle) SHOULD have integration tests.
  These are encouraged as features stabilize and MUST NOT be treated as a blanket
  gate on all feature work.
- **Auditable compliance.** Every plan MUST be auditable against this constitution at
  review time, and every review MUST either confirm compliance or record the exception
  per the Governance section below.

## Governance

### Authority and Supremacy

- This constitution supersedes ad-hoc practices, habits, and individual preferences.
  When a rule elsewhere conflicts with this document, this document wins until amended.
- The current human maintainer is the ratifying authority. AI agents MUST NOT amend
  this constitution autonomously.

### Amendment Procedure

1. Propose the change as a PR that edits `.specify/memory/constitution.md`, including:
   - The motivation and the problem the current text fails to solve.
   - The diff to the principles or sections.
   - The version bump and its rationale (see Versioning Policy below).
   - A Sync Impact Report (updated at the top of this file) describing affected
     templates, docs, and follow-ups.
2. If the change materially alters a `MUST`, a principle, or the governance model, it
   MUST be accompanied by an ADR capturing Context / Decision / Consequences.
3. Merge requires explicit human approval. No auto-merge.
4. On merge, dependent artifacts flagged in the Sync Impact Report MUST be reconciled
   in the same or an immediately following PR.

### Versioning Policy (Semantic)

- **MAJOR**: Removal or backward-incompatible redefinition of a principle or of the
  governance model.
- **MINOR**: Addition of a new principle, a new section, or materially expanded
  guidance.
- **PATCH**: Clarifications, wording fixes, typos, non-semantic refinements.

### Compliance Reviews

- Every `/speckit.plan` run MUST execute the Constitution Check gate against this
  document and record the result in the plan.
- Every PR that touches identity, public endpoints, data access, infrastructure, or
  user-visible flows MUST explicitly state which principles it engages and confirm
  compliance (or declare and justify an exception).
- Exceptions MUST be recorded as ADRs. Undocumented exceptions are violations.
- Drift detected between this constitution and the code or docs MUST be resolved by
  either fixing the drift or amending the constitution — never by silently tolerating
  the gap.

### Solo-Builder Operating Defaults

Because Campfire is built by one maintainer with heavy AI assistance, the following
defaults apply unless an ADR overrides them for a specific decision:

- Prefer simplicity over sophistication.
- Prefer managed services over self-hosting.
- Prefer fewer moving parts over theoretically perfect architectures.
- Prefer explicit written decisions over tribal knowledge.
- Prefer repository clarity over cleverness.
- Prefer strong defaults over endless optionality.
- Prefer incremental evolution over grand upfront design.

**Version**: 3.0.0 | **Ratified**: 2026-04-22 | **Last Amended**: 2026-04-24
