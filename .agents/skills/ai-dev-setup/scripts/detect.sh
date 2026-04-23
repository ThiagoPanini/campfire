#!/usr/bin/env bash
# detect.sh — emit a JSON profile of this repo's AI-dev setup state.
#
# Usage:   ./detect.sh [repo_root]
# Output:  JSON profile to stdout; diagnostics to stderr.
#
# Design notes:
# - Read-only. Never writes to the repo.
# - Degrades gracefully if `jq` is missing (falls back to shell-built JSON).
# - Keeps the shape in sync with references/detection.md.

set -u
IFS=$'\n\t'

ROOT="${1:-$(pwd)}"
cd "$ROOT" 2>/dev/null || { echo "detect.sh: cannot cd to $ROOT" >&2; exit 2; }

exists() { [[ -e "$1" ]]; }
has_cmd() { command -v "$1" >/dev/null 2>&1; }

# --- project shape ---
langs=()
exists pyproject.toml && langs+=("python")
exists package.json   && langs+=("node")
exists Cargo.toml     && langs+=("rust")
exists go.mod         && langs+=("go")
exists pom.xml        && langs+=("java")
compgen -G "*.csproj" >/dev/null 2>&1 && langs+=("dotnet")

pkg_mgr="unknown"
exists uv.lock         && pkg_mgr="uv"
exists poetry.lock     && pkg_mgr="poetry"
exists pnpm-lock.yaml  && pkg_mgr="pnpm"
exists yarn.lock       && pkg_mgr="yarn"
exists package-lock.json && pkg_mgr="npm"
exists bun.lockb       && pkg_mgr="bun"

# maturity heuristic: count tracked source files (rough)
src_count=0
if has_cmd git && git rev-parse --git-dir >/dev/null 2>&1; then
  src_count=$(git ls-files 2>/dev/null | grep -cE '\.(py|js|ts|tsx|rs|go|java|cs|rb|php)$' | tr -d '[:space:]' || printf 0)
  [[ -z "$src_count" ]] && src_count=0
fi
if   [[ "$src_count" -lt 10 ]];   then maturity="greenfield"
elif [[ "$src_count" -lt 200 ]];  then maturity="early"
else                                   maturity="mature"
fi

# --- AI artifacts ---
claude_md=$(exists CLAUDE.md && echo true || echo false)
agents_md=$(exists AGENTS.md && echo true || echo false)
copilot=$(exists .github/copilot-instructions.md && echo true || echo false)
codex=$(exists .codex && echo true || echo false)
cursor=$( { exists .cursor || exists .cursorrules; } && echo true || echo false)

skills_dirs=()
exists .claude/skills && skills_dirs+=(".claude/skills")
exists .agents/skills && skills_dirs+=(".agents/skills")
exists skills         && skills_dirs+=("skills")

skill_registry="none"
exists skills-lock.json       && skill_registry="skills-lock.json"
exists skills.lock.yaml       && skill_registry="skills.lock.yaml"

# find-skills (Vercel skills.sh discovery helper) — prerequisite for Phase 3
find_skills=false
for d in .claude/skills/find-skills .agents/skills/find-skills "$HOME/.claude/skills/find-skills"; do
  [[ -e "$d" ]] && { find_skills=true; break; }
done
# `npx skills` CLI (the command find-skills wraps) is an acceptable substitute
skills_cli=false
if has_cmd npx; then
  # probe without triggering a network install
  npx --no-install skills --help >/dev/null 2>&1 && skills_cli=true
fi

# --- MCP ---
mcp_configs=()
exists .mcp.json         && mcp_configs+=(".mcp.json")
exists .vscode/mcp.json  && mcp_configs+=(".vscode/mcp.json")
exists .cursor/mcp.json  && mcp_configs+=(".cursor/mcp.json")

