# AI_WORKFLOW.md

How AI assistants are integrated into the campaign-chronicler project: categories of tooling, principles for adoption, and the active inventory.

This document is a **living inventory**. The sections covering categories and principles are stable; the *Active inventory* and *Deferred / under consideration* sections are updated as tools are adopted or evaluated.

## Why this document exists

campaign-chronicler is built primarily through AI-assisted development. Treating AI as a first-class collaborator means treating its tooling as a first-class concern — what we use, why we use it, and when we adopt it.

The companion document [CLAUDE.md](./CLAUDE.md) defines per-session conventions for the primary agent. This document defines the broader workflow: which categories of tooling exist, the principles for adopting them, and what is currently in use.

## Categories of AI tooling

The locations below assume Claude Code conventions. Codex and GitHub Copilot do not currently expose equivalent extensibility primitives — for those agents, only the *Project instructions* row applies.

| Category | What it is | Where it lives |
|---|---|---|
| Project instructions | Repository-level context the agent reads at session start | `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md` |
| Slash commands | User-invokable commands that expand into prompts | `.claude/commands/<name>.md` |
| Sub-agents | Specialized agents the primary agent can delegate to | `.claude/agents/<name>.md` |
| Skills | Reusable, packaged capabilities with their own instructions and assets | `.claude/skills/<name>/SKILL.md` |
| MCPs | Model Context Protocol servers exposing external tools to the agent | Configured in `.claude/settings.json` |
| Hooks | Shell commands triggered by harness events (tool calls, session lifecycle) | Configured in `.claude/settings.json` |

## Principles

1. **Reactive adoption.** A tool enters the project when concrete, repeated friction justifies it — not when it sounds promising. Premature tooling is premature architecture in another costume.

2. **One canonical instruction file.** [CLAUDE.md](./CLAUDE.md) is the source of truth for project conventions. Other agent-specific instruction files (`AGENTS.md`, `.github/copilot-instructions.md`) carry a condensed mirror and point back to `CLAUDE.md` for full detail.

3. **No empty directories.** `.claude/commands/`, `.claude/agents/`, and `.claude/skills/` are created when their first artifact exists, not before.

4. **Document the methodology, not just the inventory.** When a tool is adopted, this document explains *why* it was needed — not only *that* it exists.

## Multi-agent support

The repository is structured to be readable by multiple AI agents:

- **Claude Code** — primary agent. Reads `CLAUDE.md` and any `.claude/` configuration.
- **Codex (OpenAI)** — reads `AGENTS.md`.
- **GitHub Copilot** — reads `.github/copilot-instructions.md` (and optional path-scoped instructions in `.github/instructions/*.instructions.md`).

To avoid drift, `AGENTS.md` and `.github/copilot-instructions.md` carry only the high-leverage shared content (project description, layout, principles, language convention, common pitfalls) and link to `CLAUDE.md` for the rest. Agent-specific tooling (skills, sub-agents, hooks) lives in tool-specific directories and is not duplicated.

## Active inventory

Tools, skills, MCPs, and frameworks currently in active use on this project.

_No tools currently in active use. This section becomes a table when the first item is adopted._

## Deferred / under consideration

Items the author has used elsewhere or wants to evaluate, but not yet adopted here.

_None at the moment._
