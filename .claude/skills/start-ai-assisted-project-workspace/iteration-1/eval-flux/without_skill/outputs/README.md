# flux

A Pomodoro timer that logs what you actually worked on during each focused session and produces a heatmap over time — showing where your time really goes versus where you thought it went.

## Status

Early bootstrap. No runnable code yet.

## Repository layout

```
flux/
├── apps/
│   ├── api/    # FastAPI backend
│   └── web/    # Frontend (stack TBD)
├── packages/   # Shared code between apps (empty until real sharing exists)
└── docs/
    └── decisions/  # ADRs
```

## Getting started

Not yet runnable. The walking skeleton (a real end-to-end timer → log → heatmap flow) is the first milestone — see [docs/roadmap.md](./docs/roadmap.md).

## Documentation

- [PRODUCT_VISION.md](./PRODUCT_VISION.md) — what flux is and why
- [CLAUDE.md](./CLAUDE.md) — conventions for AI-assisted sessions
- [AGENTS.md](./AGENTS.md) — conventions for human and AI contributors
- [AI_WORKFLOW.md](./AI_WORKFLOW.md) — how AI is integrated into this project
- [docs/decisions/](./docs/decisions/) — architectural decisions
