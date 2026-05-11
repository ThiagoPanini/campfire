# 3. Backend framework: FastAPI

Date: 2026-05-11

## Status

Accepted

## Context

The backend needs to serve a small JSON API: create sessions, complete them with tags, list them, aggregate them for the heatmap. We need something with:

- Low ceremony for small projects.
- Type-driven request/response handling so the contract with the frontend stays honest.
- A debugging story that works through the VS Code debugger.
- A maintainer (me) who is productive in it.

Options considered: FastAPI, Flask, Django, Litestar, plain Starlette.

## Decision

FastAPI.

Rationale:
- Pydantic-driven schemas give us a typed contract for free, which matters when the frontend stack is still undecided — we can generate or copy types against a stable shape.
- Async-ready without forcing async on us.
- Excellent debugger story via `uvicorn` run from `dev/run_local.py`.
- The maintainer already knows it well; lower risk on a side project where motivation is the scarce resource.

Internal structure of the backend (Clean Architecture, Hexagonal, flat layout, etc.) is **explicitly deferred**. The walking skeleton will likely be flat. Abstractions will be introduced only when a third concrete use case demands them (see CLAUDE.md, principle 3).

## Consequences

- We commit to Python on the backend.
- Pydantic v2 models become the source of truth for request/response shapes.
- If we later add a second backend service in a different language, we will revisit. Not a current concern.
- We accept that FastAPI's "magic" (dependency injection, automatic OpenAPI) can mask intent — we will lean on it lightly and document non-obvious dependencies.
