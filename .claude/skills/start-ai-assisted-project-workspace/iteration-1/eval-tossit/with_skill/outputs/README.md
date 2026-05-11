# tossit

A Go CLI wrapper around git that adds a `git tossit` command — stashes all dirty changes, commits them with a generated WIP message, and pushes to a personal junk branch for later recovery.

- **Product vision**: [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- **MVP scope**: [docs/mvp-scope.md](./docs/mvp-scope.md)
- **AI session conventions**: [CLAUDE.md](./CLAUDE.md)
- **AI workflow and tooling**: [AI_WORKFLOW.md](./AI_WORKFLOW.md)
- **Agent-specific instruction files**: [AGENTS.md](./AGENTS.md) (Codex), [.github/copilot-instructions.md](./.github/copilot-instructions.md) (GitHub Copilot)

## Repository layout

```
tossit/
└── docs/
    └── decisions/  # ADRs (Architecture Decision Records)
```

Single-app repository — `tossit` ships as a single Go binary at the root.

## Status

Early-stage development — repository foundation. Decision history in [docs/decisions/](./docs/decisions/).
