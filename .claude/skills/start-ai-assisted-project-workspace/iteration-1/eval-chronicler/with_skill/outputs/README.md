# campaign-chronicler

A tool for D&D groups to log each player's per-session character actions and generate a chronicle-style lore document at the end of the campaign.

- **Product vision**: [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- **MVP scope**: [docs/mvp-scope.md](./docs/mvp-scope.md)
- **AI session conventions**: [CLAUDE.md](./CLAUDE.md)
- **AI workflow and tooling**: [AI_WORKFLOW.md](./AI_WORKFLOW.md)
- **Agent-specific instruction files**: [AGENTS.md](./AGENTS.md) (Codex), [.github/copilot-instructions.md](./.github/copilot-instructions.md) (GitHub Copilot)

## Repository layout

```
campaign-chronicler/
├── apps/
│   ├── api/        # backend (stack TBD)
│   └── web/        # frontend (stack TBD)
├── packages/       # code shared between apps
└── docs/
    └── decisions/  # ADRs (Architecture Decision Records)
```

## Status

Early-stage development — repository foundation. Decision history in [docs/decisions/](./docs/decisions/).
