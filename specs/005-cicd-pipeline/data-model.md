# Phase 1 Data Model: CI/CD Pipeline Entities

**Feature**: 005-cicd-pipeline
**Date**: 2026-04-29

This feature has no application database schema. The "entities" below model
the **operational artefacts** the pipeline manipulates: GitHub Environments,
secrets, workflows, deploy hooks, probes, and the promotion PR. They are the
authoritative inventory referenced by the runbook (`docs/backend/ops/cicd.mdx`)
and the workflow YAML.

---

## Entity: GitHub Environment

| Field | Type | Notes |
|---|---|---|
| `name` | enum(`staging`, `production`) | Used as `environment:` in deploy jobs. |
| `deployment_branches` | string | `staging` env → only `staging`. `production` env → only `main`. |
| `required_reviewers` | int | `staging` = 0. `production` ≥ 1 (the maintainer). |
| `wait_timer_minutes` | int | `staging` = 0. `production` = 0 by default; documented as optional. |
| `secrets` | map<string,string> | See **Secrets Inventory** below; scoped per env. |
| `variables` | map<string,string> | Public URLs (`*_API_URL`, `*_WEB_URL`) recorded as variables, not secrets. |

**Validation rules**:
- A workflow job referencing `environment: production` from any branch other than `main` MUST be rejected at GitHub's environment-protection layer.
- Secrets MUST NOT be shared across environments (FR-043).

---

## Entity: Secret / Variable (Secrets Inventory)

This is the single source of truth referenced by FR-051 and SC-008. Every name
below appears verbatim in workflow YAML. **Names are stable contract.**

### Staging environment

| Name | Kind | Required | Purpose |
|---|---|---|---|
| `RENDER_STAGING_API_DEPLOY_HOOK` | secret | yes | Render Deploy Hook URL for the staging API service. |
| `RENDER_STAGING_WEB_DEPLOY_HOOK` | secret | yes | Render Deploy Hook URL for the staging Web (Static Site) service. |
| `STAGING_API_URL` | variable | yes | Base URL of the staging API, e.g. `https://campfire-api-staging.onrender.com`. Used to build `/healthz` and `/readyz` probe URLs. |
| `STAGING_WEB_URL` | variable | yes | Public URL of the staging frontend, e.g. `https://campfire-web-staging.onrender.com`. Probed for HTTP 200. |

### Production environment

| Name | Kind | Required | Purpose |
|---|---|---|---|
| `RENDER_PROD_API_DEPLOY_HOOK` | secret | yes (when production exists) | Render Deploy Hook URL for the production API. |
| `RENDER_PROD_WEB_DEPLOY_HOOK` | secret | yes (when production exists) | Render Deploy Hook URL for the production Web. |
| `PROD_API_URL` | variable | yes (when production exists) | Base URL of the production API. |
| `PROD_WEB_URL` | variable | yes (when production exists) | Public URL of the production frontend. |

### Repo-level (no environment scope)

| Name | Kind | Required | Purpose |
|---|---|---|---|
| `GITHUB_TOKEN` | built-in | yes | Used by the promotion-PR job; scoped per-job permissions. |

**Validation rules**:
- Pre-flight (`scripts/ci/preflight-secrets.sh`) MUST verify each required name is non-empty for the target environment, listing only **names** of missing entries (FR-042, SC-006).
- Hook URLs MUST never appear in logs; the calling step MUST pass them via env, not via `run:` string interpolation (FR-043).
- The runbook MUST list 100% of these names with no drift from this table (SC-008).

---

## Entity: Workflow

| Workflow | File | Triggers | Environment | Purpose |
|---|---|---|---|---|
| CI | `.github/workflows/ci.yml` | `pull_request` (target: `staging`, `main`); `push` (refs: `staging`, `main`); `workflow_dispatch` | none | Validation matrix; produces the `ci-status` aggregate check (FR-010..FR-023). |
| Deploy Staging | `.github/workflows/deploy-staging.yml` | `push` (ref: `staging`); `workflow_dispatch` (ref: `staging` only) | `staging` | Deploy → probe → open/update promotion PR (FR-030..FR-036). |
| Deploy Production | `.github/workflows/deploy-production.yml` | `push` (ref: `main`); `workflow_dispatch` (ref: `main` only) | `production` | Pre-flight → environment gate → deploy → probe → step summary (FR-040..FR-047). |
| Release Candidate (optional) | `.github/workflows/release-candidate.yml` | `workflow_run` (deploy-staging completed) | none | Extracted promotion-PR job if `deploy-staging.yml` outgrows its scope. |

**State transitions** (CI):

```
queued → running → (per job) success | failure | cancelled
                            ↓
                      ci-status: success ⇔ all required jobs success
                                          else failure
```

**State transitions** (Deploy Staging):

```
queued → running
  → preflight (none required for staging)
  → render-deploy-api (POST hook) → render-deploy-web (POST hook)
  → wait-and-probe (/healthz, /readyz, web URL, bounded retries)
  → promotion-pr (create-or-update staging→main)
  → success | failure
```

**State transitions** (Deploy Production):

```
queued → branch-guard (refuse if ref != main) → preflight-secrets
  → environment-gate (GitHub blocks until reviewer approves)
  → render-deploy-api → render-deploy-web
  → probe (prod URLs)
  → step-summary
  → success | failure
```

**Concurrency**:
- CI: `group: ci-${{ github.ref }}`, `cancel-in-progress: true`.
- Deploy Staging: `group: deploy-staging`, `cancel-in-progress: false`.
- Deploy Production: `group: deploy-production`, `cancel-in-progress: false`.

