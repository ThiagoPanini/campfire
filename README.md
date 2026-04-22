## AI Tooling And Agentic Context Setup

This repository is configured for a context-efficient AI-assisted development workflow across Claude Code, GitHub Copilot, and Codex. The goal is not to install a broad generic AI stack. The goal is to reduce repeated codebase exploration, avoid noisy terminal output, improve on-demand context retrieval, and keep durable agent instructions small enough to remain useful.

This README section documents only the AI tooling and agentic setup. Product documentation for Campfire can be added later.

### Approved Context Stack

- **RTK (Rust Token Killer)**: CLI proxy used to compress noisy command output before it reaches AI agents.
- **Serena MCP**: semantic code navigation and editing server for symbol-aware lookup, references, and targeted edits.
- **GitHub CLI (`gh`)**: local GitHub workflow automation for authentication, repository metadata, issues, pull requests, releases, and review workflows.
- **GitHub MCP Server**: remote GitHub-aware MCP endpoint for agents. VS Code/Copilot can use OAuth; Codex is configured to read a bearer token from `GITHUB_PAT_TOKEN`.
- **Agent instruction files**: lightweight, versioned guidance for Claude Code, GitHub Copilot, and Codex.
- **Mintlify MCP**: documentation MCP endpoint kept in the shared MCP configuration.

Optional tools such as Context7, Codebase Context, AWS MCP servers, Terraform MCP, and Repomix are intentionally not part of the minimum setup yet. Add them only when Campfire has enough code, infrastructure, or documentation surface to justify the maintenance cost.

### Local Prerequisites

The current setup expects these tools to be available locally:

```bash
rtk --version
uv --version
node --version
npm --version
gh --version
codex --version
claude --version
```

Node is required because Serena language servers and Codex CLI both need a Linux/WSL Node runtime. In this workspace, Node was installed under a local `nodeenv` and exposed through `~/.local/bin`.

GitHub CLI is installed in user space:

```bash
~/.local/bin/gh
```

Authenticate GitHub CLI before using GitHub automation:

```bash
rtk gh auth login
rtk gh auth status
rtk gh repo view --json nameWithOwner,url,defaultBranchRef
```

For Codex GitHub MCP access, export a token in the shell that starts Codex:

```bash
export GITHUB_PAT_TOKEN="$(gh auth token)"
```

Do not commit GitHub tokens. Local secret files such as `.env` are ignored by Git.

### Agent Context Files

The always-loaded context is intentionally small:

- `AGENTS.md`: shared instructions for all coding agents.
- `CLAUDE.md`: Claude-specific pointer to shared rules plus Claude Code usage notes.
- `.github/copilot-instructions.md`: GitHub Copilot repository instructions, including RTK guidance.
- `.github/instructions/spec-kit.instructions.md`: scoped guidance for Spec-Kit and AI assets.
- `.github/instructions/infra.instructions.md`: scoped guidance for future Terraform/AWS files.
- `docs/ai/context-optimization.md`: human-readable reference for the context strategy.

Keep these files concise. If guidance grows large, move details into focused docs or skills and link to them instead of expanding the always-loaded prompt surface.

### MCP Configuration

Shared MCP configuration lives in:

- `.mcp.json`: Claude Code project MCP configuration.
- `.vscode/mcp.json`: VS Code / GitHub Copilot MCP configuration.
- `~/.codex/config.toml`: Codex MCP configuration.

Serena is configured as a local stdio MCP server. Claude Code and VS Code receive project-scoped configuration; Codex uses a user-level config with `--project-from-cwd`.

GitHub MCP uses the official remote endpoint:

```text
https://api.githubcopilot.com/mcp/
```

For VS Code/Copilot, authenticate through the OAuth/tool prompt in Agent mode. For Codex, set `GITHUB_PAT_TOKEN` before starting Codex. Claude Code was not left with a GitHub MCP entry because the unauthenticated remote server failed health checks; use `gh` directly there until a clean OAuth/token flow is configured.

