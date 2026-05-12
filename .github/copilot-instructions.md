# Copilot instructions

These instructions are read by GitHub Copilot for repository custom instructions. The canonical, more detailed project instructions live in [../CLAUDE.md](../CLAUDE.md).

## Project

`campfire` is a platform for amateur musicians to log personal repertoires and run jam sessions with friends. Full vision: [../PRODUCT_VISION.md](../PRODUCT_VISION.md). MVP scope: [../docs/mvp-scope.md](../docs/mvp-scope.md).

## Repository layout

- `apps/api/` — backend (FastAPI, Python).
- `apps/web/` — frontend (stack TBD).
- `packages/` — code shared between apps (empty until real sharing exists).
- `docs/decisions/` — ADRs (architectural decision records).
- `.agents/skills/` — canonical location for AI agent skills shared across agents. See [../AI_WORKFLOW.md](../AI_WORKFLOW.md) and [../docs/decisions/0003-shared-agent-skills.md](../docs/decisions/0003-shared-agent-skills.md).
- `skills-lock.json` — content-hash lockfile pinning externally-sourced skills.

## Engineering principles

1. **Walking skeleton first** — end-to-end flow before any architectural abstraction.
2. **Every commit runs.**
3. **Rule of three for abstraction** — no interface, port, or adapter without three concrete implementations demanding it.
4. **Reactive tooling** — add MCPs, sub-agents, slash commands, and skills only when concrete repeated friction justifies them.
5. **Document decisions, not code** — short ADRs in `docs/decisions/`.

## Language

All persisted artifacts (docs, commits, code identifiers, comments) are written in **English**. See [../docs/decisions/0002-documentation-language.md](../docs/decisions/0002-documentation-language.md).

## What to avoid

- No `pyproject.toml`, `package.json`, CI, or Docker until code requires them.
- No preemptively authored slash commands, sub-agents, or custom skills. Externally-sourced skills pinned in `skills-lock.json` are allowed.
- No abstraction without three concrete use cases.
- No comments describing *what* — only *why* when non-obvious.
- No foundational decisions (database, deploy provider, frontend framework, architectural pattern) without an ADR.

For detail beyond this summary, see [../CLAUDE.md](../CLAUDE.md) and [../AI_WORKFLOW.md](../AI_WORKFLOW.md).