---

## Entity: CI Job (children of CI Workflow)

| Job ID | Depends on | Purpose | Required for `ci-status` |
|---|---|---|---|
| `frontend-checks` | — | `npm ci` → `npm run typecheck` → `npm run build`. Uploads `apps/web/dist/` artifact. | yes |
| `backend-lint-typecheck` | — | `uv sync --frozen` → `uv run ruff check src tests scripts` → `uv run mypy src` (non-blocking). | yes (ruff blocking; mypy warning) |
| `backend-unit` | — | `uv run pytest -m unit tests/unit`. | yes |
| `backend-integration-postgres` | — | Postgres 16 service → `uv run alembic upgrade head` → `uv run pytest -m integration tests/integration`. | yes |
| `migrations-contracts` | — | Postgres 16 service → `alembic upgrade head` → `alembic current` → `alembic check` → `pytest -m contract tests/contract`. | yes |
| `docs-and-repo-hygiene` | — | `.env.example` integrity; diff-based secrets scan; `docs/docs.json` parses; constitution file readable. | yes |
| `ci-status` | all above | `if: always()` aggregator that fails iff any dependency failed. | **this is the single required check in branch protection** |

**Validation rules**:
- Each job MUST set an explicit `timeout-minutes` (recommended 10 for build/test jobs, 5 for hygiene).
- Each job MUST emit at least one `::group::` block per logical phase so failures are easy to locate (FR-053).

---

## Entity: Render Service / Deploy Hook

| Field | Type | Notes |
|---|---|---|
| `service_name` | string | e.g. `campfire-api-staging`. |
| `service_kind` | enum(`web_service`, `static_site`) | API = web_service; Web = static_site. |
| `environment` | enum(`staging`, `production`) | Maps to GitHub Environment 1:1. |
| `deploy_hook_url` | string (secret) | Stored in `RENDER_<ENV>_<KIND>_DEPLOY_HOOK`. |
| `auto_deploy_enabled` | bool | **MUST be `false`** on every service (Render-side setting; FR-002 enforcement). |
| `root_dir` | string | API: `apps/api`. Web: repo root (build emits to `apps/web/dist/`). |
| `start_command` (api only) | string | `uv run uvicorn campfire_api.main:app --host 0.0.0.0 --port $PORT`. |
| `pre_deploy_command` (api, paid plans only) | string | `uv run alembic upgrade head`. |
| `publish_dir` (web only) | string | `apps/web/dist`. |

**Validation rules**:
- A service whose `auto_deploy_enabled` is true MUST be flagged in the runbook's "operational health" checklist; the maintainer MUST disable it (FR-002 spirit, prevents bypass of CI).
- `pre_deploy_command` is documented but MUST NOT be assumed available — until the API is on a paid plan, the migrations job in CI is the only enforcement of FR-015.

---

## Entity: Post-Deployment Probe

| Field | Type | Notes |
|---|---|---|
| `target_url` | string | Constructed as `${BASE}/healthz`, `${BASE}/readyz`, or `${WEB}/`. |
| `expected_status_class` | string | `2xx` (200–299). |
| `max_attempts` | int | Default 12. Configurable via `PROBE_MAX_ATTEMPTS` env. |
| `sleep_seconds_between_attempts` | int | Default 5. Configurable via `PROBE_SLEEP_SECONDS`. |
| `per_request_timeout_seconds` | int | Default 5. `curl --max-time`. |
| `outcome` | enum(`healthy`, `unhealthy`) | `healthy` ⇔ at least one attempt returned 2xx within budget. |

**Validation rules**:
- Probes MUST be bounded (no infinite retry; edge case "transient flake").
- The job summary MUST list each probe + final status + attempt count (FR-053, SC-007).
- A single unhealthy probe fails the entire deploy job (SC-012).

---

## Entity: Promotion PR (Release Candidate)

| Field | Type | Notes |
|---|---|---|
| `source_branch` | const | `staging`. |
| `target_branch` | const | `main`. |
| `title` | string | Generated, e.g. `chore(release): promote staging → main (<short-sha>)`. |
| `body` | string | Built by `scripts/ci/promotion-pr-body.sh`: commit list since last merge into `main` + production-readiness checklist. |
| `idempotency_key` | const branch | The action targets a fixed head ref; existing PR is updated, not duplicated. |
| `created_when` | rule | Only after **all** post-deploy probes for staging are healthy (FR-036, US-3 acceptance #2). |

**State transitions**:
```
absent  ── successful staging deploy ──▶ open (created)
open    ── subsequent successful staging deploy ──▶ open (updated in place)
open    ── manually closed by maintainer ──▶ closed
closed  ── next successful staging deploy ──▶ open (fresh PR; not reopened)
open    ── merged into main ──▶ merged (triggers deploy-production.yml)
```

---

## Entity: Branch Protection Configuration (documented, not coded)

| Branch | Rule | Value |
|---|---|---|
| `staging` | Require PR | yes |
| `staging` | Required status checks | `ci-status` |
| `staging` | Allow force-push | no |
| `staging` | Allow direct push | no |
| `staging` | Required approvals | 0 |
| `main` | Require PR | yes |
| `main` | Required status checks | `ci-status` |
| `main` | Required approvals | ≥ 1 |
| `main` | Require branch up-to-date | yes |
| `main` | Restrict source branches | `staging` only |
| `main` | Allow force-push | no |
| `main` | Allow direct push | no |

**Validation rules**: configuration lives in `docs/backend/ops/cicd.mdx` and
is the source of truth for FR-002, FR-003 (SC-009 reproducibility).
