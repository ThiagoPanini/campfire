Create the initial constitution for a brand-new software product called Campfire.

This is a greenfield project that will be built from scratch using Spec-Kit as the spec-driven development framework. The project will be developed by a single maintainer with extensive AI assistance throughout product design, architecture, implementation, documentation, and operations.

Your task is NOT to write a feature spec or a technical implementation plan.
Your task is to produce a durable, high-authority constitution that defines the stable, non-negotiable principles, decision criteria, and governance rules that all future specs, plans, tasks, and implementations must follow.

The constitution must be strong enough to serve as the foundational operating system for the project.

Use the existing constitution template correctly, but make the resulting document highly opinionated, specific, and useful for this project.

Core requirements for the constitution:
- It must define durable principles, not feature-level implementation details.
- It must use explicit, auditable language (prefer MUST / MUST NOT / SHOULD with rationale).
- It must be valid as a long-lived foundation for future `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, and `/speckit.implement` runs.
- It must encode both product principles and technical principles.
- It must be written for a repo that will contain frontend, backend, infrastructure, documentation, and AI-development assets.
- It must support extensive AI-assisted development without sacrificing quality, traceability, security, or maintainability.
- It must avoid premature lock-in on low-level decisions that are still intentionally open; when something is not yet defined, encode the selection criteria and preferred defaults instead of inventing specifics.

If useful, organize the constitution conceptually into two major lenses while still respecting the template structure:
1. Product Constitution
2. Technical Constitution / Engineering Governance

Use the following project context.

PROJECT NAME
Campfire

PRODUCT MISSION
Campfire is a music hub for groups of friends who meet sporadically for amateur jam sessions.
Its purpose is to encourage people to learn songs on their preferred instruments, make informal jam meetups more rewarding, and preserve useful musical memory across sessions.

PRODUCT CONCEPT
Users can associate songs with their profile inside the context of a specific instrument and a self-declared proficiency level.
Example: one user is learning “Black” by Pearl Jam on acoustic guitar; another user is learning the same song on electric guitar; other users may learn the same or different songs on different instruments and with different proficiencies.
This creates a shared ecosystem of people, songs, instruments, and readiness levels.

In a group context, multiple users can join a Jam Session.
A Jam Session consolidates the musical history and current capabilities of the participating members.
Within a Jam Session, users should be able to:
- request songs
- receive song suggestions based on member profiles and historical data
- register ratings or notes about performances
- leave comments tied to the session context
- build a persistent history that improves future sessions

The product is fundamentally about:
- personal motivation to learn songs
- better informal jam experiences among friends
- preserving useful group memory across recurring musical meetups
- transforming lightweight social/music activity into meaningful, reusable knowledge

DOMAIN PRINCIPLES THAT SHOULD APPEAR IN THE CONSTITUTION
The constitution should establish a stable ubiquitous language for this domain, including terms such as:
- User
- Group
- Jam Session
- Song
- Instrument Context
- Proficiency
- Song Capability
- Song Request
- Song Suggestion
- Performance Note
- Comment
- Rating
- Jam History

The constitution should treat the following as foundational domain truths:
- A user’s relationship to a song is never generic; it is always contextualized by instrument and proficiency.
- Jam Sessions are first-class collaborative contexts, not secondary metadata.
- Group value comes from consolidating musical capability, session interaction, and historical memory over time.
- Recommendations and suggestions must be explainable by known profile/session/history data, not opaque magic.
- The product is optimized for amateur, friendly, recurring, low-friction music gatherings, not for professional production workflows.
- Historical session data is strategically valuable and should be modeled as a long-term product asset.
- User-entered notes, comments, and ratings are contextual social data and must be handled with trust, privacy, and respect.
- Do not assume Campfire stores or redistributes copyrighted lyrics, tabs, sheet music, or audio unless explicitly licensed.

NON-NEGOTIABLE PRODUCT-LEVEL CONSTITUTIONAL PRINCIPLES
The constitution should define durable product principles around:
- musical growth and encouragement over vanity mechanics
- low-friction group coordination over workflow complexity
- explainable recommendations over black-box behavior
- private/small-group usefulness over social-network noise
- preserving context and history over ephemeral interaction
- trust, consent, and respectful feedback over public judgment
- delight, clarity, and emotional warmth in the product experience
- data structures that reflect real musical collaboration, not generic CRUD abstractions

TECHNICAL DIRECTION THAT MUST BE ENCODED
The project should be governed by strong but not prematurely over-specified technical principles.

The constitution must clearly establish that Campfire is expected to include first-class concerns for:
- Frontend
- Backend
- Infrastructure
- Documentation
- Agentic Development / AI Artifacts

The constitution should encode the following technical direction as durable rules or defaults:

FRONTEND
- Campfire MUST deliver a polished, modern, high-quality user experience.
- The frontend MUST favor strong usability, accessibility, responsiveness, visual consistency, and fast feedback.
- A design-system mindset SHOULD be preferred over one-off UI decisions.
- Accessibility MUST be treated as a baseline quality property, not a later enhancement.
- Performance budgets and observable UX quality SHOULD be expected in future plans/specs.

BACKEND
- The backend MUST be designed with strong architectural discipline.
- Clean Architecture, Hexagonal Architecture, and DDD principles are core influences and must shape the constitution.
- Domain logic MUST remain protected from framework and infrastructure leakage.
- Bounded contexts, explicit use cases, ports/adapters, and clear domain terminology SHOULD be constitutionally favored.
- New complexity MUST be justified; accidental distributed architecture MUST be avoided.
- The default starting point SHOULD be a modular monolith unless measurable needs justify further decomposition.

INFRASTRUCTURE
- Infrastructure MUST be AWS-native in strategic direction.
- Terraform MUST be the source of truth for cloud infrastructure.
- Managed services SHOULD be preferred when they reduce operational burden without violating product needs.
- Security, identity, networking, storage, observability, and deployment concerns MUST be treated as first-class infrastructure domains.
- Environment strategy, state management, module boundaries, and cost awareness MUST be explicitly governed.
- Least privilege, secure defaults, and traceable infrastructure change management MUST be mandated.

DOCUMENTATION
- Documentation MUST be treated as a product asset and an engineering asset.
- Docs-as-code MUST be the default documentation workflow.
- Mintlify is the intended documentation framework/direction and should be reflected in the constitution as a first-class documentation surface.
- The constitution SHOULD require onboarding docs, architecture docs, ADRs, runbooks, domain glossary, and change logs to remain discoverable and current.
- Documentation MUST support future contributors and future AI agents.

AGENTIC DEVELOPMENT / AI GOVERNANCE
- AI-generated work MUST be reviewable, traceable, and governed.
- Specs, plans, tasks, skills, MCP-related assets, agent instructions, prompt assets, and other AI artifacts MUST be treated as first-class project assets.
- AI assistance MUST accelerate delivery without bypassing architecture, testing, documentation, or security discipline.
- Human approval MUST remain the authority for constitutional changes, risky architectural changes, and production-impacting decisions.
- Prompting assets and agent guidance SHOULD be organized and documented so they can be reused safely.
- The repo MUST make room for a sustainable AI-assisted workflow using tools such as Claude Code, Copilot, and Codex, without coupling the constitution to only one vendor.

SPEC-KIT / SDD GOVERNANCE REQUIREMENTS
The constitution should strongly reinforce the Spec-Kit philosophy and future workflow:
- constitution = durable governing principles
- spec = WHAT and WHY
- plan = HOW
- tasks = executable decomposition
- implementation = execution constrained by constitution, spec, and plan

The constitution MUST explicitly discourage:
- mixing feature-level implementation details into the constitution
- mixing technical HOW decisions into product specs
- inventing details when the right action is to declare a decision gate or future ADR
- speculative architecture and future-proofing without evidence

The constitution SHOULD require:
- unresolved ambiguity to be surfaced explicitly instead of guessed
- contract-first and test-first thinking
- integration-first validation for critical paths
- explicit rationale for exceptions to core principles
- auditable compliance checks in future planning and implementation phases

NON-FUNCTIONAL BASELINES TO ESTABLISH
The constitution should define durable quality baselines around:
- security by default
- privacy by default
- accessibility by default
- reliability and recoverability
- observability and diagnosability
- performance awareness
- cost awareness
- maintainability
- simplicity
- evolvability

These should be framed as constitutional obligations, while leaving concrete numerical targets to future specs/plans when the scope is known.

OBSERVABILITY AND OPERATIONS
The constitution should require:
- structured observability as a first-class concern
- logs, metrics, and traces with correlation across user journeys and backend flows
- operational visibility for critical user actions and jam-session flows
- auditability for important business events
- clear operational ownership, runbooks, and incident learnings as the system evolves

SECURITY AND TRUST
The constitution should include durable principles such as:
- least privilege everywhere
- secure handling of authentication and authorization with AWS-native direction
- secrets never hardcoded
- encryption in transit and at rest as a default expectation
- explicit handling of personal/group/social data
- trust-preserving treatment of comments, notes, ratings, and group history
- security review expectations for changes involving identity, data access, public endpoints, or infrastructure

SOLO-BUILDER REALITY
Because this project will be built by one person with heavy AI assistance, the constitution should explicitly prefer:
- simplicity over sophistication
- managed services over self-hosting when practical
- fewer moving parts over theoretically perfect architectures
- explicit decisions over tribal knowledge
- repository clarity over cleverness
- strong defaults over endless optionality
- incremental evolution over grand upfront design

REPOSITORY / ORGANIZATIONAL EXPECTATIONS
The constitution should make it clear that the repository must sustainably support:
- frontend code
- backend code
- infrastructure-as-code
- technical documentation
- AI-development assets and conventions

You do not need to prescribe an unnecessarily rigid directory tree, but the constitution should make those concerns explicit and enforceable.

WHAT GOOD OUTPUT LOOKS LIKE
Produce a constitution that feels like the foundational law of Campfire.
It should be opinionated, durable, and suitable for long-term use.
It should be strong enough that future agents can make better decisions even when many low-level technical choices are still open.
It should read like a serious governance artifact, not like a marketing summary.

Each principle should ideally contain:
- a short principle name
- a clear non-negotiable rule set
- a brief rationale
- wording that can later be checked during planning, implementation, and review

IMPORTANT CONSTRAINTS
- Do not reduce this to generic startup boilerplate.
- Do not write a product requirements document.
- Do not write API contracts or data models in detail.
- Do not force low-level framework/service choices unless the user already made them explicit.
- Do not leave the constitution vague.
- Do not optimize for theoretical enterprise complexity; optimize for a serious, modern, AI-assisted product being built carefully by a solo maintainer.
- Use the project context above to make the constitution concrete and domain-aware.
- Make it obvious how this constitution will guide future frontend, backend, infrastructure, documentation, and AI-development decisions.