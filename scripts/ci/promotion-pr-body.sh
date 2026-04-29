#!/usr/bin/env bash
set -euo pipefail

base="${BASE_BRANCH:-main}"
head="${HEAD_BRANCH:-staging}"
sha="${GITHUB_SHA:-$(git rev-parse HEAD)}"
short_sha="${sha:0:12}"

git fetch --no-tags origin "$base" "$head" >/dev/null 2>&1 || true

commit_list="$(git log --no-merges --pretty=format:'- %h %s' "origin/${base}..origin/${head}" 2>/dev/null || true)"
if [[ -z "$commit_list" ]]; then
  commit_list="- No commit details available from local checkout."
fi

cat <<BODY
## Release Candidate

- Source: \`${head}\`
- Target: \`${base}\`
- Staging commit: \`${short_sha}\`

## Commits Since \`${base}\`

${commit_list}

## Production Readiness

- [ ] Staging deploy succeeded.
- [ ] API \`/healthz\` probe is green.
- [ ] API \`/readyz\` probe is green.
- [ ] Frontend root probe is green.
- [ ] Production secrets and variables are configured, or expected preflight failure is understood.
- [ ] Rollback path reviewed in \`docs/backend/ops/cicd.mdx\`.
BODY
