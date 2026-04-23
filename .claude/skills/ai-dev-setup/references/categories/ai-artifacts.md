# Category: AI artifacts

Files that shape how agents behave in this repo: instructions, prompts, memory, project-level guidance.

## What belongs here

| Artifact | Purpose | Scope |
|----------|---------|-------|
| `AGENTS.md` | Shared, agent-agnostic rules | Repo |
| `CLAUDE.md` | Claude Code-specific guidance; typically references `AGENTS.md` | Repo |
| `.github/copilot-instructions.md` | GitHub Copilot repo instructions | Repo |
| `.github/instructions/*.instructions.md` | Path-scoped Copilot instructions | Repo, path-scoped |
| `.cursor/rules/` or `.cursorrules` | Cursor rules | Repo |
| `~/.codex/config.toml` | Codex CLI config | User |
| `prompts/` | Versioned prompt library | Repo |
| Skills (`.claude/skills/`, `.agents/skills/`) | Reusable procedural knowledge | Repo |
| Agent memory files (`~/.claude/projects/*/memory/`) | Persistent per-project notes | User |

## Fit criteria

- **Install `AGENTS.md` when** the team uses ≥2 different agents, or you want rules to survive agent changes. Highest-leverage artifact by a wide margin — a small, clear `AGENTS.md` is the anchor everything else references.
- **Install `CLAUDE.md` when** Claude Code is a target. Keep it thin: a 1-paragraph pointer to `AGENTS.md` plus Claude-specific bits (slash commands, hooks, permissions).
- **Install Copilot instructions when** VS Code Copilot is a target. Same rule: thin, reference `AGENTS.md`.
- **Install a `prompts/` directory when** you've noticed yourself writing the same prompt repeatedly, or you're running dated work-records (like this repo's `20260422-*` prompts).
- **Install skills when** a procedure is:
  - repeatable across sessions,
  - larger than a prompt can handle,
  - specialized enough that general agents miss the nuance.

## Patterns

### Good `AGENTS.md` shape (generalizable)

```markdown
# <Project> Agent Instructions

<one-sentence what this project is>.

## Context Rules
- How agents should gather context (narrow-first, symbol-aware, etc.)
- What NOT to do (dump whole dirs, etc.)

## Project Direction
- Stack / architecture choices (only if stable)
- SDD / docs / infra conventions (only if active)

## Agent Workflow
- Where to look before implementing
- How to preserve user changes

## Current State
- What's real vs. planned
- Guidance when referenced artifacts don't yet exist
```

### Anti-patterns

- Copy-pasting the same long rules into 3 different agent files.
- `CLAUDE.md` / `copilot-instructions.md` as a dumping ground for every convention.
- Prompts that are one-offs saved "just in case" — prompts should be durable.
- Skills that are actually prompts (one-shot, non-repeatable).

## Recommend when

| User situation | Recommendation |
|---------------|----------------|
| No agent files at all | `AGENTS.md` first, then `CLAUDE.md` or Copilot pointer depending on detected agent |
| `AGENTS.md` exists, but no `CLAUDE.md` and Claude Code is a target | Thin `CLAUDE.md` that imports from `AGENTS.md` |
| Multiple agent files drifting | Consolidate rules into `AGENTS.md`, thin out the rest |
| Same prompt written repeatedly | Factor into `prompts/` with a dated filename, or a skill if procedural |

## Install sketch

Use the templates in [../../assets/templates/](../../assets/templates/). Apply:

1. `scripts/backup.sh` on the target files.
2. Write or merge the template content.
3. Have the user review the diff before commit.
4. Validate: cat the file, make sure it's < ~150 lines (always-loaded context budget).
