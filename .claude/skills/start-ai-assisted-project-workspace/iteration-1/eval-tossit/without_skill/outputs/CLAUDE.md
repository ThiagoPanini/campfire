# CLAUDE.md

Conventions and context for AI sessions in this repository. Keep this file concise — it is read at the start of every session.

## About the project

`tossit` is a single-binary Go CLI that extends git with a `git tossit` command for safely parking dirty work on a remote junk branch. Full vision in [PRODUCT_VISION.md](./PRODUCT_VISION.md). Current MVP scope in [docs/mvp-scope.md](./docs/mvp-scope.md).

## Repository layout

```
cmd/tossit/        # main package — the binary entrypoint
internal/          # private packages (added as concrete need appears)
docs/decisions/    # ADRs
```

There is intentionally no `pkg/` directory: nothing in this project is meant to be imported by external code until proven otherwise.

## Engineering principles

1. **Walking skeleton first.** A real end-to-end flow (parse args, shell out to git, push to remote) runs before any architectural abstraction is introduced.
2. **Every commit runs.** If something broke, fix it before moving on.
3. **Rule of three for abstraction.** Don't introduce an interface, factory, or wrapper type until three concrete implementations demand it.
4. **Reactive tooling, not proactive.** Add MCPs, sub-agents, custom slash commands, and custom skills only when concrete, repeated friction justifies them.
5. **Document decisions, not code.** Short ADRs in `docs/decisions/`. Well-named code does not need comments explaining *what* — only *why* when non-obvious.

## Conventions (evolving)

- **Language**: Go (see [docs/decisions/0001-go-as-implementation-language.md](./docs/decisions/0001-go-as-implementation-language.md)).
- **Module path**: chosen at first real commit, recorded in `go.mod`.
- **Git interaction**: shell out to the `git` binary on `PATH`. Do not use go-git or other libraries unless a concrete reason emerges (see ADR 0002).
- **Errors**: return errors up; only the `main` function prints to the user. Use `fmt.Errorf("%w", err)` for wrapping.
- **Dates in ADRs and documents**: always absolute (YYYY-MM-DD).
- **Documentation language**: English.

## Local development workflow

The binary builds with plain `go build ./cmd/tossit`. A `dev/run_local.go` entrypoint and the matching `.vscode/launch.json` configuration land in the same commit as the first runnable code — they are not pre-created.

## AI workflow

How AI is integrated into this project is documented in [AI_WORKFLOW.md](./AI_WORKFLOW.md).

## What to avoid

- Don't create `Makefile`, GitHub Actions workflows, Dockerfiles, or release tooling until there is code that justifies them.
- Don't introduce a `pkg/` directory or any exported package until a second consumer exists.
- Don't add config-file support to the CLI until flag-based usage is shown to be insufficient.
- Don't abstract over the git binary (interface, mock, adapter) until tests concretely need it.
- Don't write comments that describe *what* the code does — only *why* when non-obvious.
- Don't make foundational decisions (test framework, distribution channel, telemetry) without recording them in an ADR.
