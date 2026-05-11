# 0002 — Documentation and commit language

- **Status**: Accepted
- **Date**: {TODAY}

## Context

This project is being authored primarily by a {NATIVE_LANGUAGE}-speaking developer working through AI assistants. Two viable language choices for documentation, commits, and persisted artifacts:

- **{NATIVE_LANGUAGE}**: matches the author's native language; lowers human writing friction.
- **English**: aligns with the broader software ecosystem (library docs, blogs, frontier-model training distribution); interoperates with future contributors more easily; removes the small but real overhead of mixed-language reasoning when AI assistants cross-reference external sources.

Mixed-language artifacts are worse than either pure choice — the cost of inconsistency exceeds the cost of either option.

## Decision

All persisted artifacts in this repository are written in **{CHOSEN_LANGUAGE}**. This includes:

- Markdown documents.
- Git commit messages and PR descriptions.
- Code identifiers (variables, functions, classes, modules, file names).
- Inline code comments.
- Configuration files (when they accept comments).

Conversational interaction with AI assistants may happen in either language at the author's discretion — this ADR governs only what gets persisted to the repository.

## Consequences

**Positive**:

- Consistency across all artifacts.
- Lower friction for the chosen audience.
- Avoids mixed-language drift over time.

**Negative**:

- {NEGATIVE_CONSEQUENCE}

> Adaptation note: when generating this ADR, replace `{NEGATIVE_CONSEQUENCE}` with a one-line trade-off relevant to the choice. For non-English: "Slightly higher token cost and marginal reasoning gap when AI assistants cross-reference English-language ecosystem documentation." For English when the author's native language differs: "Slightly higher cognitive load for the author when writing free-form prose."
