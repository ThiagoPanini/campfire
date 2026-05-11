# AI workflow

How AI tooling is integrated into the flux project.

## Principle

AI tooling — MCP servers, sub-agents, custom slash commands, custom skills — is added **reactively**, in response to concrete and repeated friction. The same rule-of-three that applies to code abstraction applies here: don't build a tool for a problem you've hit once.

This document is the authoritative inventory. If a piece of AI tooling isn't listed here, it isn't part of this project.

## Categories

### MCP servers
None active. Will be added when a session repeatedly needs the same external capability (e.g., a deploy provider's API).

### Sub-agents
None active. Will be added when there is a clearly bounded, repeatable task that benefits from isolated context.

### Custom slash commands
None active. Will be added when there is a multi-step prompt repeated often enough that retyping it costs more than maintaining a command.

### Custom skills
None active. Will be added when there is a body of project-specific knowledge (e.g., a release procedure, a debugging playbook) that benefits from being encoded.

## Promotion criteria

Before adding any AI tool, the answer to all three should be "yes":

1. Have I hit this same friction at least three times?
2. Is the friction stable — i.e., not going to disappear after the next refactor?
3. Will the cost of *maintaining* the tool be less than the cost of *not having* it?

## Removal

Tools that go unused for a month should be removed. Stale AI tooling is worse than no tooling — it suggests capabilities that no longer exist.

## Logging

When tooling is added or removed, note the date and reason in this file. Treat this section as an append-only log.

### Log

- 2026-05-11 — Project bootstrapped. No AI tooling active beyond stock Claude Code.
