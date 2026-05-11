# 0001 — Initial repository foundation

- **Status**: Accepted
- **Date**: 2026-05-11

## Context

New project with multiple components anticipated (a web app for remote D&D groups implies at least a frontend and a backend that persists session logs and generates the chronicle document). There is a need to iterate quickly across all sides without coordination overhead between separate repositories. This ADR records the foundational decisions made when bootstrapping the repository.

## Decision

### Repository structure

Single monorepo with the following structure:

```
campaign-chronicler/
├── apps/
│   ├── api/        # backend (stack TBD)
│   └── web/        # frontend (stack TBD)
├── packages/       # code shared between apps
└── docs/
    └── decisions/  # ADRs
```

- `apps/` contains independently deployable applications.
- `packages/` stays empty until real code sharing exists (rule of three: only promoted to a package when three or more places need it).
- `docs/decisions/` formalizes architectural choices as short ADRs.
- Foundational documents (`PRODUCT_VISION.md`, `README.md`, `CLAUDE.md`, `AI_WORKFLOW.md`, `AGENTS.md`) live at the root for immediate visibility. Tool-specific instruction files that follow other conventions (e.g., `.github/copilot-instructions.md` for GitHub Copilot) live in their canonical locations.

### Configuration files

Package-manager configuration files (e.g., `pyproject.toml`, `package.json`) are NOT created in this ADR — only when each app's first code requires them. The empty `apps/<name>/.gitkeep` files exist solely to communicate intent.

## Consequences

**Positive**:

- Cross-component refactor (e.g., a type shared between API and web) without coordinated PRs across multiple repositories.
- Unified history.
- AI sessions can navigate the entire project without context-switching between repositories.

**Negative**:

- Lower permission granularity (everyone sees everything).
- CI will need to handle multiple toolchains once it exists.

## Not yet decided

Items explicitly deferred to future ADRs, when concrete pain or a use case justifies them:

- License (currently unspecified — code defaults to "all rights reserved").
- Frontend stack.
- Backend stack.
- Database.
- Deploy provider.
- Internal structure of each app (Clean/Hexagonal/flat — decided per-app when pain justifies).
- Testing strategy (unit, integration, e2e).
- CI/CD.
- Package managers (decided when first code lands per app).
