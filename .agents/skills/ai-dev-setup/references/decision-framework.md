# Decision framework

How to choose *whether* to add a tool, and *which* one. The goal is fit, not maximal installation.

## The seven questions

For every candidate tool or artifact, answer all seven before proposing it. If any answer is "no" or "unclear", default to **defer**.

1. **Will this repo actually use it in the next 4–6 weeks?**
   If the stack doesn't exist yet (e.g. Terraform MCP in a repo with no `.tf` files), the tool is premature. It drifts, gets stale, and adds noise.

2. **Does it fit the detected agent(s)?**
   A Cursor-only config is dead weight in a Claude-Code-only repo. Match proposals to `ai_artifacts` from the detection profile.

3. **Does it overlap with anything already installed?**
   Two MCP servers exposing the same capability cause routing confusion. A second agent-instructions format without purpose adds duplication. See [compatibility.md](compatibility.md) for known conflicts.

4. **What's the per-session / per-commit cost?**
   Hooks that run on every tool call, servers that spin up at session start, instructions loaded on every prompt — these compound. If the cost > the benefit for typical usage, defer.

5. **Is it maintained?**
   Prefer tools with recent releases, active issues, or an owning vendor. An unmaintained MCP server with stale transport code is a time bomb.

6. **Can the user (or team) uninstall it easily?**
   Tools that hook into many places (global shims, persistent daemons, modified PATH) are hard to leave behind. Prefer tools with a clean "remove" path.

7. **Does it respect secrets and permissions?**
   Anything that requires a token should use env vars, not hard-coded config. Anything that writes outside the repo should be flagged.

## The "defer" list

A healthy setup has things you deliberately *don't* install. Maintain this list in the final report. Examples from the campfire repo's philosophy that generalize:

- Context7, AWS MCP servers, Terraform MCP, Repomix: **defer until the matching stack exists**.
- Extra agent-instruction files for agents the team doesn't use: defer.
- Token optimization when the repo is tiny and sessions are short: defer (overhead > benefit).

## Install-vs-defer decision table

| Signal | Lean toward install | Lean toward defer |
|--------|----------------------|-------------------|
| Token use pain reported | ✅ token optimization | |
| Cross-agent team (Claude + Copilot + Codex) | ✅ shared `AGENTS.md`, MCP | |
| Many specs/features planned | ✅ SDD | |
| Greenfield, no code yet | Minimal baseline only | ❌ deep stack-specific MCP |
| Already has skills-lock.json | Route skills via the registry | ❌ direct skill installs |
| Repo has `CLAUDE.md` reflecting strong philosophy | Merge / extend | ❌ wholesale rewrite |
| Repo has a hook framework (e.g. serena-hooks) | Work within it | ❌ install a second hook framework |

## Ordering principle

Install in this order when multiple categories are approved:

1. **Agent instructions first** (`AGENTS.md`, `CLAUDE.md` etc.). They anchor everything else.
2. **Token optimization** (RTK, Serena). They make the next steps cheaper.
3. **MCP servers** (Serena, GitHub, docs). They extend agent capability.
4. **SDD** (Spec Kit). Benefits from MCP + skills being present first.
5. **Skills** (per-category). Install last so they can reference everything above.
6. **Hooks & settings** wiring. After the pieces exist, wire them together.

Doing it in this order means each step has a sensible environment and each piece can be validated independently.

## Common anti-recommendations

Call these out when proposed:

- "Install every popular MCP server" — too much surface, too many tokens per session.
- "Add both Cursor rules and Claude memory when the team uses only one" — unnecessary duplication.
- "Build a custom skill for a one-off task" — that's a prompt, not a skill.
- "Add a global Claude hook for a project-specific behavior" — use project-scope.
- "Enable `bypassPermissions` mode globally" — prefer narrower permission allowlists per tool.
