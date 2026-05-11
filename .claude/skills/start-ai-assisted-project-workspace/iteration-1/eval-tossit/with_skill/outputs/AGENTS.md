# AGENTS.md

This file is read by AI agents that follow the AGENTS.md convention (e.g., OpenAI Codex). The canonical, more detailed project instructions live in [CLAUDE.md](./CLAUDE.md).

## Project

`tossit` is a Go CLI wrapper around git that adds a `git tossit` command — stashes all dirty changes, commits them with a generated WIP message, and pushes to a personal junk branch for later recovery. Full vision: [PRODUCT_VISION.md](./PRODUCT_VISION.md). MVP scope: [docs/mvp-scope.md](./docs/mvp-scope.md).

## Repository layout

Single-app repository — `tossit` ships as a single Go binary at the root.

- `docs/decisions/` — ADRs (architectural decision records).

## Engineering principles

1. **Walking skeleton first** — end-to-end flow before any architectural abstraction.
2. **Every commit runs.**
3. **Rule of three for abstraction** — no interface, port, or adapter without three concrete implementations demanding it.
4. **Reactive tooling** — add MCPs, sub-agents, slash commands, and skills only when concrete repeated friction justifies them.
5. **Document decisions, not code** — short ADRs in `docs/decisions/`.

## Language

All persisted artifacts (docs, commits, code identifiers, comments) are written in **English**.

## What to avoid

- No `go.mod`, `go.sum`, CI, or Docker until code requires them.
- No preemptive slash commands, sub-agents, or custom skills.
- No abstraction without three concrete use cases.
- No comments describing *what* — only *why* when non-obvious.
- No foundational decisions (deploy/distribution channel, internal architecture, command-parsing library) without an ADR.

For detail beyond this summary, see [CLAUDE.md](./CLAUDE.md) and [AI_WORKFLOW.md](./AI_WORKFLOW.md).
