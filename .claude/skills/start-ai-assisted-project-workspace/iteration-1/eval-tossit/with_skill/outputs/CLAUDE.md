# CLAUDE.md

Conventions and context for AI sessions in this repository. Keep this file concise — it is read at the start of every session.

## About the project

`tossit` is a Go CLI wrapper around git that adds a `git tossit` command — stashes all dirty changes, commits them with a generated WIP message, and pushes to a personal junk branch for later recovery. Full vision in [PRODUCT_VISION.md](./PRODUCT_VISION.md). Current MVP scope in [docs/mvp-scope.md](./docs/mvp-scope.md).

## Repository layout

Single-app repository — `tossit` ships as a single Go binary at the root.

- `docs/decisions/` — ADRs

Architectural decisions are formalized in [docs/decisions/](./docs/decisions/). When a structural decision is made (stack choice, design pattern, database, deploy target, etc.), create a new ADR or update an existing one.

## Engineering principles

1. **Walking skeleton first.** A real end-to-end flow runs before any architectural abstraction is introduced.
2. **Every commit runs.** If something broke, fix it before moving on.
3. **Rule of three for abstraction.** Don't introduce an interface, port, or adapter until three concrete implementations demand it. This applies especially to Clean and Hexagonal Architecture — patterns that pay dividends in large codebases but are overhead in small ones.
4. **Reactive tooling, not proactive.** Add MCPs, sub-agents, custom slash commands, and custom skills only when concrete, repeated friction justifies them. Premature tooling is the same trap as premature architecture.
5. **Document decisions, not code.** Short ADRs in `docs/decisions/`. Well-named code does not need comments explaining *what* — only *why* when non-obvious.

## Conventions (evolving)

As patterns emerge, document them here or in dedicated ADRs. Current state:

- **Language / runtime**: Go (single binary).
- **Internal structure**: flat until concrete pain justifies otherwise.
- **Distribution**: TBD (likely `go install` initially; release tarballs / package managers deferred).
- **Dates in ADRs and documents**: always absolute (YYYY-MM-DD).
- **Language**: English for documentation, commits, code identifiers, and comments.

## Local development workflow

The app is expected to expose a debuggable entrypoint (`main.go` plus a VS Code `launch.json` configuration for end-to-end debugging through the IDE debugger). Both materialize in the same commit as the first runnable code — they are not pre-created.

## AI workflow

How AI is integrated into this project — categories of tooling, principles for adoption, and the active inventory of tools and skills — is documented in [AI_WORKFLOW.md](./AI_WORKFLOW.md).

## What to avoid

- Don't create `go.mod`, `go.sum`, CI configuration, or Docker files until there is code that justifies them.
- Don't preemptively create slash commands, sub-agents, or custom skills.
- Don't introduce abstraction (interface, factory, repository pattern) without three concrete use cases.
- Don't write comments that describe *what* the code does — only *why* when non-obvious.
- Don't make foundational decisions (deploy/distribution channel, internal architecture, command-parsing library) without recording them in an ADR.
