# 0003 — Shared agent skills pattern

- **Status**: Accepted
- **Date**: 2026-05-11

## Context

The project is built with the assistance of multiple AI agents (Claude Code as the primary, with Codex and GitHub Copilot also configured). Several reusable skills are useful across agents — for example, a structured commit-message generator, a UI prompt refiner, or a skill-authoring helper.

Two failure modes were anticipated:

1. **Duplication.** If each agent stores its skills under its own conventional path (`.claude/skills/`, `.codex/skills/`, etc.), the same skill content would have to be copy-pasted, and the copies would drift over time.
2. **Implicit upgrades.** External skills (pulled from public repositories such as `anthropics/skills` or `github/awesome-copilot`) can change upstream without warning. Without pinning, an `update` becomes an invisible behavior change in the project's tooling.

## Decision

Adopt a single canonical location for skills, surfaced into each agent's expected path via symlinks, and pin externally-sourced skills by content hash.

### Layout

```
.agents/skills/<name>/SKILL.md     # canonical (source of truth)
.agents/skills/<name>/...            # supporting assets, scripts, references

.claude/skills/<name>              # symlink → ../../.agents/skills/<name>
                                    # (added per agent that supports skills)

skills-lock.json                   # repo-root lockfile pinning external skills
```

### Lockfile format

`skills-lock.json` records, for each externally-sourced skill:

- `source` — the upstream repository or location identifier (e.g., `github/awesome-copilot`).
- `sourceType` — currently `github`; reserved for future source types.
- `skillPath` — the path inside the upstream source where the skill lives.
- `computedHash` — content hash of the skill at the time it was pulled.

Locally-authored skills appear under `.agents/skills/` but are not entries in `skills-lock.json` — there is no upstream to pin them to.

### When to update

- **Pulling a new external skill** — add the directory under `.agents/skills/<name>/`, add an entry to `skills-lock.json`, add the symlink in `.claude/skills/<name>` (and any other agent surface), document the adoption rationale in [AI_WORKFLOW.md](../../AI_WORKFLOW.md).
- **Updating an external skill** — re-pull, recompute the hash, update `skills-lock.json`. A changed hash without an intentional update is a signal of drift.
- **Removing a skill** — remove from `.agents/skills/`, remove all symlinks, remove the lockfile entry, update the inventory in `AI_WORKFLOW.md`.

## Consequences

**Positive**:

- Skills are written once and reused across every agent that follows the SKILL.md convention.
- External skill updates are explicit (hash mismatch is visible in version control).
- New agents (e.g., a future Codex skill surface) can be wired in by adding their own symlink directory without duplicating skill content.

**Negative**:

- Symlinks have weaker cross-platform semantics — Windows checkouts may need the developer mode enabled, and some tooling does not follow symlinks transparently.
- Locally-authored skills sharing the same tree as the product blurs project identity (campfire is a music platform, not a skill-development repo). The current locally-authored skill (`start-ai-assisted-project`) is the bootstrap skill used to create this repo and is kept in-tree as a documented reference; future locally-authored skills should be authored in dedicated repositories unless there is a concrete reason otherwise.

## Not yet decided

- Whether `start-ai-assisted-project` (the locally-authored skill) stays in `campfire` long-term or migrates to its own repository. Revisit if the skill's evolution starts requiring its own commit history and review process distinct from campfire's.
- Whether a tool like `uv tool` or a Makefile target should automate skill installation and hash verification. Defer until the friction of manual maintenance is concretely felt.
