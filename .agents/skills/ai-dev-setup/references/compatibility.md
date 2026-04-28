# Compatibility & conflicts

Known good combinations, known friction points, and how to sequence installations.

## Known-good stacks

These combinations are well-tested in practice.

### "Solo maintainer + Claude Code"
- `CLAUDE.md` + Serena MCP + RTK + (optional) Spec Kit + 3–5 skills.
- Minimal surface. Token optimization pays for itself quickly once the repo has real code.

### "Cross-agent team"
- `AGENTS.md` (shared) + `CLAUDE.md` (pointer) + `.github/copilot-instructions.md` + Codex config.
- One MCP server set shared via `.mcp.json` (Claude) + `.vscode/mcp.json` (Copilot) + `~/.codex/config.toml` (Codex).
- RTK optional but helps across all three.

### "Spec-first teams"
- Spec Kit + `speckit-*` skills + constitution + prompts dir.
- Works well with or without MCP; shines when Serena MCP is also present for symbol-aware implement steps.

## Known conflicts

### Two hook frameworks on the same lifecycle event
Symptom: hooks race, one clobbers the other's output, or both run and double-charge tokens.
Example: installing a generic PreToolUse hook for logging when `serena-hooks` already handles PreToolUse.
**Rule**: before adding a hook, check `.claude/settings.json` hooks. Merge into the existing entry for that event rather than adding a second handler.

### Duplicate MCP capability
Symptom: the agent picks an unpredictable server when both expose the same tool name.
Example: two filesystem MCPs, or a GitHub MCP alongside a general-purpose "git" MCP that also exposes PR tools.
**Rule**: each capability should be served by exactly one MCP. If a second server is genuinely needed, scope it (e.g. only enable it in certain projects).

### Overlapping agent instructions
Symptom: instructions drift apart and users don't know which one is authoritative.
Example: `CLAUDE.md`, `.cursorrules`, and Copilot instructions all defining code style differently.
**Rule**: keep the rules in `AGENTS.md`, have agent-specific files point back to it rather than restate.

### Mixed skill registries
Symptom: `skills-lock.json` tracks some skills, others are hand-installed; the registry tool reports drift.
**Rule**: pick one management strategy. If a lockfile exists, put *everything* through it.

### `bypassPermissions` + broad hooks
Symptom: hooks run arbitrary shell on every tool call with no permission check, creating a large attack surface if ever invoked on an untrusted repo.
**Rule**: if `defaultMode: bypassPermissions` is set, keep hook commands to known tools from local, trusted sources. Pin versions where possible.

### `rtk` name collision
The token-saving `rtk` (Rust Token Killer) shares its command name with `rtk` (Rust Type Kit). Probe with `rtk gain` — a real RTK responds; Rust Type Kit errors out.
**Rule**: detect before assuming. `detect.sh` does this.

### Serena MCP + noisy hook loggers
Serena emits its own activity through hooks; layering a second verbose logger on PreToolUse doubles the noise and undoes the token savings.
**Rule**: if Serena hooks are present, don't add generic PreToolUse logging without a strong reason.

## Compatibility matrix (quick reference)

| Combo | Status | Notes |
|-------|--------|-------|
| Serena + RTK | ✅ great | Complementary: semantic navigation + output compression |
| Serena + Caveman | ⚠️ check | Both compress context; evaluate which wins per use case |
| Spec Kit + skills | ✅ great | `speckit-*` skills are designed for this |
| Spec Kit + Constitution | ✅ great | Constitution is the natural companion |
| `AGENTS.md` + `CLAUDE.md` + Copilot instructions | ✅ great | Keep CLAUDE.md and Copilot files thin; link to AGENTS.md |
| Two MCP servers for same capability | ❌ avoid | Pick one |
| Multiple PreToolUse hooks | ⚠️ manual merge | Combine into one handler chain |
| `bypassPermissions` + untrusted hooks | ❌ avoid | Security risk |
| Managed skill registry + hand-installed skills | ❌ avoid | Drift |

## Sequencing rules

When installing multiple components in one session:

1. Add / merge agent instructions first (`AGENTS.md`, `CLAUDE.md`).
2. Install token optimization (RTK) — makes subsequent steps cheaper.
3. Add MCP servers (Serena first, then GitHub, then docs/other).
4. Install Spec Kit if approved.
5. Install / discover skills.
6. Wire hooks and settings last — by now all pieces exist to reference.
7. Validate after each group, not just at the end.

## Escape hatches

If the user insists on a combination flagged here, respect their call but **surface the risk** before doing the write. "You asked for two filesystem MCPs. They'll conflict on tool routing. If you want to proceed anyway, I'll scope the second one to a specific directory — otherwise recommend picking one."
