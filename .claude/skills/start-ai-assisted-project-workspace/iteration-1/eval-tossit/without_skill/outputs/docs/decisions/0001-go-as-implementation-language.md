# 0001 — Go as the implementation language

- **Status**: Accepted
- **Date**: 2026-05-11

## Context

`tossit` is a small CLI that wraps `git`. It needs to be:

- Trivially distributable as a single binary, with no runtime dependency on the user's machine.
- Cross-platform (Linux, macOS, with Windows as a stretch goal).
- Fast to start — sub-100ms cold start matters when the tool is invoked dozens of times a day from muscle memory.
- Comfortable to develop in, with a healthy standard library for process invocation, flag parsing, and filesystem manipulation.

The candidates considered were Go, Rust, and a scripting language (Python or Node) wrapped in a single-file packer.

## Decision

We will implement `tossit` in Go.

- **Versus Rust**: Rust gives marginally better runtime characteristics but at a significantly higher iteration cost for a tool whose entire job is to shell out to `git`. The borrow checker offers little upside for a stateless CLI.
- **Versus scripted languages**: Single-binary distribution without a runtime is a hard requirement. Pyinstaller / pkg / nexe are workable but adversarial; Go gives this for free with `go build`.
- **Versus everything else**: Go's `os/exec`, `flag`, and `fmt` packages cover the entire surface area of the MVP without any third-party dependencies.

## Consequences

- The binary is a single static artefact per OS/arch combination, built with `go build ./cmd/tossit`.
- We commit to Go 1.22 or later (the version pinned in `go.mod` once the first code lands).
- We will *not* adopt a heavyweight CLI framework (cobra, urfave/cli) until the flag surface concretely outgrows `flag` from the standard library. This is a direct application of the rule-of-three principle.
- The project is open to a future rewrite if a hard constraint (e.g. tight integration with a non-Go library) emerges, but that would itself require a new ADR superseding this one.