mcp_servers=()
for f in "${mcp_configs[@]:-}"; do
  [[ -z "$f" ]] && continue
  if has_cmd jq; then
    while IFS= read -r s; do mcp_servers+=("$s"); done < <(jq -r '.mcpServers | keys[]?' "$f" 2>/dev/null)
  else
    # crude fallback: scan for known server names
    for s in serena github mintlify filesystem postgres sqlite puppeteer playwright; do
      grep -q "\"$s\"" "$f" 2>/dev/null && mcp_servers+=("$s")
    done
  fi
done
# dedupe
if [[ ${#mcp_servers[@]} -gt 0 ]]; then
  mapfile -t mcp_servers < <(printf '%s\n' "${mcp_servers[@]}" | awk '!seen[$0]++')
fi

# --- token optimization ---
serena=$(exists .serena && echo true || echo false)
serena_hooks=false
if exists .claude/settings.json; then
  grep -q 'serena-hooks' .claude/settings.json 2>/dev/null && serena_hooks=true
fi
rtk=false
rtk_real=false
if has_cmd rtk; then
  rtk=true
  # distinguish from the unrelated rtk (Rust Type Kit) by probing `rtk gain`
  if rtk gain >/dev/null 2>&1; then rtk_real=true; fi
fi
caveman=$( { exists .caveman || exists caveman.yaml; } && echo true || echo false)

# --- SDD ---
specify=$(exists .specify && echo true || echo false)
constitution=false
exists CONSTITUTION.md                 && constitution=true
exists .specify/memory/constitution.md  && constitution=true

# --- hooks ---
claude_session_start=false
claude_pretool=false
if exists .claude/settings.json; then
  grep -q '"SessionStart"' .claude/settings.json 2>/dev/null && claude_session_start=true
  grep -q '"PreToolUse"'  .claude/settings.json 2>/dev/null && claude_pretool=true
fi

# --- git ---
branch="unknown"
clean=true
remote=""
if has_cmd git && git rev-parse --git-dir >/dev/null 2>&1; then
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)
  [[ -n "$(git status --porcelain 2>/dev/null)" ]] && clean=false
  remote=$(git remote get-url origin 2>/dev/null || echo "")
fi

# --- emit JSON ---
# Build with jq if available for safety; otherwise hand-roll.
json_array() {
  # usage: json_array "name1" "name2" ... — filters out empty strings so
  # "${arr[@]:-}" on an empty array doesn't produce [""]
  printf '['
  local first=1
  for x in "$@"; do
    [[ -z "$x" ]] && continue
    [[ $first -eq 0 ]] && printf ','
    printf '"%s"' "$(printf '%s' "$x" | sed 's/"/\\"/g')"
    first=0
  done
  printf ']'
}

cat <<EOF
{
  "project": {
    "langs": $(json_array "${langs[@]:-}"),
    "pkg_mgr": "$pkg_mgr",
    "src_count": $src_count,
    "maturity": "$maturity"
  },
  "ai_artifacts": {
    "claude_md": $claude_md,
    "agents_md": $agents_md,
    "copilot": $copilot,
    "codex": $codex,
    "cursor": $cursor,
    "skills_dirs": $(json_array "${skills_dirs[@]:-}"),
    "skill_registry": "$skill_registry",
    "find_skills": $find_skills,
    "skills_cli": $skills_cli
  },
  "mcp": {
    "configs": $(json_array "${mcp_configs[@]:-}"),
    "servers": $(json_array "${mcp_servers[@]:-}")
  },
  "token_opt": {
    "serena": $serena,
    "serena_hooks": $serena_hooks,
    "rtk": $rtk,
    "rtk_real": $rtk_real,
    "caveman": $caveman
  },
  "sdd": {
    "specify": $specify,
    "constitution": $constitution
  },
  "hooks": {
    "claude_session_start": $claude_session_start,
    "claude_pretool": $claude_pretool
  },
  "git": {
    "branch": "$branch",
    "clean": $clean,
    "remote": "$remote"
  }
}
EOF
