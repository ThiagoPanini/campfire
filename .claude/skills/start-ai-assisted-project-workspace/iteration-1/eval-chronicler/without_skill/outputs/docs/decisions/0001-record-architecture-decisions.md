# 1. Record architecture decisions

- **Status**: Accepted
- **Date**: 2026-05-11

## Context

Foundational decisions on this project (stack, database, deploy provider, internal architecture, etc.) are not yet made. We want a low-ceremony way to record those decisions as they happen, so future-us — and any AI agent picking up the repo — can understand *why* the project looks the way it does, not just *what* it looks like.

## Decision

We use lightweight Architecture Decision Records (ADRs), one per decision, stored in `docs/decisions/`.

Conventions:

- File name: `NNNN-short-title.md`, zero-padded, monotonically increasing.
- Each ADR has at least: a status, an absolute date (YYYY-MM-DD), context, decision, and consequences.
- ADRs are immutable in spirit. When a decision changes, write a new ADR that supersedes the old one and update the old one's status to `Superseded by NNNN`.

## Consequences

- A new contributor (human or AI) can read `docs/decisions/` and understand the shape of the project.
- We have to actually write ADRs when we make decisions. The cost is small; the cost of *not* doing it shows up only later.
