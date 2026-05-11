# AI workflow

How AI is integrated into the development of `tossit`. This document is small on purpose: tooling is added reactively, when concrete friction justifies it.

## Principles

1. **Reactive, not proactive.** Custom slash commands, sub-agents, MCPs, and skills are added only when the same friction has been hit at least three times.
2. **Project-scoped first.** Tools that benefit only this repo live in `.claude/` and are checked in. Tools that prove broadly useful get promoted to the global Claude config.
3. **Reviewable like code.** Every AI tool added to the repo (slash command, agent, hook) lands in a normal commit with a short rationale in the message.
4. **No silent prompts.** System prompts and skill instructions are committed files, not invisible context.

## Categories

- **Conventions** — `CLAUDE.md`, `AGENTS.md`. The single source of truth for how to write code here.
- **Decisions** — `docs/decisions/`. ADRs for anything an AI session might otherwise re-litigate.
- **Slash commands** — `.claude/commands/`. Added when the same multi-step prompt is typed three times.
- **Sub-agents** — `.claude/agents/`. Added when a clearly bounded, repeated task wants its own context window.
- **Skills** — `.claude/skills/`. Added when a workflow has enough structure to deserve a dedicated playbook.
- **MCPs** — listed here, not auto-installed. Added when external system access (issue tracker, deploy provider) is a recurring need.

## Active inventory

None yet. The project is at the bootstrap stage; the only "AI tooling" in play is this file plus `CLAUDE.md` and `AGENTS.md`.

When the first item is added, append it here with a one-line description and a link to the relevant file.
