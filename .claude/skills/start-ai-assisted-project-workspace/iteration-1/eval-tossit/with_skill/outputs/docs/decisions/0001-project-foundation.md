# 0001 — Initial repository foundation

- **Status**: Accepted
- **Date**: 2026-05-11

## Context

New project: `tossit`, a Go CLI wrapper around git that adds a `git tossit` command — stashing dirty changes, committing them with a generated WIP message, and pushing them to a personal junk branch for later recovery. The artifact is a single binary; there are no separate backend / frontend components anticipated. This ADR records the foundational decisions made when bootstrapping the repository.

## Decision

### Repository structure

Single-app repository — `tossit` ships as one Go binary at the root. No `apps/` or `packages/` layer; an `apps/`-style monorepo split would be overhead without a second deployable to justify it (rule of three applied to repository topology itself).

```
tossit/
└── docs/
    └── decisions/  # ADRs
```

- `docs/decisions/` formalizes architectural choices as short ADRs.
- Foundational documents (`PRODUCT_VISION.md`, `README.md`, `CLAUDE.md`, `AI_WORKFLOW.md`, `AGENTS.md`) live at the root for immediate visibility. Tool-specific instruction files that follow other conventions (e.g., `.github/copilot-instructions.md` for GitHub Copilot) live in their canonical locations.

### Language / runtime

Go, distributed as a single binary. This is the only stack decision committed at bootstrap — chosen because the project description explicitly names it and because a single static binary is the natural shape for a git subcommand.

### Configuration files

Go module configuration (`go.mod`, `go.sum`) is NOT created in this ADR — it lands with the first runnable code, not the foundation.

## Consequences

**Positive**:

- Minimal cognitive overhead — one binary, one root, no inter-app coordination.
- AI sessions navigate the whole project from the root with no monorepo-aware tooling required.
- Easy to revisit: if a second deployable ever appears, promoting to a monorepo is a recorded ADR away.

**Negative**:

- If a second deployable later joins (e.g., a companion web dashboard), a structural migration to `apps/` will be required.

## Not yet decided

Items explicitly deferred to future ADRs, when concrete pain or a use case justifies them:

- License (currently unspecified — code defaults to "all rights reserved").
- Command-parsing approach (stdlib `flag` vs. `cobra`/`urfave-cli` — decided when the first non-trivial command surface emerges).
- Internal structure (flat single-package vs. `cmd/` + `internal/` split — decided when pain justifies).
- Distribution channel (`go install`, GitHub releases, Homebrew, etc.).
- Testing strategy (unit, integration, e2e against a sandbox git repo).
- CI/CD.
