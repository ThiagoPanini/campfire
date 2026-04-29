#!/usr/bin/env bash
set -euo pipefail

base="${BASE_BRANCH:?BASE_BRANCH is required}"
head="${HEAD_BRANCH:?HEAD_BRANCH is required}"
title="${PR_TITLE:?PR_TITLE is required}"
body_file="${PR_BODY_FILE:?PR_BODY_FILE is required}"
labels="${PR_LABELS:-}"
draft="${PR_DRAFT:-false}"

if [[ ! -f "$body_file" ]]; then
  echo "::error::PR body file not found: ${body_file}"
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "::error::GitHub CLI is required"
  exit 2
fi

existing_number="$(
  gh pr list \
    --state open \
    --base "$base" \
    --head "$head" \
    --json number \
    --jq '.[0].number // empty'
)"

if [[ -n "$existing_number" ]]; then
  gh pr edit "$existing_number" --title "$title" --body-file "$body_file"
  pr_url="$(gh pr view "$existing_number" --json url --jq '.url')"
  action="updated"
else
  create_args=(--base "$base" --head "$head" --title "$title" --body-file "$body_file")
  if [[ "$draft" == "true" ]]; then
    create_args+=(--draft)
  fi
  pr_url="$(gh pr create "${create_args[@]}")"
  action="created"
  existing_number="$(gh pr view "$pr_url" --json number --jq '.number')"
fi

if [[ -n "$labels" ]]; then
  IFS="," read -r -a label_array <<< "$labels"
  for raw_label in "${label_array[@]}"; do
    label="$(echo "$raw_label" | xargs)"
    [[ -z "$label" ]] && continue
    if ! gh label list --search "$label" --json name --jq '.[].name' | grep -Fxq "$label"; then
      gh label create "$label" --color "6f42c1" --description "Managed by CI automation" >/dev/null
    fi
    gh pr edit "$existing_number" --add-label "$label" >/dev/null
  done
fi

echo "PR ${action}: ${pr_url}"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  echo "- PR ${action}: ${pr_url}" >> "$GITHUB_STEP_SUMMARY"
fi
