#!/usr/bin/env bash
set -euo pipefail

branch="${HEAD_BRANCH:-${GITHUB_REF_NAME:-unknown}}"
sha="${HEAD_SHA:-${GITHUB_SHA:-$(git rev-parse HEAD)}}"
short_sha="${sha:0:12}"
ci_conclusion="${CI_CONCLUSION:-unknown}"

cat <<BODY
## Feature Branch

- Source: \`${branch}\`
- Target: \`develop\`
- Commit: \`${short_sha}\`
- Last feature CI result: \`${ci_conclusion}\`

## Validation

- CI will run after this PR opens or updates.
- Merge only after \`ci-status\` is green.
- This PR was created or refreshed by the final automation job in \`.github/workflows/ci.yml\`.
BODY
