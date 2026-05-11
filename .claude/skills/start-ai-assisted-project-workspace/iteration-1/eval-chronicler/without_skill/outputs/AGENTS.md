# AGENTS.md

Conventions for coding agents working in this repository. The primary, more detailed file is [CLAUDE.md](./CLAUDE.md) — this file mirrors the essentials so non-Claude agents have a clear entrypoint.

## Quick context

`campaign-chronicler` is a web app for remote D&D / TTRPG groups. Players log in-character actions per session; the system later compiles those into a generated "lore document" for the campaign.

## Ground rules

- Read [CLAUDE.md](./CLAUDE.md) and the most recent ADRs in [docs/decisions/](./docs/decisions/) before making structural changes.
- Walking skeleton first — get a real end-to-end flow running before introducing abstractions.
- Every commit must run. If a change breaks the build, fix it before moving on.
- Stack, database, and deploy target are not yet chosen. Do not pick them silently — open an ADR.
- Dates in documents are absolute (YYYY-MM-DD).
- All documentation, commit messages, and code identifiers are in English.

## Where to put things

- Runnable apps → `apps/<name>/`
- Code shared between apps → `packages/<name>/` (only once a real sharing need appears)
- Architectural decisions → `docs/decisions/NNNN-title.md`

## What not to do

- Don't add CI, Docker, package manifests, or framework scaffolds before there is code that needs them.
- Don't add a port/adapter/interface for a single implementation.
- Don't bypass ADRs for foundational decisions.
