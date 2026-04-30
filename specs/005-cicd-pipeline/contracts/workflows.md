# Contract: GitHub Actions Workflows

**Feature**: 005-cicd-pipeline
**Date**: 2026-04-29

This contract specifies the **observable interface** of each workflow:
triggers, inputs, environments, permissions, jobs, and outputs. Anything not
listed here is implementation detail and may change without breaking this
contract. Anything listed here is a stable surface that branch protection,
the runbook, and external observers (the maintainer, AI agents) depend on.

---

## 1. `ci.yml`

### Triggers
- `pull_request`:
  - `branches: [develop, main]`
  - `types: [opened, synchronize, reopened, ready_for_review]`
- `push`:
  - `branches: [develop, main, ###-*]`
- `workflow_dispatch`: no inputs.

### Permissions (workflow-level)
```yaml
permissions:
  contents: read
```

### Concurrency
```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### Jobs (each becomes a distinct named check)
| Job ID | Name (display) | `timeout-minutes` | Notes |
|---|---|---|---|
| `frontend-checks` | Frontend — typecheck & build | 10 | Uploads `apps/web/dist/` as artifact `web-dist-${{ github.sha }}`. |
| `backend-lint-typecheck` | Backend — lint & typecheck | 10 | `mypy` step is `continue-on-error: true` and prefixes its output with `::warning::`. |
| `backend-unit` | Backend — unit tests | 10 | No DB. |
| `backend-integration-postgres` | Backend — integration (Postgres) | 15 | Postgres 16 service container. |
| `migrations-contracts` | Backend — migrations & contracts | 10 | Postgres 16 service container; runs `alembic upgrade head`, `alembic current`, `alembic check`, then contract tests. |
| `docs-and-repo-hygiene` | Docs & repo hygiene | 5 | `.env.example` integrity, diff-based secrets scan, docs JSON parse, constitution presence. |
| `ci-status` | CI status (aggregate) | 1 | `needs:` all jobs above; `if: always()`; fails if any dep ≠ success. **The single required check in branch protection.** |

### Required exit-status semantics
- `ci-status` MUST succeed iff every other listed job succeeded.
- Cancelled or skipped dependencies count as failure for `ci-status`.

### Outputs
- Artifact: `web-dist-<sha>` (frontend production build).
- Job summary: each backend job appends a short summary section.

---

## 2. `deploy-develop.yml`

### Triggers
- `workflow_run`:
  - `workflows: [CI]`
  - `branches: [develop]`
  - `types: [completed]`
- `workflow_dispatch`: no inputs (must be dispatched against the `develop` branch).

### Permissions (workflow-level)
```yaml
permissions:
  contents: read
  checks: read
```
The `promotion-pr` job overrides:
```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

### Concurrency
```yaml
concurrency:
  group: deploy-develop
  cancel-in-progress: false
```

### Environment
- `environment: develop` on the single deploy-and-probe job that consumes secrets or variables from the `develop` env.

### Jobs (sequential)
| Job ID | Purpose | Inputs (env) | Failure semantics |
|---|---|---|---|
| `branch-guard` | Refuse non-develop refs, non-success CI, stale CI SHAs, or manual dispatch without green `CI status (aggregate)`. | `GITHUB_TOKEN` | Exits 1 with `::error::` message; no further jobs run. |
| `deploy-develop` | Preflight values, POST to API and Web deploy hooks, then probe `${DEVELOP_API_URL}/healthz`, `${DEVELOP_API_URL}/readyz`, `${DEVELOP_WEB_URL}/`. | `RENDER_DEVELOP_API_DEPLOY_HOOK`, `RENDER_DEVELOP_WEB_DEPLOY_HOOK`, `DEVELOP_API_URL`, `DEVELOP_WEB_URL` | Fails before deploy if any value is missing; fails on non-2xx hook response or failed bounded probes. |
| `promotion-pr` | Create-or-update PR `develop → main`. | `GITHUB_TOKEN` | Runs **only** if `deploy-develop` succeeded. |

