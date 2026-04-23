# Category: Agent / IDE integration

Wiring for the specific agents and IDEs the team uses. The goal is parity — whichever agent a contributor opens, they see the same context, rules, and tools.

## Supported environments

| Agent / IDE | Primary config | Detection |
|-------------|---------------|-----------|
| Claude Code | `.claude/settings.json`, `.mcp.json`, `CLAUDE.md` | `.claude/`, `CLAUDE.md` |
| VS Code + GitHub Copilot | `.vscode/settings.json`, `.vscode/mcp.json`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md` | `.vscode/`, `.github/copilot-instructions.md` |
| Codex CLI | `~/.codex/config.toml` | `codex --version` available, `~/.codex/` |
| Cursor | `.cursor/rules/`, `.cursor/mcp.json`, `.cursorrules` | `.cursor/`, `.cursorrules` |
| JetBrains AI Assistant | `.idea/` + plugin config | `.idea/` |

## Environment-aware decisions

Apply from the detection profile:

- Only one agent detected → single-agent setup. Don't pile on files other agents would need.
- Multiple agents → shared-source-of-truth pattern: `AGENTS.md` as canonical, others link.
- User-scoped configs (Codex `~/.codex/config.toml`) → do not edit without explicit permission; produce a snippet for the user to paste.

## Claude Code-specific wiring

- **Settings**: `.claude/settings.json` (project) vs. `.claude/settings.local.json` (git-ignored, machine-specific). Prefer project-scoped unless the value is truly per-machine.
- **Hooks**: `SessionStart`, `PreToolUse`, `Stop`, etc. Merge into existing handlers — don't duplicate (see [../compatibility.md](../compatibility.md)).
- **Permissions**: `permissions.allow` allowlist over `bypassPermissions` mode. Narrow allowlists are easier to audit.
- **Skills**: `.claude/skills/<name>/SKILL.md`. Respect a skills registry if present (lockfile → use the registry CLI).
- **MCP**: `.mcp.json` is the project MCP config.

## VS Code / Copilot specifics

- `.github/copilot-instructions.md` is the main instructions file.
- `.github/instructions/*.instructions.md` allows path-scoped instructions (e.g. `infra.instructions.md` that only applies in `terraform/**`). Use when scope is genuine — don't split for splitting's sake.
- `.vscode/settings.json` can set Copilot model, chat mode, and tool preferences. Project scope beats user scope for team consistency.
- `.vscode/mcp.json` for MCP servers.

## Codex specifics

- Config lives at `~/.codex/config.toml` (user scope). Projects are resolved via `--project-from-cwd`.
- Codex GitHub MCP usually needs a PAT: `export GITHUB_PAT_TOKEN="$(gh auth token)"` before starting Codex. Document in `AGENTS.md`.
- Node runtime required.

## Cursor specifics

- `.cursor/rules/*.mdc` is the modern rules format (scoped by glob).
- `.cursorrules` (single file) is the legacy format — migrate to `.cursor/rules/` when possible.
- MCP config in `.cursor/mcp.json`.

## Fit criteria

| Signal | Action |
|--------|--------|
| Only one agent detected | Single-agent config; skip the others |
| Multiple agents, no `AGENTS.md` | Create `AGENTS.md`, then thin per-agent pointer files |
| User has explicitly listed which agents matter | Respect that — don't add files for unlisted agents |
| Codex is a target | Produce a config snippet for the user to add to `~/.codex/config.toml` rather than editing their home dir |

## Install sketch

1. For each detected agent:
   - Back up the agent's config files.
   - Ensure the "context anchor" (`AGENTS.md` or the agent's primary instruction file) points to the shared source of truth.
   - Add/merge MCP server entries if applicable.
2. Mirror MCP config across the needed IDE files (`.mcp.json`, `.vscode/mcp.json`, …).
3. For user-scoped configs (Codex), output a ready-to-paste snippet and instructions.
4. Validate:
   - Open the IDE/agent, confirm instructions load (they appear in session context or equivalent).
   - Confirm MCP servers are reachable.

## Common mistakes

- Adding a Cursor config to a repo nobody uses Cursor for.
- Storing secrets in committed config files. Always use env vars.
- Restating the same rule in four agent-specific files. One source of truth + pointers.
- Writing to `~/.codex/config.toml` on the user's behalf without explicit permission.

## Validation

- Each agent loads its instructions (quick test: open a session, ask the agent what its rules say).
- MCP servers enumerate correctly in each IDE.
- No duplicate or conflicting rules across files.
