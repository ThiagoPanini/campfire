**Spec Kit drives feature work**. Layout per feature:
```
specs/NNN-slug/
├── spec.md           # /speckit.specify output (the WHAT)
├── plan.md           # /speckit.plan output (the HOW + Constitution Check)
├── research.md       # Phase 0 decisions vs. alternatives
├── data-model.md     # Phase 1 schema
├── quickstart.md     # Manual end-to-end demo path (the gate, since automated UI tests are deferred)
├── contracts/openapi.json
├── adr/0NNN-*.md     # Architecture Decision Records
├── checklists/
└── tasks.md          # /speckit.tasks output
```
Existing slices: `001-frontend-mvp-prototype` (FE-only prototype — superseded by real backend), `002-backend-auth-slice` (identity + auth), `003-repertoire-song-entry` (current).

**Constitution**: `.specify/memory/constitution.md` (v1.1.0). Five principles + Backend Architecture Invariants 1–7 (see `project/architecture-invariants` memory). Every plan includes a "Constitution Check" gate at Phase 0 AND a re-check after Phase 1. Read this first whenever Phase 0/1 is being authored or reviewed.

**`AGENTS.md` ⇄ `CLAUDE.md`**: `CLAUDE.md` is a symlink to `AGENTS.md`. The file is intentionally tiny — its only job is to point at the active feature plan inside `<!-- SPECKIT START --> … <!-- SPECKIT END -->` markers. The marker block is rewritten by `/speckit.plan` for each new slice, so this is the canonical "what is the agent currently working on" pointer. Read the referenced plan.md before any non-trivial work.

**Skills present locally** (`.agents/skills/` — auto-discovered by harness): all `speckit-*` skills, plus `clean-ddd-hexagonal`, `hexagonal-architecture`, `fastapi-templates`, `frontend-design`, `mintlify`, `documentation-writer`, `git-commit`, `caveman`, `folder-structure-blueprint-generator`, `ai-dev-setup`. Prefer the matching skill over freelancing — they encode the project's conventions.

**Rationale this project privileges**: solo-builder + AI-heavy. Constitution Principle IV (Proportional Rigor) means automated UI tests, load tests, and e2e are *deliberately deferred*. The manual quickstart.md is the gate. Don't volunteer to add Playwright/Cypress/k6/etc. without an explicit trigger.
