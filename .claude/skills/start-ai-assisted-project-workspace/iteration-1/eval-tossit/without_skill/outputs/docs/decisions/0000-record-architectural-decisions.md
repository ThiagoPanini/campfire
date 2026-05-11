# 0000 — Record architectural decisions

- **Status**: Accepted
- **Date**: 2026-05-11

## Context

Even small projects accumulate decisions — language, dependencies, distribution model, testing strategy — that future contributors (human or AI) will otherwise re-litigate every few weeks. Without a written record, the *why* behind a choice evaporates the moment it leaves the original author's head.

## Decision

We will record significant architectural decisions as short, numbered Markdown files under `docs/decisions/`, following a lightweight ADR (Architecture Decision Record) format inspired by Michael Nygard's original template.

Each ADR has:

- A four-digit number, monotonically increasing.
- A kebab-case slug after the number.
- The sections: **Status**, **Date**, **Context**, **Decision**, **Consequences**.
- An absolute date (`YYYY-MM-DD`).

A decision is "significant" if reversing it would require touching multiple files, breaking compatibility, or having a second debate with a teammate. Trivial style decisions belong in `CLAUDE.md` or `.editorconfig`, not here.

## Consequences

- **Positive**: future contributors (including AI agents in fresh sessions) can grep `docs/decisions/` to learn why the project is shaped the way it is.
- **Positive**: revisiting a decision becomes a deliberate act — write a new ADR that supersedes the old one — rather than a silent drift.
- **Negative**: a small amount of overhead for every real decision. This is the point.
