# AGENTS.md

This file is read by AI agents that follow the AGENTS.md convention (e.g., OpenAI Codex). The canonical, more detailed project instructions live in [CLAUDE.md](./CLAUDE.md).

## Project

`campfire` is a platform for amateur musicians to log personal repertoires and run jam sessions with friends. Product north star: [PRODUCT_VISION.md](./PRODUCT_VISION.md). MVP scope: [docs/mvp-scope.md](./docs/mvp-scope.md). Visual/product design: [DESIGN.md](./DESIGN.md).

## Current implementation status

The MVP walking skeleton (accounts, repertoire CRUD, persistence, deploy) is **not yet implemented end-to-end**. The front-end on `mvp/lofi-style` covers the pre-auth shape against a stubbed client:

- `apps/web/` — React + TypeScript + Vite + `react-router-dom`. Routes: `/` (`Home` poster), `/signup`, `/signup/confirm`, `/signin` (modal overlays on `Home`), `/app` (placeholder).
- `apps/web/src/auth/client.ts` is a **stub** with `sleep()`-based fakes for sign-up, sign-in, OTP verify/resend, and Google OAuth. No backend, no persistence, no session.
- `apps/api/` is an empty `.gitkeep` placeholder.
- UI primitives in `apps/web/src/ui/` (Button, Field, Modal, CodeBoxes, StrengthMeter, …) are the reference for new surfaces.

Do not assume any real account, repertoire, or persistence code exists.

## Repository layout

- `apps/api/` — backend (FastAPI, Python). Empty `.gitkeep` placeholder.
- `apps/web/` — frontend (React + TypeScript + Vite + react-router-dom per [ADR 0004](./docs/decisions/0004-frontend-stack.md) and [ADR 0006](./docs/decisions/0006-frontend-routing.md)).
- `packages/` — code shared between apps (empty until real sharing exists).
- `docs/decisions/` — ADRs (architectural decision records).
- `.agents/skills/` — canonical location for AI agent skills shared across agents. See [AI_WORKFLOW.md](./AI_WORKFLOW.md) and [docs/decisions/0003-shared-agent-skills.md](./docs/decisions/0003-shared-agent-skills.md).
- `skills-lock.json` — content-hash lockfile pinning externally-sourced skills.

## Engineering principles

1. **Walking skeleton first** — end-to-end flow before any architectural abstraction.
2. **Every commit runs.**
3. **Rule of three for abstraction** — no interface, port, or adapter without three concrete implementations demanding it.
4. **Reactive tooling** — add MCPs, sub-agents, slash commands, and skills only when concrete repeated friction justifies them.
5. **Document decisions, not code** — short ADRs in `docs/decisions/`.

## Language

All persisted artifacts (docs, commits, code identifiers, comments) are written in **English** ([ADR 0002](./docs/decisions/0002-documentation-language.md)). User-facing UI strings ship in **Brazilian Portuguese** ([ADR 0005](./docs/decisions/0005-ui-language.md)) — copy is inline in components, no i18n framework.

## What to avoid

- No `pyproject.toml`, `package.json`, CI, or Docker until code requires them.
- No preemptively authored slash commands, sub-agents, or custom skills. Externally-sourced skills pinned in `skills-lock.json` are allowed.
- No abstraction without three concrete use cases.
- No comments describing *what* — only *why* when non-obvious.
- No foundational decisions (database, deploy provider, frontend framework, architectural pattern) without an ADR.

For detail beyond this summary, see [CLAUDE.md](./CLAUDE.md) and [AI_WORKFLOW.md](./AI_WORKFLOW.md).
