# Category: Token / context optimization

Tools and patterns that reduce the per-session cost of AI-assisted development.

## Why it matters

AI-assisted workflows compound. Each wasted tool call, each noisy shell output, each unnecessary whole-file read adds to context use, latency, and dollar cost. Optimization tools typically pay for their own setup within a few sessions on a non-trivial repo.

## Candidates

### RTK (Rust Token Killer)
- **What**: CLI proxy that filters and compresses shell command output.
- **Effect**: 60–90% token savings on typical dev commands (git, docker, npm, test runners).
- **Integration**: agents are instructed to prefix shell commands with `rtk`. Works by scoped allowlist + output filtering.
- **Verify install**: `rtk --version` + `rtk gain` (a second `rtk` — Rust Type Kit — shares the binary name; `rtk gain` distinguishes the right one).
- **Fit**: Any repo where shell output is part of the agent loop. Almost always a yes.

### Serena MCP (as an optimization)
- **What**: Covered in [mcp.md](mcp.md) but worth calling out here: its *effect* is a context optimizer. Symbol-level queries replace whole-file reads.
- **Fit**: Any repo with real source code.
- **Overlap**: Complementary with RTK, not redundant (RTK handles shell noise, Serena handles code reading).

### Caveman
- **What**: Alternative context compression CLI.
- **Fit**: Evaluate against RTK. Pick one unless there's a strong differentiator.

### Serena Slim
- **What**: Lighter-weight Serena variant for smaller projects.
- **Fit**: When full Serena feels heavy for a small repo, or when the hosting environment has tight resource limits.

## Output-shaping strategies (not tools, but habits)

These are things you encode in `AGENTS.md` so every agent does them:

- Prefer narrow, targeted reads over broad directory scans.
- Use `rg` / `rg --files` instead of raw `find` + `cat`.
- Avoid dumping generated artifacts (build output, logs, lockfiles) into context.
- Quote specific line ranges when discussing code.
- For long outputs, summarize rather than paste.

A 5-bullet "Context Rules" block at the top of `AGENTS.md` carries a lot of weight.

## Fit criteria

| Situation | Recommendation |
|-----------|----------------|
| Active dev with frequent shell use | Install RTK |
| Real source code | Install Serena (as MCP) |
| Small, rarely-changing repo | Context rules in `AGENTS.md` may be enough alone |
| Already has RTK | Do not propose Caveman; they overlap |
| Resource-constrained environment | Consider Serena Slim over full Serena |

## Install sketch

### RTK
1. Install the binary (follow RTK project docs; do not auto-install without user approval).
2. Verify: `rtk --version && rtk gain`.
3. Document in `AGENTS.md` / `copilot-instructions.md` the convention to prefix shell commands with `rtk`.
4. Optionally wire a Claude Code hook to auto-prefix (only if the user asks; hooks that rewrite commands are powerful and should be explicit).

### Serena
1. Install Serena CLI (see Serena docs).
2. Add to MCP configs (per [mcp.md](mcp.md)).
3. Optionally wire lifecycle hooks (`serena-hooks activate`, `serena-hooks remind`, etc.) into `.claude/settings.json`. These are already-productized integration hooks — use them as-is, don't rebuild.
4. Validate: `.serena/` exists, hooks fire on session start, a symbol lookup works.

## Common mistakes

- Installing a second context-compression tool when one is already present.
- Enabling a verbose logging hook that undoes the savings.
- Forgetting to document the `rtk`-prefix convention — tools don't help if agents don't use them.
- Using `rtk proxy <cmd>` by default (that skips filtering) — keep it for debugging only.

## Validation

- `rtk gain` shows accumulated savings over time — a good ongoing signal.
- Serena: `.serena/project.yml` exists, symbol lookups return results.
- Spot-check by running a representative session and eyeballing whether obvious wins (compressed `git status`, symbol-scoped reads) actually happened.
