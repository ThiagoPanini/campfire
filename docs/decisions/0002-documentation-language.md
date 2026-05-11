# 0002 — Documentation and commit language

- **Status**: Accepted
- **Date**: 2026-05-10

## Context

This is a solo project authored by a Portuguese-speaking developer working primarily through AI assistants. Two viable language choices for documentation, commits, and persisted artifacts:

- **Portuguese (PT-BR)**: matches the author's native language; lowers human writing friction.
- **English (EN)**: aligns with the broader software ecosystem (library docs, blogs, frontier-model training distribution); interoperates with future contributors more easily; removes the small but real overhead of mixed-language reasoning when AI assistants cross-reference external sources.

Mixed-language artifacts are worse than either pure choice — the cost of inconsistency exceeds the cost of either option.

## Decision

All persisted artifacts in this repository are written in **English**. This includes:

- Markdown documents (`README.md`, `CLAUDE.md`, `PRODUCT_VISION.md`, `AI_WORKFLOW.md`, `AGENTS.md`, ADRs, etc.).
- Git commit messages and PR descriptions.
- Code identifiers (variables, functions, classes, modules, file names).
- Inline code comments.
- Configuration files (when they accept comments).

Conversational interaction with AI assistants may happen in either language at the author's discretion — this ADR governs only what gets persisted to the repository.

## Consequences

**Positive**:

- Lower friction when cross-referencing English-language ecosystem documentation.
- Frictionless onboarding for any future English-speaking contributor.
- Avoids mixed-language artifacts.

**Negative**:

- Slightly higher cognitive load for the author when writing free-form prose.
