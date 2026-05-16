# campfire

A platform for amateur musicians to log personal repertoires and run jam sessions with friends.

- **Product vision**: [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- **MVP scope**: [docs/mvp-scope.md](./docs/mvp-scope.md)
- **AI session conventions**: [CLAUDE.md](./CLAUDE.md)
- **AI workflow and tooling**: [AI_WORKFLOW.md](./AI_WORKFLOW.md)
- **Agent-specific instruction files**: [AGENTS.md](./AGENTS.md) (Codex), [.github/copilot-instructions.md](./.github/copilot-instructions.md) (GitHub Copilot)

## Repository layout

```
campfire/
├── apps/
│   ├── api/        # backend (FastAPI, Python) — empty placeholder
│   └── web/        # frontend (React + TypeScript + Vite) — landing-page slice only
├── packages/       # code shared between apps
└── docs/
    └── decisions/  # ADRs (Architecture Decision Records)
```

## Status

Early-stage development. The foundation (product vision, intended MVP flow, monorepo skeleton, AI-collaboration documents) and the frontend tooling decision ([ADR 0004](./docs/decisions/0004-frontend-stack.md)) are in place. The only runnable code today is a **landing-page slice** in `apps/web/` — a video-poster hero with non-functional `entrar` / `criar conta` CTAs — used to explore visual direction on the `mvp/lofi-style` branch. The MVP end-to-end flow described in [docs/mvp-scope.md](./docs/mvp-scope.md) (accounts, repertoire CRUD, persistence, deploy) has not been built yet. Decision history lives in [docs/decisions/](./docs/decisions/).

## License

Not yet decided — the code defaults to "all rights reserved" until an explicit license is chosen. The deferral is recorded in [docs/decisions/0001-monorepo-structure.md](./docs/decisions/0001-monorepo-structure.md).
