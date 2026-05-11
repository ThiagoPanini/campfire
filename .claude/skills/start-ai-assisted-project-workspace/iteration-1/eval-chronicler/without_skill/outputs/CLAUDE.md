# CLAUDE.md

Conventions and context for AI sessions in this repository. Keep this file concise — it is read at the start of every session.

## About the project

`campaign-chronicler` is a collaborative tool for tabletop RPG (initially D&D) groups. During a campaign, each player logs their character's actions session by session. At the end of the campaign, the system stitches those entries into a generated long-form "lore document" that reads like an in-world chronicle.

The group is remote, so a web app is the target client. Stack is intentionally not yet chosen — see [docs/decisions/](./docs/decisions/).

## Repository layout

Monorepo:

- `apps/` — runnable applications (e.g. `apps/web/`, `apps/api/`) — created when the first runnable code lands
- `packages/` — code shared between apps (empty until real sharing exists)
- `docs/decisions/` — ADRs

Architectural decisions are formalized in [docs/decisions/](./docs/decisions/). When a structural decision is made (stack choice, design pattern, database, deploy target, etc.), create a new ADR or update an existing one.

## Engineering principles

1. **Walking skeleton first.** A real end-to-end flow runs before any architectural abstraction is introduced.
2. **Every commit runs.** If something broke, fix it before moving on.
3. **Rule of three for abstraction.** Don't introduce an interface, port, or adapter until three concrete implementations demand it.
4. **Reactive tooling, not proactive.** Add MCPs, sub-agents, custom slash commands, and skills only when concrete, repeated friction justifies them.
5. **Document decisions, not code.** Short ADRs in `docs/decisions/`. Well-named code does not need comments explaining *what* — only *why* when non-obvious.

## Conventions (evolving)

- **Stack**: not chosen — pending ADR.
- **Database**: not chosen — pending ADR.
- **Deploy provider**: not chosen — pending ADR.
- **Dates in ADRs and documents**: always absolute (YYYY-MM-DD).
- **Language**: English for documentation, commits, code identifiers, and comments.

## Local development workflow

Each app under `apps/` is expected to expose a clear local entrypoint (e.g. `dev/run_local.py` for a Python service, `npm run dev` for a Node app) for end-to-end debugging. A `.vscode/launch.json` is committed alongside the first runnable code — not before.

## What to avoid

- Don't create `pyproject.toml`, `package.json`, CI configuration, or Docker files until there is code that justifies them.
- Don't preemptively create slash commands, sub-agents, or custom skills.
- Don't introduce abstraction (interface, factory, repository pattern) without three concrete use cases.
- Don't write comments that describe *what* the code does — only *why* when non-obvious.
- Don't make foundational decisions (stack, database, deploy provider) without recording them in an ADR.
