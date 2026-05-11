# 3. Documentation and code language

- **Status**: Accepted
- **Date**: 2026-05-11

## Context

The project owner is bilingual and AI agents often produce output in either English or the user's local language depending on the prompt. Without an explicit rule, documents and code identifiers drift between languages over time, which makes search, review, and onboarding harder.

## Consequences

## Decision

All of the following are written in English:

- Documentation (`README.md`, `CLAUDE.md`, ADRs, `docs/**`).
- Commit messages and PR descriptions.
- Code identifiers (variable, function, class, file names).
- Code comments.

Domain vocabulary that has no clean English equivalent stays in its original language and is treated as a proper noun.

## Consequences

- Lower friction when sharing the repo with collaborators or AI agents that default to English.
- Consistent grep/search behavior across the codebase.
- One small upfront cost: occasionally translating a domain term. Acceptable.
