#!/usr/bin/env bash
set -euo pipefail

branch="${HEAD_BRANCH:-${GITHUB_REF_NAME:-unknown}}"
sha="${GITHUB_SHA:-$(git rev-parse HEAD)}"
short_sha="${sha:0:12}"

cat <<BODY
## Feature Branch

- Source: \`${branch}\`
- Target: \`staging\`
- Commit: \`${short_sha}\`

## Validation

- CI will run after this PR opens or updates.
- Merge only after \`ci-status\` is green.
- This PR was created or refreshed by \`.github/workflows/feature-pr.yml\`.
BODY
