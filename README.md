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
│   ├── api/        # backend (FastAPI, Python)
│   └── web/        # frontend (stack TBD)
├── packages/       # code shared between apps
└── docs/
    └── decisions/  # ADRs (Architecture Decision Records)
```

## Status

Early-stage development — monorepo foundation. Decision history in [docs/decisions/](./docs/decisions/).
