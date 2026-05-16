# CLAUDE.md

Conventions and context for AI sessions in this repository. Keep this file concise — it is read at the start of every session.

## About the project

`campfire` is a platform for amateur musicians to log personal repertoires and run jam sessions with friends. Full vision in [PRODUCT_VISION.md](./PRODUCT_VISION.md). Intended MVP flow in [docs/mvp-scope.md](./docs/mvp-scope.md).

## Current implementation status

The product vision and the intended MVP flow (accounts, repertoire CRUD, persistence) are **not yet implemented**. What exists today:

- `apps/web/` ships a single landing-page slice (`src/home/Home.tsx`) — a video-poster hero with a brand wordmark, two non-functional `entrar` / `criar conta` CTAs, and an `alpha • coming soon` footer. No routes, no forms, no client persistence, no backend calls.
- `apps/api/` is still an empty placeholder (`.gitkeep` only).
- The next implementation milestone implied by the current state is wiring the landing-page CTAs to a real account creation + sign-in flow, then unlocking the repertoire screen described in [docs/mvp-scope.md](./docs/mvp-scope.md). Treat the landing page as a visual entry point, not as the MVP itself.

## Repository layout

Monorepo:

- `apps/api/` — backend (FastAPI, Python). Empty `.gitkeep` placeholder until the first API code lands.
- `apps/web/` — frontend (React + TypeScript + Vite, per [ADR 0004](./docs/decisions/0004-frontend-stack.md)). Currently a single landing-page slice; see [apps/web/README.md](./apps/web/README.md).
- `packages/` — code shared between apps (empty until real sharing exists).
- `docs/decisions/` — ADRs.
- `.agents/skills/` — canonical location for AI agent skills shared across agents (Claude Code, Codex, etc.). Each agent surfaces them via its own expected path as a symlink. See [AI_WORKFLOW.md](./AI_WORKFLOW.md) and [docs/decisions/0003-shared-agent-skills.md](./docs/decisions/0003-shared-agent-skills.md).
- `skills-lock.json` — content-hash lockfile pinning externally-sourced skills.

Architectural decisions are formalized in [docs/decisions/](./docs/decisions/). When a structural decision is made (stack choice, design pattern, database, deploy target, etc.), create a new ADR or update an existing one.

## Engineering principles

1. **Walking skeleton first.** A real end-to-end flow runs before any architectural abstraction is introduced.
2. **Every commit runs.** If something broke, fix it before moving on.
3. **Rule of three for abstraction.** Don't introduce an interface, port, or adapter until three concrete implementations demand it. This applies especially to Clean and Hexagonal Architecture — patterns that pay dividends in large codebases but are overhead in small ones.
4. **Reactive tooling, not proactive.** Add MCPs, sub-agents, custom slash commands, and custom skills only when concrete, repeated friction justifies them. Premature tooling is the same trap as premature architecture.
5. **Document decisions, not code.** Short ADRs in `docs/decisions/`. Well-named code does not need comments explaining *what* — only *why* when non-obvious.

## Conventions (evolving)

As patterns emerge, document them here or in dedicated ADRs. Current state:

- **Backend**: Python + FastAPI. Internal structure (Clean/Hexagonal vs. flat) deferred until concrete pain justifies it.
- **Frontend**: React + TypeScript + Vite in a pnpm workspace (`@campfire/web`). No router, state library, or UI/CSS framework yet — see [ADR 0004](./docs/decisions/0004-frontend-stack.md).
- **Database**: not chosen.
- **Deploy provider**: not chosen.
- **Dates in ADRs and documents**: always absolute (YYYY-MM-DD).
- **Language (persisted artifacts)**: English for documentation, commits, code identifiers, and comments — see [docs/decisions/0002-documentation-language.md](./docs/decisions/0002-documentation-language.md).
- **Language (user-facing UI)**: not formally decided. The current landing-page slice ships Portuguese copy (`<html lang="pt-BR">`, `entrar`, `criar conta`). This predates any UI-language ADR; treat it as an implementation fact, not as a sanctioned policy, and raise the question explicitly before broadening it to new screens.

## Local development workflow

Each app under `apps/` is expected to expose a `dev/run_local.py` (or framework-equivalent) entrypoint for end-to-end debugging through the VS Code debugger. The corresponding `.vscode/launch.json` is committed to the repo. Adjacent VS Code workspace files — `.vscode/extensions.json` (recommended extensions) and `.vscode/tasks.json` (shared task runners) — are also committed when they exist; the gitignore whitelists all three.

Both `dev/run_local.py` and `.vscode/launch.json` materialize in the same commit as the first runnable code for the app — they are not pre-created.

## AI workflow

How AI is integrated into this project — categories of tooling, principles for adoption, and the active inventory of tools and skills — is documented in [AI_WORKFLOW.md](./AI_WORKFLOW.md).

## What to avoid

- Don't create `pyproject.toml`, `package.json`, CI configuration, or Docker files until there is code that justifies them.
- Don't preemptively author slash commands, sub-agents, or custom skills in this repo. Externally-sourced skills pinned via `skills-lock.json` are allowed when they solve a concrete, repeated friction — see [AI_WORKFLOW.md](./AI_WORKFLOW.md).
- Don't introduce abstraction (interface, factory, repository pattern) without three concrete use cases.
- Don't write comments that describe *what* the code does — only *why* when non-obvious.
- Don't make foundational decisions (database, deploy provider, frontend framework, architectural pattern) without recording them in an ADR.
