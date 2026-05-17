# 0001 — Initial monorepo structure

- **Status**: Accepted
- **Date**: 2026-05-10

## Context

Solo project with three main components anticipated: backend (Python/FastAPI), frontend (stack TBD), and documentation. There is a need to iterate quickly across both sides without coordination overhead between separate repositories.

## Decision

Single monorepo with the following structure:

```
campfire/
├── apps/
│   ├── api/        # backend (FastAPI)
│   └── web/        # frontend
├── packages/       # code shared between apps
└── docs/
    └── decisions/  # ADRs
```

- `apps/` contains independently deployable applications.
- `packages/` stays empty until real code sharing exists (rule of three: only promoted to a package when three or more places need it).
- `docs/decisions/` formalizes architectural choices as short ADRs.
- Foundational documents (`PRODUCT_VISION.md`, `README.md`, `CLAUDE.md`, `AI_WORKFLOW.md`, `AGENTS.md`) live at the root for immediate visibility. Tool-specific instruction files that follow other conventions (e.g., `.github/copilot-instructions.md` for GitHub Copilot) live in their canonical locations.

### Package managers

- **Python**: `uv` — native workspaces, deterministic lockfile, current ecosystem standard.
- **JavaScript/TypeScript**: `pnpm` workspaces — simple and solid, without the orchestration overhead of Nx/Turborepo (to be reconsidered only if build cache becomes a real bottleneck).

Each manager's configuration files (`pyproject.toml`, `package.json`) are **not created in this ADR** — only when each app's first code requires them.

## Consequences

**Positive**:

- Cross-component refactor (e.g., a type shared between API and web) without coordinated PRs across multiple repositories.
- Unified history.
- AI sessions can navigate the entire project without context-switching between repositories.

**Negative**:

- Lower permission granularity (everyone sees everything).
- CI will need to handle multiple toolchains (Python + Node) once it exists.

## Not yet decided

Items explicitly deferred to future ADRs, when concrete pain or a use case justifies them:

- License (currently unspecified — code defaults to "all rights reserved").
- Database.
- Deploy provider.
- Internal structure of `apps/api/` (Clean/Hexagonal vs. flat).
- Testing strategy (unit, integration, e2e).
- CI/CD.

Resolved since this ADR was written: frontend stack ([ADR 0004](./0004-frontend-stack.md)), frontend routing ([ADR 0006](./0006-frontend-routing.md)), documentation language ([ADR 0002](./0002-documentation-language.md)), UI language ([ADR 0005](./0005-ui-language.md)), shared-agent-skills pattern ([ADR 0003](./0003-shared-agent-skills.md)).
