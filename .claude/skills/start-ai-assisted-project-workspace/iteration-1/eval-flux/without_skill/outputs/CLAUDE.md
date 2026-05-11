# CLAUDE.md

Conventions and context for AI sessions in this repository. Keep this file concise — it is read at the start of every session.

## About the project

`flux` is a Pomodoro-style focus timer that logs what you worked on per session and produces a heatmap of where your time actually goes vs where you thought it went. Full vision in [PRODUCT_VISION.md](./PRODUCT_VISION.md).

## Repository layout

Monorepo:

- `apps/api/` — backend (FastAPI, Python)
- `apps/web/` — frontend (stack TBD)
- `packages/` — code shared between apps (empty until real sharing exists)
- `docs/decisions/` — ADRs

Architectural decisions are formalized in [docs/decisions/](./docs/decisions/). When a structural decision is made (stack choice, design pattern, database, deploy target, etc.), create a new ADR or update an existing one.

## Engineering principles

1. **Walking skeleton first.** A real end-to-end flow (start session → tag it → see it on the heatmap) runs before any architectural abstraction is introduced.
2. **Every commit runs.** If something broke, fix it before moving on.
3. **Rule of three for abstraction.** Don't introduce an interface, port, or adapter until three concrete implementations demand it. Clean/Hexagonal patterns pay dividends in large codebases but are overhead here.
4. **Reactive tooling, not proactive.** Add MCPs, sub-agents, custom slash commands, and custom skills only when concrete repeated friction justifies them.
5. **Document decisions, not code.** Short ADRs in `docs/decisions/`. Well-named code does not need comments explaining *what* — only *why* when non-obvious.
6. **The timer is sacred.** Anything that touches the timer loop gets extra scrutiny. A focus tool the user doesn't trust during a session is worse than no tool.

## Conventions (evolving)

As patterns emerge, document them here or in dedicated ADRs. Current state:

- **Backend**: Python + FastAPI. Internal structure (Clean/Hexagonal vs. flat) deferred until concrete pain justifies it. See [docs/decisions/0003-backend-fastapi.md](./docs/decisions/0003-backend-fastapi.md).
- **Frontend**: stack not chosen.
- **Database**: not chosen.
- **Deploy provider**: not chosen.
- **Dates in ADRs and documents**: always absolute (YYYY-MM-DD).
- **Language**: English for documentation, commits, code identifiers, and comments.

## Local development workflow

Each app under `apps/` is expected to expose a `dev/run_local.py` (or framework-equivalent) entrypoint for end-to-end debugging through the VS Code debugger. The corresponding `.vscode/launch.json` configuration is committed to the repo.

Both materialize in the same commit as the first runnable code for the app — they are not pre-created.

## AI workflow

How AI is integrated into this project is documented in [AI_WORKFLOW.md](./AI_WORKFLOW.md).

## What to avoid

- Don't create `pyproject.toml`, `package.json`, CI configuration, or Docker files until there is code that justifies them.
- Don't preemptively create slash commands, sub-agents, or custom skills.
- Don't introduce abstraction (interface, factory, repository pattern) without three concrete use cases.
- Don't write comments that describe *what* the code does — only *why* when non-obvious.
- Don't make foundational decisions (database, deploy provider, frontend framework, architectural pattern) without recording them in an ADR.
