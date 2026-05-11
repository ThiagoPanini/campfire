# AGENTS.md

Working agreements for everyone contributing to this repository — human or AI.

## Scope

This file complements [CLAUDE.md](./CLAUDE.md). CLAUDE.md captures project-specific context and conventions; AGENTS.md captures behavioral expectations for contributors.

## Default posture

- **Small, reversible changes.** Prefer a series of small, runnable commits over one large reorganization.
- **Read before writing.** If you're about to touch a file, read it. If you're about to touch a system, understand its current shape from the ADRs and existing code.
- **Ask when ambiguous.** Don't guess between two non-trivial directions — surface the choice.
- **No silent decisions.** A stack choice, library introduction, or pattern change goes into an ADR.

## Commits

- Conventional Commits format: `type(scope): description`.
  - Common types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`.
- Subject line under 72 characters, imperative mood.
- Body explains *why*, not *what*, when non-obvious.
- One logical change per commit. If you need to write the word "and" in the subject, it's probably two commits.

## Pull requests

Not yet — single-author repo. When collaborators arrive, PR conventions will be added here.

## Code style

- **Python (backend)**: PEP 8, type hints on public functions, `ruff` + `black` when tooling lands.
- **Frontend**: TBD with the frontend stack decision.
- **Naming**: clear over clever. `sessions_in_last_week()` beats `recent()`.

## Tests

- Tests land with the feature, not after. A walking skeleton without one end-to-end test is not a walking skeleton.
- Don't test what the framework already tests for you.
- Don't mock what you own — refactor it instead.

## What "done" means

A change is done when:
1. It runs.
2. It has at least one test exercising the new behavior (when there is behavior to test).
3. Any decision worth remembering is in an ADR or in CLAUDE.md.
4. README/docs are updated if user-visible.
