# 4. Defer stack, database, and deploy provider choices

- **Status**: Accepted
- **Date**: 2026-05-11

## Context

The project owner explicitly wants to think about stack choices separately from setting up the project foundation. There are real reasons not to lock these in on day one:

- The walking skeleton is not built yet, so we cannot honestly evaluate which constraints matter.
- Choosing a backend language affects deploy and database options downstream.
- Picking now and changing later is cheap *only* if we have not built ceremony around the wrong choice.

## Decision

We defer the following decisions to dedicated ADRs, each written when we are ready to make that choice:

- **Frontend stack** — framework, language, build tool.
- **Backend stack** — language and framework.
- **Database** — engine and managed-vs-self-hosted.
- **Auth model** — email/password, magic link, OAuth, etc.
- **Deploy provider** — hosting for web app, backend, and database.
- **LLM provider / model** — used for chronicle generation.

Until those ADRs exist:

- No `package.json`, `pyproject.toml`, `Cargo.toml`, `Gemfile`, or equivalent at any level of the repo.
- No `Dockerfile`, `compose.yml`, or CI workflow.
- No framework scaffolding in `apps/`.

## Consequences

- The repo will look "empty" for longer than is conventional. That is intentional. The foundation files (`README.md`, `CLAUDE.md`, `AGENTS.md`, ADRs, `.gitignore`, `.editorconfig`) carry the signal that the project is real and considered, even before code lands.
- Each deferred decision is a known unknown, tracked in `docs/mvp-scope.md` under "Open questions blocking MVP".
- Once a stack is chosen, the first commit that introduces it must include the corresponding ADR.
