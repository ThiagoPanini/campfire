# 0002 — Shell out to the `git` binary rather than embedding a library

- **Status**: Accepted
- **Date**: 2026-05-11

## Context

There are two ways for a Go program to manipulate a git repository:

1. Use the `go-git` library (or similar), which reimplements git in pure Go.
2. Shell out to the user's installed `git` binary via `os/exec`.

`tossit`'s entire job is to chain a few git operations — `add`, `commit`, `push`, `checkout` — that every user already has installed and configured (credentials, GPG signing, hooks, SSH keys, custom config).

## Decision

We will shell out to the `git` binary on the user's `PATH` and not depend on `go-git` or any other library that reimplements git.

## Consequences

- **Positive**: every git feature the user has already configured (signing, credentials, hooks, includeIf rules, GPG) "just works" because we are literally invoking their git.
- **Positive**: the binary stays small — no embedded git implementation.
- **Positive**: when git updates its behaviour, we inherit it for free.
- **Negative**: `tossit` requires `git` to be installed and on `PATH`. This is acceptable because the tool is invoked *as* `git tossit`; if git isn't present, the user can't invoke it in the first place.
- **Negative**: error handling means parsing exit codes and, occasionally, stderr text. We accept this cost and isolate the parsing in a single package once it appears.
- We will revisit this decision if we ever need to operate on a repo without invoking the user's git (for example, in a managed CI environment where we want strict determinism). Such a change would require a new ADR.
