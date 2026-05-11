# 0001 — Initial repository foundation

- **Status**: Accepted
- **Date**: 2026-05-11

## Context

New project with multiple components anticipated (backend API and a web frontend). There is a need to iterate quickly across all sides without coordination overhead between separate repositories. This ADR records the foundational decisions made when bootstrapping the repository.

## Decision

### Repository structure

Single monorepo with the following structure:

```
flux/
├── apps/
│   ├── api/        # backend (FastAPI, Python)
│   └── web/        # frontend (stack TBD)
├── packages/       # code shared between apps
└── docs/
    └── decisions/  # ADRs
```

- `apps/` contains independently deployable applications.
- `packages/` stays empty until real code sharing exists (rule of three: only promoted to a package when three or more places need it).
- `docs/decisions/` formalizes architectural choices as short ADRs.
- Foundational documents (`PRODUCT_VISION.md`, `README.md`, `CLAUDE.md`, `AI_WORKFLOW.md`, `AGENTS.md`) live at the root for immediate visibility. Tool-specific instruction files that follow other conventions (e.g., `.github/copilot-instructions.md` for GitHub Copilot) live in their canonical locations.

### Backend stack

The backend (`apps/api/`) will be built with **FastAPI** on Python. This is a load-bearing decision recorded here because it was made up-front by the author based on prior experience and preference. Internal structure of `apps/api/` (Clean/Hexagonal vs. flat layout) is NOT decided in this ADR — it will be chosen per the rule-of-three principle when concrete pain justifies it.

### Configuration files

Package-manager configuration files (e.g., `pyproject.toml`, `package.json`) are NOT created in this ADR — only when each app's first code requires them. The empty `apps/<name>/.gitkeep` files exist solely to communicate intent.

### Documentation language

All persisted artifacts in this repository are written in English. This choice is summarized in `CLAUDE.md` and not promoted to a dedicated ADR (the choice aligns with the broader ecosystem and is unlikely to need a separate revisitation).

### Multi-agent setup

The repository is structured to be readable by Claude Code (primary), OpenAI Codex (`AGENTS.md`), and GitHub Copilot (`.github/copilot-instructions.md`). `CLAUDE.md` is the canonical instruction file; the other two carry a condensed mirror.

## Consequences

**Positive**:

- Cross-component refactor (e.g., a type shared between API and web) without coordinated PRs across multiple repositories.
- Unified history.
- AI sessions can navigate the entire project without context-switching between repositories.
- Up-front backend choice removes a recurring source of decision-fatigue during the walking skeleton phase.

**Negative**:

- Lower permission granularity (everyone sees everything).
- CI will need to handle multiple toolchains once it exists.

## Not yet decided

Items explicitly deferred to future ADRs, when concrete pain or a use case justifies them:

- License (currently unspecified — code defaults to "all rights reserved").
- Frontend stack.
- Database.
- Deploy provider.
- Internal structure of each app (Clean/Hexagonal/flat — decided per-app when pain justifies).
- Testing strategy (unit, integration, e2e).
- CI/CD.
- Package managers (decided when first code lands per app).
