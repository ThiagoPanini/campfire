# Roadmap

Sequenced milestones. Each milestone ends with something runnable.

## M0 — Bootstrap (current)

- Repo structure, ADRs for foundational choices, AI workflow doc.
- No runnable code yet.

**Exit criterion**: foundational decisions are documented; the next contributor (human or AI) can read the repo top-to-bottom in 10 minutes and know what we're building and how.

## M1 — Walking skeleton

A user can:
1. Hit a single endpoint on the backend to start a session.
2. Hit a single endpoint to complete it with a tag.
3. Hit a single endpoint to list sessions.

Frontend: a single page with a Start button, a tag input on completion, and a list of past sessions. Ugly is fine.

**Exit criterion**: a real end-to-end flow runs locally through the VS Code debugger.

## M2 — Heatmap

The frontend renders the two heatmap views described in [mvp-scope.md](./mvp-scope.md).

**Exit criterion**: the heatmap is useful enough that the author wants to look at it.

## M3 — Dogfood week

The author uses flux for a full week as their primary focus timer. Bugs found are fixed. Friction observed is logged. After the week, decide what's next.

**Exit criterion**: one full week of real use with no fall-back to another timer.

## Post-MVP

Decided after dogfooding, not before. Likely candidates: deploy to a real host, add auth, mobile-friendly polish. None of these is committed yet.
