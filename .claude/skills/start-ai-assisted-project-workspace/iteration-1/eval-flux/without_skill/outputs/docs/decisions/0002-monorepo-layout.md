# 2. Monorepo layout

Date: 2026-05-11

## Status

Accepted

## Context

flux has two deployable units from day one: a FastAPI backend and a web frontend. They will share some concepts (session shape, tag shape) and might eventually share code (generated API types, validation schemas).

Two organizational options:

1. **Two repos**, linked via package publication or git submodules.
2. **One monorepo** with `apps/` and `packages/` subdirectories.

## Decision

Single monorepo. Layout:

```
apps/
  api/    # FastAPI backend
  web/    # Frontend
packages/   # Shared code, empty until real sharing exists
docs/
  decisions/  # ADRs
```

`packages/` stays empty until we have a concrete piece of code that is genuinely shared between `apps/api` and `apps/web` — at least one real consumer on each side. The rule of three applies, weighted: even one cross-app duplication is enough to justify a shared package; less than that is premature.

## Consequences

- One git history, one set of CI configuration when it lands, one issue tracker.
- Changes that span backend and frontend can be made in a single commit.
- We avoid the dependency-publishing dance that two repos would force.
- We accept that monorepos can become unwieldy at scale; we are nowhere near that scale and may never be.
- Tooling (build, test, lint) will need to be monorepo-aware when it lands. That cost is paid lazily — not now.
