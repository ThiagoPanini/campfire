# Category: MCP servers

Model Context Protocol servers extend what agents can do beyond their built-in tools.

## Configuration files

| File | Consumer |
|------|----------|
| `.mcp.json` | Claude Code (project scope) |
| `.vscode/mcp.json` | VS Code / GitHub Copilot |
| `.cursor/mcp.json` | Cursor |
| `~/.codex/config.toml` | Codex (user scope; project-from-cwd flag resolves to project) |

Keep these in sync — or at minimum, declare which is authoritative. The simplest strategy: one shared server list, mirrored across whichever configs the detected agents need.

## Candidate servers

### Serena MCP
- **Transport**: stdio (local)
- **Purpose**: Symbol-aware code navigation and editing (find references, symbol search, targeted edits)
- **Fit**: Any repo with real source code. Especially good for Python, TypeScript, Rust, Go, Java.
- **Install**: via Serena CLI or project config. Stores project config in `.serena/`.
- **Pair with**: RTK (complementary: Serena narrows *what* context, RTK compresses *shell output*).

### GitHub MCP (remote or Copilot)
- **Transport**: HTTP (OAuth for Claude/Copilot; bearer token for Codex)
- **Purpose**: Issues, PRs, workflow runs, repo metadata from inside the agent
- **Fit**: Repos hosted on GitHub where PR/issue flow is active
- **Config gotcha**: Codex needs `GITHUB_PAT_TOKEN` exported before start; document this in `AGENTS.md`.

### Mintlify MCP
- **Transport**: HTTP
- **URL**: `https://mintlify.com/docs/mcp`
- **Purpose**: Query docs sites hosted on Mintlify
- **Fit**: Repos using Mintlify or teams that reference Mintlify-hosted docs

### Filesystem MCP
- **Transport**: stdio
- **Purpose**: Scoped filesystem access outside the repo root
- **Fit**: Rarely — the agent usually has enough file-tool access already. Propose only when a workflow genuinely needs cross-repo reads.

### Database / Infra MCPs
- **Examples**: postgres, sqlite, AWS MCPs, Terraform MCP
- **Fit**: Only when the corresponding stack exists in the repo. Terraform MCP in a repo with no `.tf` files is dead weight.

### Browser / Testing MCPs
- **Examples**: Puppeteer, Playwright MCP
- **Fit**: Projects with a frontend under test. Defer otherwise.

## Fit criteria

| Signal | Action |
|--------|--------|
| Real source code + Claude Code/VS Code | ✅ Serena (almost always) |
| GitHub remote + active PRs | ✅ GitHub MCP |
| Uses Mintlify docs | ✅ Mintlify MCP |
| No backend yet | ❌ DB MCPs; defer |
| No frontend yet | ❌ browser MCPs; defer |
| Two MCPs with overlapping capability | ❌ pick one |

## Install sketch

1. Read existing `.mcp.json` (and any per-IDE config). Back up.
2. Merge the new server block in rather than rewriting the file. Example for `.mcp.json`:
   ```json
   {
     "mcpServers": {
       "mintlify": { "type": "http", "url": "https://mintlify.com/docs/mcp" },
       "serena": { "command": "serena", "args": ["mcp", "--project-from-cwd"] }
     }
   }
   ```
3. Mirror (or symlink, or repoint) to the IDE-specific config files if other agents are targets.
4. Add setup steps to `AGENTS.md` for anything requiring env vars (`GITHUB_PAT_TOKEN`, etc.).
5. Validate: start a session, confirm the server shows up in the tool list. For Serena, confirm a symbol lookup works.

## Common mistakes

- Committing secrets inside MCP config. Always use env vars.
- Adding an MCP that hasn't been matched to an agent (no one will use it).
- Installing both a general-purpose git MCP and a GitHub MCP — pick one.
- Hardcoding absolute user paths in project-scoped configs.

## Validation

- `jq . .mcp.json` (valid JSON)
- For stdio servers: `command -v <server>` on PATH, or full path declared
- Start the host (Claude Code / VS Code) and confirm the server appears
- Exercise one tool from each server (e.g. a Serena symbol search) before declaring success