### RTK Usage

Agents should prefix shell commands with `rtk`:

```bash
rtk git status
rtk rg --files
rtk npm test
rtk pytest -q
rtk terraform plan
rtk gh issue list
```

Useful RTK checks:

```bash
rtk gain
rtk gain --history
rtk init --show
```

Use `rtk proxy <command>` when raw command output is needed but usage should still be tracked.

### Serena Usage

Serena should be used before broad file reads when working with source code. Prefer symbolic lookup and narrow retrieval over loading whole files or directories.

Useful verification commands:

```bash
rtk serena project index . --timeout 20
rtk claude mcp list
rtk codex mcp list
rtk codex mcp get serena
```

The project-level Serena config is stored in `.serena/project.yml`. Generated Serena cache and logs are ignored by Git.

### GitHub CLI And GitHub MCP Usage

Use `gh` for local GitHub workflows that do not require an agent tool call:

```bash
rtk gh auth status
rtk gh repo view
rtk gh issue list
rtk gh pr list
rtk gh pr create
```

Use GitHub MCP when an agent needs GitHub context directly, such as finding linked issues, reading PR metadata, or coordinating issue/task workflows without manual copy-paste.

Codex verification:

```bash
rtk codex mcp list
rtk codex mcp get github
```

VS Code/Copilot verification happens in Agent mode through the MCP tools picker.

### First-Day Workflow

1. Start from the relevant Spec-Kit artifact when one exists.
2. Use Serena for code structure, symbol references, and targeted edits.
3. Use `rg` or `rg --files` for focused text and file discovery.
4. Run shell commands through `rtk`.
5. Use `gh` for repository metadata, issues, PRs, and authentication checks.
6. Use GitHub MCP only when the agent benefits from GitHub context inside the conversation.
7. Record durable decisions in focused docs instead of repeating them in chat.
8. Avoid packing the full repository unless doing a one-off audit or external handoff.

### Verification Checklist

Before relying on the AI tooling setup, confirm:

- `rtk init --show` reports RTK enabled for local instructions.
- `rtk claude mcp list` shows Serena connected.
- `rtk codex mcp list` shows Serena enabled.
- `rtk codex mcp get github` shows the GitHub MCP server configured.
- `gh auth status` shows an authenticated GitHub account before using `gh` workflows.
- `GITHUB_PAT_TOKEN` is set before using GitHub MCP from Codex.
- VS Code Copilot Agent mode shows Serena and GitHub in the MCP tools picker.
- `.mcp.json`, `.vscode/mcp.json`, and `.claude/settings.json` are valid JSON.
- `.serena/project.yml` is present and versioned.

### Maintenance Notes

- Review `AGENTS.md`, `CLAUDE.md`, and Copilot instructions periodically for stale or duplicated rules.
- Run `rtk gain` occasionally to confirm terminal-output savings remain meaningful.
- Keep GitHub tokens out of the repository.
- Update Serena with:

```bash
rtk uv tool upgrade serena-agent --prerelease=allow
```

- Update GitHub CLI by installing the latest official release into `~/.local/share/gh` and refreshing the `~/.local/bin/gh` symlink.
- Add more MCP servers only when they clearly reduce context waste for recurring work.
- When Terraform source lands, consider adding `terraform` to `.serena/project.yml`.

### Troubleshooting

- If Claude Code cannot see Serena, restart Claude Code and run `rtk claude mcp list`.
- If Copilot ignores MCP tools, switch to Agent mode and enable Serena/GitHub in the tools picker.
- If Codex resolves to a broken Windows npm install inside WSL, ensure the Linux `codex` executable appears first on `PATH`.
- If GitHub MCP fails in Codex, confirm `GITHUB_PAT_TOKEN` is exported in the same shell session.
- If `gh` says you are not logged in, run `rtk gh auth login`.
- If Serena is slow on first use, allow it to download and initialize language servers.
- If context is still too large, shrink always-loaded instruction files and move details into focused docs.
