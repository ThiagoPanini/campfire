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

Early-stage development. The foundation — product vision, MVP scope, monorepo skeleton, and the AI-collaboration documents — is in place. The next milestone is the walking skeleton: a deployed instance where a real human can complete the end-to-end flow described in [docs/mvp-scope.md](./docs/mvp-scope.md). Decision history lives in [docs/decisions/](./docs/decisions/).

## License

Not yet decided — the code defaults to "all rights reserved" until an explicit license is chosen. The deferral is recorded in [docs/decisions/0001-monorepo-structure.md](./docs/decisions/0001-monorepo-structure.md).