### Outputs
- Step summary: deploy hook responses (status code only, never URL), per-probe outcomes, link to opened/updated promotion PR.
- A PR from `develop` into `main` exists after success (idempotent).

### Logging contract
- The deploy hook URL MUST NOT appear in any log line.
- `curl` invocations use `-sS -o /dev/null -w '%{http_code}\n'` with the URL passed via env, never inlined.

---

## 3. `deploy-production.yml`

### Triggers
- `workflow_run`:
  - `workflows: [CI]`
  - `branches: [main]`
  - `types: [completed]`
- `workflow_dispatch`: no inputs (must be dispatched against the `main` branch).

### Permissions (workflow-level)
```yaml
permissions:
  contents: read
  checks: read
```

### Concurrency
```yaml
concurrency:
  group: deploy-production
  cancel-in-progress: false
```

### Environment
- `environment: production` on the single deploy-and-probe job that consumes production secrets/vars. The Environment's protection rules (required reviewers) gate execution at the GitHub side.

### Jobs (sequential)
| Job ID | Purpose | Inputs (env) | Failure semantics |
|---|---|---|---|
| `branch-guard` | Refuse non-main refs, non-success CI, stale CI SHAs, or manual dispatch without green `CI status (aggregate)`. | `GITHUB_TOKEN` | Exits 1; clear message per FR-053. |
| `deploy-production` | Environment approval, production preflight, POST to API and Web deploy hooks, then probe `${PROD_API_URL}/healthz`, `${PROD_API_URL}/readyz`, `${PROD_WEB_URL}/`. | `RENDER_PROD_API_DEPLOY_HOOK`, `RENDER_PROD_WEB_DEPLOY_HOOK`, `PROD_API_URL`, `PROD_WEB_URL` | If any required value is missing: exit 1, list **names only** (FR-042, SC-006). No deploy hook is contacted before preflight passes. |
| `summary` | Append GitHub Step Summary: deploy result, probe results, commit SHA, environment. | — | Always runs (`if: always()`). |

### Outputs
- Step summary present on every run, success or failure.
- No promotion PR is created from this workflow (production is the terminal environment).

### Behaviour when production is not yet provisioned
- `preflight` fails with a message of the form:
  ```
  ::error::Production is not yet configured. Missing required: RENDER_PROD_API_DEPLOY_HOOK, RENDER_PROD_WEB_DEPLOY_HOOK, PROD_API_URL, PROD_WEB_URL.
  See docs/backend/ops/cicd.mdx#provisioning-production for setup instructions.
  ```
- No subsequent job runs. No secret values are echoed (FR-047, SC-006).

---

## 4. `release-candidate.yml` (optional)

If `deploy-develop.yml` becomes unwieldy, the `promotion-pr` job is extracted
into this workflow, triggered by `workflow_run` on `deploy-develop`
completion (`conclusion == success`). The contract stays identical to the
`promotion-pr` job above. This file is not delivered in the first iteration
unless the develop workflow exceeds ~150 lines.

---

## 5. `feature-pr.yml`

### Triggers
- `workflow_run`:
  - `workflows: [CI]`
  - `branches: [###-*]`
  - `types: [completed]`

### Permissions
```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

### Contract
- Runs only when the completed CI run was caused by a `push`.
- Uses trusted automation checked out by the `workflow_run` workflow, not scripts from the feature branch.
- Creates or updates a PR from the feature branch into `develop` after the feature branch CI run completes and the branch still has a diff against `develop`.

---

## 6. Common contract guarantees

- **Action versions**: official GitHub actions track the latest stable major. `astral-sh/setup-uv` is pinned to an immutable v8.1.0 commit SHA because that action no longer relies on floating major tags.
- **Permissions**: workflow-level default is `contents: read`. Any escalation is per-job and explicit.
- **Secrets**: never echoed; never passed via shell-string interpolation; always via `env:`.
- **Failure messages**: every fatal step uses `::error::` annotations with the failing area named in plain English (FR-053).
- **Required check**: branch protection requires only `ci-status` (the aggregate).
