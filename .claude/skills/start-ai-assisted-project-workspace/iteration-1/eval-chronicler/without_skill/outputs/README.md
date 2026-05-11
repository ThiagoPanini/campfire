# campaign-chronicler

A collaborative chronicle tool for tabletop RPG campaigns. Players log their character's actions per session; at the end of the campaign, the system generates a long-form "lore document" that reads like an in-world chronicle.

## Status

Day-zero scaffold. No stack chosen yet. See [docs/decisions/](./docs/decisions/) for architectural decisions and [docs/mvp-scope.md](./docs/mvp-scope.md) for what counts as a first working version.

## Repository layout

```
campaign-chronicler/
├── apps/          # runnable applications (web, api, ...)
├── packages/      # shared code between apps (empty until real sharing exists)
└── docs/
    └── decisions/ # ADRs
```

## Working with AI

This repository is set up for AI-assisted development from day one. See:

- [CLAUDE.md](./CLAUDE.md) — conventions and context for Claude sessions
- [AGENTS.md](./AGENTS.md) — conventions for other coding agents
- [AI_WORKFLOW.md](./AI_WORKFLOW.md) — how AI tools fit into this project
