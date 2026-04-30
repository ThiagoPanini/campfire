#!/usr/bin/env bash
set -euo pipefail

sha="${1:-}"
branch="${2:-}"
check_name="${REQUIRED_CHECK_NAME:-CI status (aggregate)}"
export REQUIRED_CHECK_NAME="$check_name"

if [[ -z "$sha" ]]; then
  echo "::error::require-ci-status.sh requires a commit SHA"
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "::error::GitHub CLI is required"
  exit 2
fi

query=(repos/"${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"/commits/"$sha"/check-runs --paginate --jq)
filter='.check_runs[] | {name, status, conclusion, started_at, completed_at}'

result="$(
  gh api "${query[@]}" "$filter" |
    node -e '
      const fs = require("fs");
      const checkName = process.env.REQUIRED_CHECK_NAME;
      const lines = fs.readFileSync(0, "utf8").trim().split(/\n+/).filter(Boolean);
      const runs = lines.map((line) => JSON.parse(line)).filter((run) => run.name === checkName);
      runs.sort((a, b) => String(b.completed_at || b.started_at || "").localeCompare(String(a.completed_at || a.started_at || "")));
      const latest = runs[0];
      if (!latest) {
        process.exit(10);
      }
      if (latest.status === "completed" && latest.conclusion === "success") {
        console.log("success");
        process.exit(0);
      }
      console.log(`${latest.status}:${latest.conclusion || "none"}`);
      process.exit(11);
    '
)" || status="$?"

status="${status:-0}"

if [[ "$status" == "0" && "$result" == "success" ]]; then
  echo "Required check '${check_name}' is green for ${sha}${branch:+ on ${branch}}."
  exit 0
fi

if [[ "$status" == "10" ]]; then
  echo "::error::Required check '${check_name}' was not found for ${sha}${branch:+ on ${branch}}."
else
  echo "::error::Required check '${check_name}' is not green for ${sha}${branch:+ on ${branch}} (${result:-unknown})."
fi
exit 1
