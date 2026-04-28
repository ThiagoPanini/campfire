#!/usr/bin/env bash
# validate.sh — post-install validation for ai-dev-setup.
#
# Usage: ./validate.sh [category]
#
# Categories: all (default), ai-artifacts, mcp, token-opt, sdd, skills, hooks
#
# Prints one line per check:
#   [PASS] <category>: <what was checked>
#   [WARN] <category>: <what looks off>
#   [FAIL] <category>: <what failed>
#
# Exits 0 if no FAILs, 1 otherwise.

set -u

CATEGORY="${1:-all}"
FAILS=0

pass()  { echo "[PASS] $1: $2"; }
warn()  { echo "[WARN] $1: $2"; }
fail()  { echo "[FAIL] $1: $2"; FAILS=$((FAILS+1)); }

run_ai_artifacts() {
  local cat="ai-artifacts"
  for f in AGENTS.md CLAUDE.md .github/copilot-instructions.md; do
    if [[ -f "$f" ]]; then
      local lines; lines=$(wc -l <"$f" | tr -d ' ')
      if [[ "$lines" -gt 200 ]]; then
        warn "$cat" "$f is $lines lines — consider trimming (always-loaded context budget)"
      else
        pass "$cat" "$f present ($lines lines)"
      fi
    fi
  done
}

run_mcp() {
  local cat="mcp"
  for f in .mcp.json .vscode/mcp.json .cursor/mcp.json; do
    [[ -f "$f" ]] || continue
    if command -v jq >/dev/null 2>&1; then
      if jq . "$f" >/dev/null 2>&1; then
        local n; n=$(jq -r '.mcpServers | keys | length' "$f" 2>/dev/null || echo 0)
        pass "$cat" "$f is valid JSON with $n server(s)"
      else
        fail "$cat" "$f is not valid JSON"
      fi
    else
      warn "$cat" "$f present but jq not installed — skipped validation"
    fi
  done
}

run_token_opt() {
  local cat="token-opt"
  if command -v rtk >/dev/null 2>&1; then
    if rtk gain >/dev/null 2>&1; then
      pass "$cat" "rtk installed and responsive (rtk gain OK)"
    else
      warn "$cat" "rtk on PATH but 'rtk gain' failed — possible Rust Type Kit collision"
    fi
  fi
  if [[ -d .serena ]]; then
    if [[ -f .serena/project.yml ]]; then
      pass "$cat" "Serena project config present"
    else
      warn "$cat" ".serena/ exists but no project.yml"
    fi
  fi
}

run_sdd() {
  local cat="sdd"
  if [[ -d .specify ]]; then
    pass "$cat" "Spec Kit (.specify/) present"
    [[ -f .specify/memory/constitution.md ]] && pass "$cat" "Constitution present"
  fi
}

run_skills() {
  local cat="skills"
  local dirs=(.claude/skills .agents/skills)
  for d in "${dirs[@]}"; do
    [[ -d "$d" ]] || continue
    local n; n=$(find "$d" -maxdepth 1 -mindepth 1 -type d -o -type l | wc -l | tr -d ' ')
    pass "$cat" "$d has $n skill(s)"
  done
  if [[ -f skills-lock.json ]]; then
    if command -v jq >/dev/null 2>&1; then
      if jq . skills-lock.json >/dev/null 2>&1; then
        pass "$cat" "skills-lock.json is valid JSON"
      else
        fail "$cat" "skills-lock.json is corrupted"
      fi
    fi
  fi
}

run_hooks() {
  local cat="hooks"
  local f=".claude/settings.json"
  [[ -f "$f" ]] || return 0
  if command -v jq >/dev/null 2>&1; then
    if jq . "$f" >/dev/null 2>&1; then
      local events; events=$(jq -r '.hooks | keys[]?' "$f" 2>/dev/null | paste -sd, - || true)
      if [[ -n "$events" ]]; then
        pass "$cat" "hooks configured for: $events"
      fi
    else
      fail "$cat" "$f is not valid JSON"
    fi
  fi
}

case "$CATEGORY" in
  all)
    run_ai_artifacts
    run_mcp
    run_token_opt
    run_sdd
    run_skills
    run_hooks
    ;;
  ai-artifacts) run_ai_artifacts ;;
  mcp)          run_mcp ;;
  token-opt)    run_token_opt ;;
  sdd)          run_sdd ;;
  skills)       run_skills ;;
  hooks)        run_hooks ;;
  *)
    echo "unknown category: $CATEGORY" >&2
    echo "try: all | ai-artifacts | mcp | token-opt | sdd | skills | hooks" >&2
    exit 2
    ;;
esac

if [[ "$FAILS" -gt 0 ]]; then
  echo "$FAILS validation failure(s)"
  exit 1
fi
echo "validation complete"
