---
name: start-ai-assisted-project
description: Bootstrap the foundation of a brand-new software project — first-commit material like CLAUDE.md, AGENTS.md, AI_WORKFLOW.md, ADRs, monorepo skeleton, .gitignore, .editorconfig — designed for AI-assisted development from day one. Use whenever the user is at the very start of a new project (empty or near-empty repo, fresh idea) and wants a foundation that reads as a real project rather than a learning lab. Trigger on phrases like "I'm starting a new project", "help me bootstrap", "set up a fresh repo for X", "I have an idea for Y and want to begin properly", "scaffold the foundation for Z", or whenever a user describes a brand-new project they want to begin building. Do NOT use for adding features to existing projects, refactoring established codebases, CI setup, or partial scaffolding — only for initial project bootstrap into an empty or near-empty directory.
---

# Start AI-Assisted Project

Use at the very beginning of a new software project — when the working directory is empty (or nearly so) and the user has an idea they want to start building.

The output is a repository foundation that:

- Reads as a real project from the first commit (not a learning lab or meta-experiment).
- Encodes principles that prevent common AI-assisted-development failure modes (snowball complexity, premature abstraction, premature tooling).
- Is portable across multiple AI agents (Claude Code, Codex, GitHub Copilot).
- Defers every non-load-bearing decision to a later ADR.

## Why this skill exists

Projects bootstrapped under heavy AI assistance frequently snowball: code is generated faster than the human can form a mental model, horizontal architecture (Clean/Hexagonal, microservices, etc.) gets built before any vertical feature works end-to-end, and tools (sub-agents, MCPs, slash commands) accumulate on hope rather than on friction. A solid foundation prevents this by encoding a small set of principles in the repository's first artifacts — so every future session reads them and is anchored.

## Engineering principles encoded in output

These appear in the generated `CLAUDE.md`, `AGENTS.md`, and `AI_WORKFLOW.md`. Do not change them on a whim — they are the load-bearing reason for the skill to exist:

1. **Walking skeleton first.** A real end-to-end flow runs before any architectural abstraction is introduced.
2. **Every commit runs.** If something broke, fix it before moving on.
3. **Rule of three for abstraction.** Don't introduce an interface, port, or adapter until three concrete implementations demand it.
4. **Reactive tooling, not proactive.** MCPs, sub-agents, slash commands, custom skills, and similar artifacts enter the project only when concrete repeated friction justifies them.
5. **Document decisions, not code.** Short ADRs in `docs/decisions/`. Well-named code does not need comments explaining *what* — only *why* when non-obvious.

## Workflow

### Step 1 — Verify directory state

Run `ls -la` to confirm the working directory is empty or near-empty. Acceptable starting states:

- Completely empty.
- Only `.git/` (initialized but no content).
- Only `.git/` + `.claude/` (Claude Code initialized).
- Only `.git/` + a stub `README.md` (typical fresh repo).

If the directory has substantive content (existing code, multiple files, etc.), STOP and ask the user whether they intended to bootstrap into this directory. This skill is for greenfield projects — refuse silently overwriting a populated directory.

### Step 2 — Extract context from the user's prompt

The user invoked this skill with a project idea. Extract from what they wrote:

