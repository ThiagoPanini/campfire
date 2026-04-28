# Detection

Before recommending anything, build an accurate picture of the repository. Use `scripts/detect.sh` when available; fall back to the checklist below.

## What to detect and why

Each signal maps to a downstream decision. The point of detection isn't to be exhaustive — it's to avoid proposing things that are already there, conflict with what's there, or don't fit the repo's shape.

### 1. Project shape

| Signal | Files / signs | Implies |
|--------|--------------|--------|
| Language / runtime | `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `*.csproj` | Which MCP servers and skills are relevant (e.g. `fastapi-python` for Python+web) |
| Package manager | `uv.lock`, `poetry.lock`, `pnpm-lock.yaml`, `bun.lockb` | Whether to propose `uv-package-manager` skill, etc. |
| Test/build | `pytest.ini`, `jest.config.*`, `Makefile`, `justfile`, CI files | Whether a test-runner MCP or command-wrapping tool makes sense |
| IaC / infra | `*.tf`, `cdk.json`, `docker-compose.yml`, `k8s/` | Whether Terraform/AWS MCPs, infra skills are relevant |
| Docs | `docs/`, `mintlify.json`, `mkdocs.yml`, `docusaurus.config.*` | Whether to propose docs-oriented MCP (e.g. Mintlify) |
| Maturity | LOC, test presence, README length | Greenfield → bootstrap mode; mature → optimize mode |

### 2. Existing AI artifacts

| File / dir | Meaning |
|-----------|---------|
| `CLAUDE.md` | Claude Code is a target — preserve and merge, don't rewrite |
| `AGENTS.md` | Cross-agent instructions — treat as authoritative shared rules |
| `.github/copilot-instructions.md` | Copilot is a target |
| `.github/instructions/*.instructions.md` | Scoped Copilot instructions — respect path-based scoping |
| `.cursor/rules/`, `.cursorrules` | Cursor is a target |
| `.codex/`, `~/.codex/config.toml` | Codex is a target |
| `.claude/skills/` | Project-scoped Claude skills |
| `.agents/skills/` | Shared skills directory (e.g. managed by a skill registry) |
| `prompts/` or `.prompts/` | Versioned prompt library |
| `skills-lock.json`, `skills.lock.yaml` | A skill-registry tool is managing installs — **do not hand-install** into the managed dir; use the registry's CLI or tell the user |
| `find-skills` skill (project or `~/.claude/skills/`) or `npx skills --help` works | Discovery prerequisite for Phase 3 is satisfied. If neither is present, propose installing `find-skills` (Vercel/`skills.sh`) before searching |

### 3. MCP configuration

| File | Scope |
|------|-------|
| `.mcp.json` | Claude Code project MCP |
| `.vscode/mcp.json` | VS Code / Copilot MCP |
| `~/.codex/config.toml` | Codex MCP (user-level; read-only inspection if accessible) |
| `.mcp.local.json` | Local overrides — should be gitignored |

For each config, inventory servers present (`serena`, `github`, `mintlify`, ...) to avoid duplicate additions and detect redundant capability overlap.

### 4. Token/context optimization signals

| Signal | Tool |
|-------|------|
| `.serena/project.yml`, `.serena/` present | Serena MCP is configured |
| `serena-hooks` command in `.claude/settings.json` hooks | Serena is wired into Claude Code lifecycle |
| `rtk` on PATH | RTK installed (verify with `rtk --version`; beware the `rtk` Rust Type Kit collision — test `rtk gain`) |
| RTK references in agent instructions | The team already has RTK-first conventions |
| `.caveman/` or `caveman.yaml` | Caveman context compression |
| `serena-slim` references in config | Serena Slim variant in use |

### 5. SDD signals

| Signal | Implies |
|--------|--------|
| `.specify/` directory | Spec Kit installed |
| `speckit-*` skills present | Spec Kit + skills integration |
| `specs/`, `plans/`, `tasks/` at root | Custom SDD or manual Spec Kit layout |
| `CONSTITUTION.md` or `.specify/memory/constitution.md` | Project constitution exists |

### 6. Hooks / settings

| File | Check for |
|------|----------|
| `.claude/settings.json` | Hook handlers (SessionStart, PreToolUse, Stop), permission allowlist |
| `.claude/settings.local.json` | Local overrides — note `defaultMode: bypassPermissions` means user accepts permissive mode |
| `.vscode/settings.json` | Editor-level AI settings |

### 7. Git state

- Branch name (are we on a feature branch or main?)
- Clean vs. dirty (warn on dirty; offer to stash or branch before writes)
- Remote (github.com vs. self-hosted; informs which GitHub MCP to suggest)
- `.gitignore` contents (avoid committing local configs, `.ai-dev-setup/changelog.md`)

## How to interpret the signals

**Greenfield**: little-to-no code, sparse README, no agent files. → propose `bootstrap` mode with a minimal baseline (one agent instruction file + one MCP + token optimization if cross-agent). Don't pile on SDD and 10 skills on day one.

**Existing code, no AI setup**: real code, maybe a README, no `CLAUDE.md`. → `bootstrap` mode but informed by the stack. Propose agent instructions that reference actual project conventions (by reading the code).

**Partial AI setup**: some agent files, one or two MCP servers, ad-hoc. → `optimize` mode. Focus on gaps and conflicts first, novelty second.

**Mature AI setup** (like this campfire repo): multi-agent instructions, Serena+RTK+Spec Kit, skill registry, documented philosophy. → `audit` mode by default. The bar for proposing additions is high — each must be justified against the stated philosophy (e.g. campfire's README explicitly defers Context7/AWS/Terraform MCPs until justified).

**Managed skills**: if `skills-lock.json` or equivalent is present, route skill installs through the registry tool. Never write directly into a managed skills directory.

## Fallback checklist (when detect.sh is unavailable)

Run these probes by hand:

```bash
# Project shape
ls -la              # top-level files
find . -maxdepth 2 -name '*.toml' -o -name '*.json' -o -name 'Makefile' | head

# Agent files
ls CLAUDE.md AGENTS.md .github/copilot-instructions.md 2>/dev/null
ls .cursor/ .cursorrules 2>/dev/null

# Skills & registries
ls .claude/skills/ .agents/skills/ 2>/dev/null
ls skills-lock.json skills.lock.yaml 2>/dev/null

# MCP
ls .mcp.json .vscode/mcp.json 2>/dev/null

# Token optimization
ls .serena/ 2>/dev/null
command -v rtk && rtk --version && rtk gain >/dev/null 2>&1 && echo 'rtk: real' || echo 'rtk: missing or collision'

# SDD
ls .specify/ specs/ 2>/dev/null

# Git
git status --porcelain && git rev-parse --abbrev-ref HEAD
```

Report findings in the same 7-section shape as the JSON profile so the downstream logic doesn't care which path was taken.

## Producing the profile

Whether from script or checklist, normalize into this JSON shape (so the rest of the skill has one contract):

```json
{
  "project": {"type": "python|node|rust|mixed|unknown", "langs": [...], "pkg_mgr": "uv|npm|...", "maturity": "greenfield|early|mature"},
  "ai_artifacts": {"claude_md": true, "agents_md": true, "copilot": false, "codex": false, "cursor": false, "skills_dirs": [".claude/skills", ".agents/skills"], "skill_registry": "skills-lock.json", "find_skills": true, "skills_cli": true},
  "mcp": {"configs": [".mcp.json", ".vscode/mcp.json"], "servers": ["mintlify", "serena", "github"]},
  "token_opt": {"serena": true, "rtk": true, "caveman": false},
  "sdd": {"specify": true, "constitution": true},
  "hooks": {"claude_session_start": true, "claude_pretool": true},
  "git": {"branch": "refactor/full-repo-reset", "clean": false, "remote": "github.com/..."}
}
```

Save this as `.ai-dev-setup/last-detection.json` (gitignored) so subsequent phases read from one source of truth.
