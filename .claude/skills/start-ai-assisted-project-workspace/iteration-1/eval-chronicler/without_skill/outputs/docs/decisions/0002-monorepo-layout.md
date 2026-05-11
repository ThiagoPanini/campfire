# 2. Monorepo layout

- **Status**: Accepted
- **Date**: 2026-05-11

## Context

The product needs at minimum a web frontend (the group is remote) and, almost certainly, a backend service to store entries and generate the end-of-campaign chronicle. There may eventually be shared code between them (types, validation schemas, prompt templates).

Two reasonable shapes exist: split repos, or a single monorepo.

## Decision

Single monorepo. Top-level layout:

```
campaign-chronicler/
├── apps/
│   ├── web/          # created with the first runnable frontend
│   └── <service>/    # created with the first runnable backend
├── packages/         # shared code, only when real sharing exists
└── docs/
    └── decisions/    # ADRs
```

Rules:

- `apps/<name>/` is added only when there is real, runnable code for that app.
- `packages/` stays empty until at least two apps demonstrably need the same code. No speculative `packages/shared/`.
- Each app under `apps/` owns its own toolchain (lockfile, runner, scripts). The monorepo does not impose a build system yet.

## Consequences

- One PR can change frontend, backend, and a shared schema atomically. This is the main reason to do it.
- No premature monorepo tooling (Turborepo, Nx, pnpm workspaces, etc.) is adopted. If a tool becomes necessary later, that is a new ADR.
- The cost is a slightly larger repo and a slightly more cautious `.gitignore`. Both are acceptable.
