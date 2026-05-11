# AI_WORKFLOW.md

How AI tooling is integrated into `campaign-chronicler`. The point of this file is to keep the AI workflow visible and intentional — so we can tell the difference between tools that earn their keep and tools that just exist.

## Principles

1. **Reactive, not proactive.** A tool, MCP, sub-agent, or custom skill is added only when concrete, repeated friction justifies it. No speculative tooling.
2. **Discoverable.** Every active piece of AI tooling is listed here, with a one-line reason it exists.
3. **Removable.** If a tool stops paying for itself, it gets removed and noted in the changelog below.

## Categories of tooling

- **Session context** — `CLAUDE.md`, `AGENTS.md`, ADRs. Always-on.
- **Slash commands** — short, repeatable workflows that we run often enough to deserve a shortcut.
- **Sub-agents** — focused agents for delegated tasks (e.g. reviewing a PR, drafting an ADR).
- **Skills** — packaged capabilities pulled in only when a matching trigger fires.
- **MCPs** — external integrations (databases, deploy providers, issue trackers).

## Active inventory

Nothing yet beyond the always-on context files. Entries land here as concrete friction shows up.

| Type | Name | Reason | Added |
|------|------|--------|-------|

## Changelog

- 2026-05-11 — Repository bootstrapped. No custom AI tooling yet.
