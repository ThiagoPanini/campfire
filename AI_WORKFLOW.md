# AI_WORKFLOW.md

How AI assistants are integrated into the campfire project: categories of tooling, principles for adoption, and the active inventory.

This document is a **living inventory**. The sections covering categories and principles are stable; the *Active inventory* and *Deferred / under consideration* sections are updated as tools are adopted or evaluated.

## Why this document exists

campfire is built primarily through AI-assisted development. Treating AI as a first-class collaborator means treating its tooling as a first-class concern — what we use, why we use it, and when we adopt it.

The companion document [CLAUDE.md](./CLAUDE.md) defines per-session conventions for the primary agent. This document defines the broader workflow: which categories of tooling exist, the principles for adopting them, and what is currently in use.

## Categories of AI tooling

The locations below assume Claude Code conventions. Codex and GitHub Copilot do not currently expose equivalent extensibility primitives — for those agents, only the *Project instructions* row applies.

| Category | What it is | Where it lives |
|---|---|---|
| Project instructions | Repository-level context the agent reads at session start | `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md` |
| Slash commands | User-invokable commands that expand into prompts | `.claude/commands/<name>.md` |
| Sub-agents | Specialized agents the primary agent can delegate to | `.claude/agents/<name>.md` |
| Skills (canonical) | Reusable, packaged capabilities with their own instructions and assets. Stored once, surfaced to each agent via that agent's expected path | `.agents/skills/<name>/SKILL.md` |
| Skills (Claude Code surface) | Per-agent symlinks pointing at the canonical skill directory | `.claude/skills/<name>` → `../../.agents/skills/<name>` |
| Skills lockfile | Pins externally-sourced skills by source + content hash | `skills-lock.json` at the repo root |
| MCPs | Model Context Protocol servers exposing external tools to the agent | Configured in `.claude/settings.json` (committed, repo-wide) or `.claude/settings.local.json` (gitignored, per-developer override) |
| Hooks | Shell commands triggered by harness events (tool calls, session lifecycle) | Configured in `.claude/settings.json` / `.claude/settings.local.json` |
| Spec frameworks | Spec-driven development tooling (e.g., Spec-Kit) | Tool-specific directories created on adoption |

## Principles

1. **Reactive adoption.** A tool enters the project when concrete, repeated friction justifies it — not when it sounds promising. Premature tooling is premature architecture in another costume.

2. **One canonical instruction file.** [CLAUDE.md](./CLAUDE.md) is the source of truth for project conventions. [AGENTS.md](./AGENTS.md) and [.github/copilot-instructions.md](./.github/copilot-instructions.md) carry a condensed mirror for agents that follow those conventions, and point back to `CLAUDE.md` for full detail.

3. **No empty agent-tooling directories.** Subdirectories of `.claude/` (commands, agents, skills) and `.agents/skills/` are created when their first artifact exists, not before. This rule scopes to AI-tooling directories specifically — `apps/` and `packages/` are allowed to carry `.gitkeep` placeholders until their first runnable code arrives, per the convention in [CLAUDE.md](./CLAUDE.md).

4. **Document the methodology, not just the inventory.** When a tool is adopted, this document explains *why* it was needed — not only *that* it exists.

5. **Spec-driven work has a threshold.** Spec frameworks (e.g., Spec-Kit) introduce structure that pays off once feature work is underway and the MVP shape is known. Until then, the overhead exceeds the benefit.

## Multi-agent support

The repository is structured to be readable by multiple AI agents:

- **Claude Code** — primary agent. Reads `CLAUDE.md` and any `.claude/` configuration.
- **Codex (OpenAI)** — reads `AGENTS.md`.
- **GitHub Copilot** — reads `.github/copilot-instructions.md` (and optional path-scoped instructions in `.github/instructions/*.instructions.md`).

To avoid drift, `AGENTS.md` and `.github/copilot-instructions.md` carry only the high-leverage shared content (project description, layout, principles, language convention, common pitfalls) and link to `CLAUDE.md` for the rest. Agent-specific instruction files live in tool-specific paths and are not duplicated.

### Shared skills across agents

Skills themselves are written once and shared. The canonical location is `.agents/skills/<name>/`. Each agent that supports skills exposes them via its own expected path as a symlink (Claude Code: `.claude/skills/<name>` → `../../.agents/skills/<name>`). New agents that follow the same skill format can be wired in by adding their own symlink directory; the skill content does not duplicate.

Externally-sourced skills are pinned in `skills-lock.json` at the repo root, which records each skill's `source`, `sourceType`, `skillPath`, and `computedHash` so updates from upstream are deliberate, not implicit.

## Design workflow

When the design phase begins (after `PRODUCT.md` and `docs/mvp-scope.md` are drafted), this section will be filled in: which tools generate mockups and prototypes, where artifacts are stored, and how they hand off to implementation.

## Active inventory

Tools, skills, MCPs, and frameworks currently in active use on this project. The shared-skills pattern is documented in [ADR 0003](./docs/decisions/0003-shared-agent-skills.md).

### Skills

| Skill | Source | Adopted because |
|---|---|---|
| `start-ai-assisted-project` | locally authored | bootstrapped this repo's foundation; kept in-tree as the canonical reference implementation of the bootstrap flow. |
| `enhance-prompt` | [google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills) | refines vague UI/UX prompts before generation. |
| `git-commit` | [github/awesome-copilot](https://github.com/github/awesome-copilot) | structures conventional commit messages from the staged diff. |
| `skill-creator` | [anthropics/skills](https://github.com/anthropics/skills) | authors and evaluates new skills. |

External skills are pinned by content hash in [skills-lock.json](./skills-lock.json).

### Other categories

No MCPs, sub-agents, slash commands, hooks, or spec frameworks currently in active use. Each becomes a table or list entry when the first item is adopted.

## Deferred / under consideration

Items the author has used elsewhere or wants to evaluate, but not yet adopted here.

| Item | Category | Notes |
|---|---|---|
| Spec-Kit | Spec framework | Evaluate when MVP scope is locked and feature implementation begins. |
