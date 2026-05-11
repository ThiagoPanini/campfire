# tossit

A tiny git companion for moments when you need to bail out fast.

`git tossit` stashes everything dirty, commits it with a generated WIP message, and pushes the result to a personal junk branch on your remote. Nothing is lost; nothing blocks the work you actually want to do next.

## Why

Sometimes you want to switch branches *right now* — to review a teammate's PR, to investigate a production issue, to chase an idea before it evaporates — and your working tree is a mess. `git stash` is fine, but stashes are local, easy to forget, and don't survive a lost laptop. `tossit` turns "I'll get back to this later" into something durable: a commit on a remote branch named after you, timestamped, recoverable from anywhere.

## Install

```sh
go install github.com/<your-user>/tossit/cmd/tossit@latest
```

This places a `tossit` binary on your `PATH`. Because the binary is named `tossit`, git transparently exposes it as `git tossit`.

## Usage

```sh
git tossit                  # stash, commit, push to junk/<user>/<timestamp>
git tossit -m "broken auth" # include a hint in the WIP message
git tossit --branch wip/foo # push to a specific branch instead of a generated one
git tossit --dry-run        # show what would happen, do nothing
```

After running, your working tree is clean and the work lives at `origin/junk/<user>/<timestamp>`. Recover it with a normal `git fetch && git checkout`.

## Status

Pre-alpha. See [docs/mvp-scope.md](./docs/mvp-scope.md) for what is and isn't in the first runnable version.

## Documentation

- [PRODUCT_VISION.md](./PRODUCT_VISION.md) — what this tool is for and what it isn't
- [CLAUDE.md](./CLAUDE.md) / [AGENTS.md](./AGENTS.md) — conventions for AI sessions
- [AI_WORKFLOW.md](./AI_WORKFLOW.md) — how AI is integrated into development
- [docs/decisions/](./docs/decisions/) — architectural decisions (ADRs)
