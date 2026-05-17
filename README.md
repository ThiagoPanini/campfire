# campfire

A platform for amateur musicians to log personal repertoires and run jam sessions with friends.

- **Product vision**: [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- **MVP scope**: [docs/mvp-scope.md](./docs/mvp-scope.md)
- **Design system**: [DESIGN.md](./DESIGN.md)
- **AI session conventions**: [CLAUDE.md](./CLAUDE.md)
- **AI workflow and tooling**: [AI_WORKFLOW.md](./AI_WORKFLOW.md)
- **Agent-specific instruction files**: [AGENTS.md](./AGENTS.md) (Codex), [.github/copilot-instructions.md](./.github/copilot-instructions.md) (GitHub Copilot)

## Repository layout

```
campfire/
├── apps/
│   ├── api/        # backend (FastAPI, Python) — empty placeholder
│   └── web/        # frontend (React + TypeScript + Vite + react-router)
├── packages/       # code shared between apps
└── docs/
    └── decisions/  # ADRs (Architecture Decision Records)
```

## Status

Early-stage development. Active work happens on `mvp/lofi-style`. The front-end covers the **pre-auth shape** only: a video-poster landing (`/`) plus modal overlays for `/signup`, `/signup/confirm`, and `/signin`, all driving a stubbed in-browser auth client (`apps/web/src/auth/client.ts`). A successful flow lands on an `/app` placeholder. There is no backend, no real session, and no persistence yet — `apps/api/` is still a `.gitkeep`. The MVP end-to-end flow described in [docs/mvp-scope.md](./docs/mvp-scope.md) (accounts, repertoire CRUD, persistence, deploy) is the next milestone. Architectural decisions live in [docs/decisions/](./docs/decisions/); the visual system lives in [DESIGN.md](./DESIGN.md).

## License

Not yet decided — the code defaults to "all rights reserved" until an explicit license is chosen. The deferral is recorded in [docs/decisions/0001-monorepo-structure.md](./docs/decisions/0001-monorepo-structure.md).