- **Project name** (one short, lowercase identifier suitable for a directory name).
- **One-line description** (what the project does and for whom).
- **Implied stack** (anything explicitly mentioned: "FastAPI", "Next.js", "Rails", "Go" — but do not assume; if the user didn't say, leave open).
- **Implied repo shape** (anything that suggests monorepo, e.g., "frontend and backend together").

If the project name and description are not both clear from the prompt, ask before continuing — do not invent.

### Step 3 — Gather decisions via AskUserQuestion

Use the AskUserQuestion tool. Ask the four questions below in a single call. If the user already answered any of these implicitly in their prompt, skip that question.

1. **Repository structure** — single-app or monorepo?
   - *Single app* — only one deployable application at the root.
   - *Monorepo (recommended for projects with multiple deployables, e.g., backend + frontend)* — multiple apps share one repo under `apps/`.

2. **Documentation language** — which language for docs, commits, code identifiers, and inline comments?
   - *English (recommended)* — aligns with ecosystem (libraries, blogs, frontier-model training distribution); least friction for AI cross-reference.
   - *Portuguese (PT-BR)*.
   - *Other* — user specifies.

3. **Multi-agent setup** — which AI agents will read this repo?
   - *Claude Code only*.
   - *Claude Code + Codex (OpenAI)* — adds `AGENTS.md`.
   - *Claude Code + GitHub Copilot* — adds `.github/copilot-instructions.md`.
   - *Claude Code + Codex + Copilot (recommended)* — maximum portability.

4. **License** — initial license decision?
   - *Defer (recorded as "not yet decided" in the first ADR — recommended for early-stage)*.
   - *MIT*.
   - *Apache 2.0*.
   - *Proprietary / All rights reserved*.

After getting answers: if the user picked "monorepo" but the apps weren't implied by the project description, ask which apps to scaffold (typical defaults: `apps/api/` for backend, `apps/web/` for frontend).

If a backend or frontend stack is implied but not chosen, do NOT pick one for them. Leave it as TBD in the artifacts and record the choice as deferred.

### Step 4 — Confirm the plan

Before writing any files, summarize back to the user, in a brief block:

- Project name and description.
- Repository structure (single-app or monorepo with which apps).
- Documentation language.
- Multi-agent setup.
- License decision.
- The list of artifacts about to be created.
- The list of decisions explicitly deferred (frontend stack, database, deploy provider, internal architecture, testing strategy, CI/CD, license if deferred).

Wait for user confirmation. Adjust the plan if they redirect.

### Step 5 — Scaffold artifacts

Templates live in `assets/templates/`. Read each template before writing — they encode the structure and tone the skill is responsible for. Substitute placeholders (`{PROJECT_NAME}`, `{PROJECT_DESCRIPTION}`, `{TODAY}`, `{LANGUAGE}`, etc.) with actual values.

**Always create at the repository root**:

- `README.md`
- `CLAUDE.md`
- `AI_WORKFLOW.md`
- `PRODUCT_VISION.md` (scaffold — explicit "to be drafted" status; do not invent product content)
- `.gitignore`
- `.editorconfig`

**Always create**:

- `docs/mvp-scope.md` (scaffold)
- `docs/decisions/0001-project-foundation.md` (first ADR — adapted to monorepo or single-app shape)

**Create if Codex is in the multi-agent set**:

- `AGENTS.md`

**Create if Copilot is in the multi-agent set**:

- `.github/copilot-instructions.md`

**Create if monorepo**:

- `apps/<name>/.gitkeep` for each chosen app.
- `packages/.gitkeep`.

**Create if documentation language is NOT English**:

- `docs/decisions/0002-documentation-language.md` (records the choice). For English (the default recommendation), no separate ADR is needed — the choice is noted in CLAUDE.md and ADR 0001.

**Do NOT create (these are deferred — let the user build them when justified)**:

- `pyproject.toml`, `package.json`, `Cargo.toml`, `go.mod`, or any package-manager config — these land in the same commit as the first runnable code.
- `.claude/commands/`, `.claude/agents/`, `.claude/skills/` — empty directories signal premature tooling.
- `.vscode/launch.json`, `.vscode/settings.json`, `dev/run_local.py` — convention is documented in CLAUDE.md; files materialize with the first code.
- `.github/workflows/` or any CI configuration.
- `Dockerfile`, `docker-compose.yml`.
- `LICENSE` file (unless the user explicitly chose a non-deferred license).
- Database migrations, schema, seeds.
- Any application code.

When in doubt, defer. Every file in the first commit must pull its weight today, not "eventually".

### Step 6 — Adapt templates to the project's specifics

Templates are written for the maximal case (monorepo with `apps/api/` and `apps/web/`, English, Codex + Copilot). When the user's choices differ, adapt:

- **Single-app**: drop `apps/` and `packages/` from the layout block in every doc; remove references to "monorepo" in favor of single-app phrasing; the first ADR records the single-app decision instead of the monorepo decision.
- **Monorepo with non-default apps**: edit the layout block in `README.md`, `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, and ADR 0001 to reflect the actual app list.
- **Without Codex**: do not create `AGENTS.md`. Remove its mention from `README.md`, `CLAUDE.md`, the foundational-docs list in ADR 0001, and the multi-agent section in `AI_WORKFLOW.md`.
- **Without Copilot**: do not create `.github/copilot-instructions.md`. Remove its mention from the same places.
- **Non-English**: translate explanatory prose in every artifact to the chosen language. Keep technical names (`AGENTS.md`, "Codex", "Claude Code", etc.), file paths, and standard config syntax in their original form. Create `docs/decisions/0002-documentation-language.md` recording the choice.
- **License chosen (not deferred)**: drop the license line from ADR 0001's "Not yet decided" list. The actual `LICENSE` file is still NOT created automatically — recommend the user add it as a separate, deliberate step.

### Step 7 — Stack-aware additions to `.gitignore`

Read `references/stack-defaults.md`. If the user mentioned a stack (e.g., "FastAPI", "Next.js", "Go", "Rails"), append the relevant patterns to the base `.gitignore`. If no stack is mentioned, the default `.gitignore` (covering Python and Node, plus IDE/OS) is sufficient — additional patterns can be added later when a stack is chosen.

The skill does NOT install dependencies, create lockfiles, or generate package-manager configs. Those land with the first runnable code, not in the foundation.

### Step 8 — Critical audit

Before reporting completion, do a self-review pass:

1. **Cross-references resolve** — every link in every doc points to a file that actually exists. Walk the link graph between `README.md`, `CLAUDE.md`, `AGENTS.md` (if present), `AI_WORKFLOW.md`, `.github/copilot-instructions.md` (if present), and the ADRs.
2. **`.gitignore` vs documented commits** — if `CLAUDE.md` mentions `.vscode/launch.json` will be committed, ensure `.gitignore` whitelists it (`.vscode/*` plus `!.vscode/launch.json`, `!.vscode/extensions.json`, `!.vscode/tasks.json`). This contradiction is easy to miss and costly when discovered later.
3. **Settings hygiene** — if a `.claude/settings.json` exists with personal preferences (e.g., `defaultMode: bypassPermissions`), move it to `.claude/settings.local.json` (which `.gitignore` excludes). Personal-mode settings should not propagate via the committed repo.
4. **Foundational docs list in ADR 0001** — every doc actually present at root is listed; tool-specific docs (e.g., `.github/copilot-instructions.md`) are mentioned in their canonical location.
5. **Date format** — every ADR uses `YYYY-MM-DD` for today's date.
6. **No leftover placeholders** — search the output for `{PROJECT_NAME}`, `{PROJECT_DESCRIPTION}`, `{LANGUAGE}`, `{TODAY}`, etc. None should remain.
7. **Language consistency** — the chosen documentation language is applied to ALL persisted artifacts. No leftover lines from the English templates if the user picked another language.
8. **No invented content in scaffolds** — `PRODUCT_VISION.md` and `mvp-scope.md` are placeholders with explicit "to be drafted" status; they do NOT contain made-up product copy. The skill resists the urge to fill them.

If any item fails, fix it before reporting.

### Step 9 — Report and hand off

Tell the user:

- **What was created**: the file list (with paths).
- **What was explicitly deferred**: so they don't think anything is missing or broken.
- **Suggested immediate next steps**: typically (a) review the files and adjust tone where they disagree, (b) first commit, (c) draft `PRODUCT_VISION.md`, (d) draft `docs/mvp-scope.md`, (e) start the walking skeleton (Phase 1).

Do NOT commit on the user's behalf unless they explicitly ask.

## Templates index

| Template path | Output path | Notes |
|---|---|---|
| `assets/templates/README.md` | `README.md` | Adapt layout block to the chosen repo shape. |
| `assets/templates/CLAUDE.md` | `CLAUDE.md` | Primary instruction file. |
| `assets/templates/AGENTS.md` | `AGENTS.md` | Skip if Codex not in the agent set. |
| `assets/templates/AI_WORKFLOW.md` | `AI_WORKFLOW.md` | Methodology + active-inventory living doc. |
| `assets/templates/PRODUCT_VISION.md` | `PRODUCT_VISION.md` | Scaffold only. Do not draft content here. |
| `assets/templates/mvp-scope.md` | `docs/mvp-scope.md` | Scaffold only. |
| `assets/templates/decisions/0001-project-foundation.md` | `docs/decisions/0001-project-foundation.md` | Adapt to monorepo or single-app. |
| `assets/templates/decisions/0002-documentation-language.md` | `docs/decisions/0002-documentation-language.md` | Only if non-English. |
| `assets/templates/copilot-instructions.md` | `.github/copilot-instructions.md` | Skip if Copilot not in the agent set. |
| `assets/templates/gitignore` | `.gitignore` | Append stack-specific patterns from `references/stack-defaults.md`. |
| `assets/templates/editorconfig` | `.editorconfig` | Universal; rarely needs adaptation. |

## What this skill is NOT for

- Adding features to existing projects.
- Refactoring an established codebase.
- Setting up CI/CD on an existing project.
- Generating application code.
- Choosing specific frameworks (it deliberately leaves stack open).
- Designing detailed architecture (it deliberately defers this).

If the user is past the bootstrap phase, point them at the appropriate workflow — do not retroactively scaffold over work in progress.
