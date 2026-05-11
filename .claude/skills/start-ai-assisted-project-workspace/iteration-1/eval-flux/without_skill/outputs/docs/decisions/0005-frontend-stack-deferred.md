# 5. Frontend stack: deferred

Date: 2026-05-11

## Status

Accepted (placeholder — to be superseded when the choice is made)

## Context

flux needs a web frontend. Candidates considered briefly: Next.js, Remix, SvelteKit, SolidStart, plain Vite + React, plain Vite + Svelte.

The frontend has two non-trivial requirements:
1. A reliable, accurate timer that does not drift or pause when the tab is backgrounded.
2. A heatmap visualization. Not exotic — d3 or a lightweight charting library can handle it.

Neither requirement strongly favors a specific framework. The choice is mostly about maintainer familiarity and longevity.

## Decision

Defer. The first frontend commit will be accompanied by an ADR superseding this one, naming the chosen stack and the reason.

What we will *not* do:
- Pick a stack now to feel productive. The walking skeleton is the forcing function.
- Pick a stack based on what's trending. We pick what we can maintain in a year.

## Consequences

- `apps/web/` stays empty until a decision is made.
- The backend can proceed independently; its public contract (Pydantic + FastAPI's OpenAPI export) will inform frontend type generation regardless of stack.
- This ADR exists mainly to make the *absence* of a decision visible, so it does not get made implicitly by whoever runs `npm create` first.
