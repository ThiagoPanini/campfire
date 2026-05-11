# 1. Record architectural decisions

Date: 2026-05-11

## Status

Accepted

## Context

We need a lightweight way to record the structural decisions made on this project — stack choices, patterns, database, deploy target, and similar — so that future contributors (human and AI) can understand not just *what* the codebase looks like, but *why* it looks that way.

Without this, knowledge lives only in the head of whoever made the decision, or scattered across commit messages.

## Decision

We will use Architecture Decision Records (ADRs), as described by Michael Nygard, kept in `docs/decisions/`.

Each ADR is a short Markdown file numbered sequentially (`NNNN-title.md`) with the sections: **Status**, **Context**, **Decision**, **Consequences**.

Dates are absolute (YYYY-MM-DD), not relative.

An ADR is created when a structural decision is made. An ADR can be superseded by a later ADR; the older one is marked `Superseded by NNNN` rather than deleted.

## Consequences

- A new contributor can read `docs/decisions/` in order and understand the trajectory of the project.
- Decisions are visible. We can't accidentally re-litigate a choice without noticing.
- There is mild overhead: a few minutes of writing per real decision. We accept this — it is much cheaper than the alternative.
