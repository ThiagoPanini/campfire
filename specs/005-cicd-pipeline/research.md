# Phase 0 Research: Complete CI/CD Pipeline for Campfire

**Feature**: 005-cicd-pipeline
**Date**: 2026-04-29
**Status**: Complete — no `NEEDS CLARIFICATION` markers remaining.

This document records the technical decisions that resolve open questions
implied by the spec and the user-supplied planning brief. Each entry follows
**Decision / Rationale / Alternatives considered**.

---

## 1. Orchestrator: GitHub Actions vs. Render auto-deploy

- **Decision**: GitHub Actions is the sole orchestrator. Render auto-deploy is **disabled** on every service in both environments. Deployments happen only by GitHub Actions calling Render Deploy Hooks after CI is green.
- **Rationale**: Render auto-deploy on push would bypass CI gates and the GitHub Environment approval for production, defeating FR-002, FR-003, FR-031, FR-041, FR-044, and SC-005/SC-006. A single orchestrator also gives one place to enforce concurrency, probes, and the promotion-PR side effect.
- **Alternatives considered**:
  - *Render auto-deploy + GitHub Actions for checks only*: rejected — no enforceable ordering between CI completion and Render deploy; auto-deploy fires on push regardless of CI status.
  - *Render Blueprint (`render.yaml`) declarative deploys driven by GitHub*: rejected for now — adds a second source of truth for deploy config and is unnecessary while we have ≤4 services. Documented as a future option in the runbook.

## 2. Render integration mechanism: Deploy Hooks vs. Render API

- **Decision**: Use Render **Deploy Hooks** (per-service HTTPS POST URLs stored as environment secrets) for both staging and production.
- **Rationale**: Deploy hooks are the simplest, most stable Render mechanism, require no API key management, and map cleanly to GitHub Environments (one secret per service per environment). They satisfy FR-032, FR-033, FR-044 with minimum surface area.
- **Alternatives considered**:
  - *Render REST API*: rejected — needs a long-lived API key with broader scope than deploy-only, more failure modes, and extra rate-limit handling for no current benefit.
  - *Render CLI in CI*: rejected — same auth surface as the API, and the CLI is not a stable contract we want to depend on from CI.

## 3. Branch model and promotion

- **Decision**: `feature → staging → main`. Feature branches PR into `staging`; merging `staging` deploys staging; success opens/updates a single `staging → main` PR; merging that PR deploys production. Branch protection enforces the topology (FR-001..FR-004).
- **Rationale**: Matches the user-supplied brief and the existing Spec-Kit feature-branch convention. It gives one always-current promotion candidate (the spec's "Release Candidate" entity) and one human gate before production.
- **Alternatives considered**:
  - *Trunk-based with tag-driven prod deploys*: rejected — needs a tag-management policy and a separate hotfix story; overkill for a solo maintainer.
  - *GitFlow with `develop`/`release`/`hotfix`*: rejected — too much ceremony, contradicts Principle IV (Proportional Rigor).

## 4. GitHub Environments topology

- **Decision**: Two environments — `staging` and `production`.
  - `staging`: deployment-branches restricted to `staging` only; secrets scoped to staging Render services and URLs; **no required reviewers** (auto-deploy on merge).
  - `production`: deployment-branches restricted to `main` only; secrets scoped to production Render services and URLs; **at least one required reviewer** (the maintainer); optional wait timer documented but not enforced by code.
- **Rationale**: Directly satisfies FR-041, FR-043, FR-044, SC-004, SC-005. Branch-restriction at the Environment level prevents `workflow_dispatch` on a feature branch from ever touching production secrets.
- **Alternatives considered**:
  - *Single environment with conditional logic*: rejected — would expose production secrets to staging jobs and lose GitHub's native branch restriction.

## 5. Concurrency policy

- **Decision**:
  - `ci.yml`: `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }` — cancel obsolete PR runs on push.
  - `deploy-staging.yml`: `concurrency: { group: deploy-staging, cancel-in-progress: false }` — queue, never cancel a deploy mid-flight.
  - `deploy-production.yml`: `concurrency: { group: deploy-production, cancel-in-progress: false }` — same; production never gets cancelled mid-deploy.
- **Rationale**: PR feedback loops favor freshness (cancel old). Deploys favor completion (queue) so we never leave Render half-deployed. Satisfies FR-035, FR-046, and edge case "two merges in quick succession".
- **Alternatives considered**: *Cancel on staging too*: rejected — risks stranding a half-applied migration if a second merge cancels the first deploy mid-Alembic.

## 6. Database for backend tests in CI

- **Decision**: PostgreSQL 16 as a GitHub Actions **service container** (`services.postgres.image: postgres:16`) with health-check, exposed on `localhost:5432`. The integration job and the migrations/contracts job each get a fresh service. The unit job does not need Postgres.
- **Rationale**: Service containers are the most reliable strategy on GitHub-hosted runners — faster startup than `testcontainers` from inside the runner, no Docker-in-Docker, and a clean DB per run. Matches `apps/api/.env.example` URL shape (`postgresql+asyncpg://campfire:campfire@localhost:5432/campfire`).
- **Alternatives considered**:
  - *`testcontainers[postgres]` from inside the test process*: rejected for CI — already used in some local tests, but pulling images per job is slower and doubles failure surface.
  - *Hosted Postgres (Render/Neon) for CI*: rejected — shared state across runs violates spec assumption "PostgreSQL service used in CI is ephemeral per run".

## 7. Migrations validation strategy

- **Decision**: A dedicated `migrations-contracts` job runs:
  1. `uv run alembic upgrade head` against the empty Postgres service.
  2. `uv run alembic current` (asserts head was reached).
  3. `uv run alembic check` (asserts no pending autogenerate diff vs models).
  4. The OpenAPI snapshot tests already present in `tests/contract/test_openapi_snapshot.py` and `test_repertoire_openapi_snapshot.py`.
- **Rationale**: Satisfies FR-014, FR-015, FR-017 in one focused job that is short and easy to debug. Keeping it separate from the integration job means a migration regression is identifiable from the job name alone (FR-022, FR-053).
- **Alternatives considered**: *Fold migrations into the integration job*: rejected — confuses failure attribution and bloats the integration job's wall-clock.

## 8. Backend `mypy` posture

- **Decision**: Run `uv run mypy src` as a **non-blocking** step in the `backend-lint-typecheck` job in this iteration. Annotate the step with `continue-on-error: true` and emit a `::warning::` line. Track promotion to a required gate as a follow-up in the runbook.
- **Rationale**: FR-016 explicitly allows this posture. The backend `pyproject.toml` declares `mypy` as a dev dep but the codebase has not been audited for strict-mode cleanliness; making it blocking now risks red CI on unrelated PRs.
- **Alternatives considered**: *Skip mypy entirely until clean*: rejected — running it non-blocking still surfaces regressions in PR logs.

## 9. Frontend build location

- **Decision**: `npm ci`, `npm run typecheck`, `npm run build` are all run **from repo root**. The repo's root `package.json` already wires `vite` against `apps/web/vite.config.ts` and `tsc` against `apps/web/tsconfig.json`.
- **Rationale**: Matches the existing scripts; avoids a second `package.json` under `apps/web` that does not exist today. Build output is `apps/web/dist/` (Vite default), which is also the Render Static Site publish dir.
- **Alternatives considered**: *Hoist `apps/web` into its own workspace*: rejected — out of scope; would require restructuring.

## 10. Caching strategy

- **Decision**:
  - npm: `actions/setup-node@v4` with `cache: 'npm'` and `cache-dependency-path: package-lock.json`.
  - uv: `astral-sh/setup-uv@v3` with `enable-cache: true`; cache key derived from `apps/api/uv.lock`.
- **Rationale**: Both are first-party cache integrations; no manual `actions/cache` plumbing needed. `uv.lock` is the authoritative key (FR-012). Resolver drift is prevented by `npm ci` (FR-010) and `uv sync --frozen` (FR-012).
- **Alternatives considered**: *Manual `actions/cache` blocks*: rejected — more YAML, no benefit while official integrations work.

## 11. Aggregate `ci-status` check

- **Decision**: A final `ci-status` job depends on every other CI job via `needs:` and runs only `if: always()`, then exits non-zero if any dependency was not `success`. Branch protection requires only `ci-status`.
- **Rationale**: Lets us add or remove jobs without churning branch-protection settings; the maintainer configures one required check (FR-022 still satisfied — each underlying job remains a distinct named check, the aggregate is just the gate).
- **Alternatives considered**: *List every job individually in branch protection*: rejected — high-friction for a solo maintainer; every CI change requires touching repo settings.

## 12. Post-deploy probes

- **Decision**: A shared `scripts/ci/probe-url.sh` performs HTTP GET with bounded retries:
  - Default: 12 attempts, 5 s sleep, 60 s total per URL (configurable via env vars).
  - Considers HTTP 200–299 healthy; everything else (including timeouts) is unhealthy.
  - Probes (in order): API `/healthz`, API `/readyz`, frontend root URL.
  - Job summary lists each probe + final status; failures fail the run loudly (FR-034, FR-045, SC-007, SC-012).
- **Rationale**: A single shell script with `curl --fail --silent --show-error --max-time` is sufficient and avoids dragging in Node/Python just for probes. Bounded retries cover Render cold-start without retrying indefinitely (edge case).
- **Alternatives considered**: *GitHub Action like `jtalk/url-health-check-action`*: rejected — third-party dependency with no justification; we own ~30 lines of shell instead.

## 13. Promotion PR mechanism

- **Decision**: Use `peter-evans/create-pull-request@v6` in a job that runs **only after probes are green**, with `permissions: { contents: write, pull-requests: write }` scoped to that job. The action idempotently creates or updates a single PR from `staging` into `main`. PR body is generated by `scripts/ci/promotion-pr-body.sh` (commit list since last merge into `main` + production-readiness checklist).
- **Rationale**: This is the one third-party action we accept. It handles the create-or-update logic, signed-commit edge cases, and PAT/GitHub-token branching — the alternative is ~80 lines of `gh` shell with worse error surface. FR-036 and edge case "promotion PR closed manually → fresh PR opened" are handled by the action's `delete-branch` + branch-name strategy.
- **Alternatives considered**:
  - *Hand-rolled `gh pr create` / `gh pr edit`*: rejected — duplicates well-tested logic for no gain.
  - *`gh` + a separate "release-candidate" branch*: rejected — extra branch to maintain; the action targets `staging` directly.

## 14. Secrets handling and pre-flight check

- **Decision**:
  - All Render hook URLs and public URLs live as **environment secrets/vars** (not repo-wide). Hooks are secrets; public URLs (`*_API_URL`, `*_WEB_URL`) can be **variables** since they are not sensitive — recorded as variables in the runbook to keep logs informative.
  - `scripts/ci/preflight-secrets.sh` checks `[ -n "$VAR" ]` for each required name and prints **only the missing names**, never values. Used by `deploy-production.yml` before any hook is called (FR-042, FR-047, SC-006).
  - Workflow steps that POST to deploy hooks pass the URL via env, never via `run:` interpolation, and use `curl -sS -o /dev/null` (no `-v`) so the URL is never echoed (FR-043, FR-053).
- **Rationale**: Minimal, auditable, no secrets-leak vectors. Variables for non-secret URLs aid debugging without weakening security.
- **Alternatives considered**: *All values as secrets*: rejected — masking the public URL of staging in logs makes failure triage harder for a solo maintainer.

## 15. Secrets-scanning approach

- **Decision**: Run a lightweight diff-based scan in CI (`docs-and-repo-hygiene` job) that greps the PR diff for high-confidence patterns (AWS keys, Google API keys, Render hook URLs, generic `password=`/`token=` assignments with non-placeholder RHS). Plus a presence check that every `.env.example` exists and contains no values that look like real secrets (FR-018, FR-019).
- **Rationale**: Proportional rigor — full Gitleaks/TruffleHog is overkill for an MVP and adds a third-party action. We can promote later if a real near-miss occurs.
- **Alternatives considered**: *Gitleaks Action*: deferred to a future iteration; documented as a follow-up.

## 16. Documentation build in CI

- **Decision**: Do **not** run `mint dev`/`mint build` in CI. Instead, the `docs-and-repo-hygiene` job validates that `docs/docs.json` parses as JSON and that any new `.mdx` file referenced from navigation actually exists. If docs files changed in the PR, also run `mint broken-links` if and only if it runs in <60 s offline; otherwise skip with a warning.
- **Rationale**: Mintlify CLI build needs network and is heavy/unstable; the user's brief explicitly says "do not require Mintlify build if it is heavy or unstable". The structural validation we keep is fast and catches the most common doc regressions (FR-020 satisfied at a proportional level).
- **Alternatives considered**: *Full Mintlify build*: rejected per brief.

## 17. `workflow_dispatch` and branch enforcement

- **Decision**: Both deploy workflows define `workflow_dispatch` and start with a guard step:
  ```bash
  if [[ "${GITHUB_REF}" != "refs/heads/${EXPECTED_BRANCH}" ]]; then
    echo "::error::Deploys to ${ENV_NAME} are only allowed from ${EXPECTED_BRANCH}"
    exit 1
  fi
  ```
  Combined with the GitHub Environment's deployment-branches restriction, this provides defense in depth (FR-004, FR-030, FR-040, US-6).
- **Rationale**: Two layers — workflow guard for fast failure with a clear message, environment restriction for hard enforcement that can't be edited away in the YAML alone.
- **Alternatives considered**: *Environment restriction only*: rejected — error message is generic; the guard gives the human-readable hint required by FR-053.

## 18. Migrations on Render

- **Decision**: Migrations run **in CI** (the `migrations-contracts` job applies them to an ephemeral DB) and **on Render** as a **Pre-Deploy Command** (`uv run alembic upgrade head`) **only when the API service is on a paid plan**. While staging is on the free tier, the runbook documents that the maintainer must run migrations from local against the staging DB until the plan is upgraded; the CI job still validates the migration graph.
- **Rationale**: Render Pre-Deploy Commands are paid-only. We do not want to wedge the design on a paid feature, but we also do not want to bake the workaround into the workflow itself. The runbook makes the upgrade path explicit.
- **Alternatives considered**: *Run migrations from GitHub Actions against the live Render DB*: rejected — would require exposing the production DB URL to GitHub, broadening secret blast radius. Documented as an option only if Render Pre-Deploy is unavailable when production is provisioned.

## 19. Action version pinning

- **Decision**: Pin all actions to **major version** tags (`@v4`, `@v5`, `@v3`, `@v6`). Do not pin to commit SHAs in this iteration.
- **Rationale**: Major-version pinning is the documented stable contract for first-party `actions/*` and `astral-sh/*`. SHA pinning + Dependabot is the next maturity step and is a tracked follow-up — proportional to the project's current size.
- **Alternatives considered**: *SHA pinning*: deferred to a follow-up; would require Dependabot to be already managing GitHub Actions ecosystem (which we are enabling — see #20).

## 20. Dependabot

- **Decision**: Enable Dependabot for three ecosystems:
  - `github-actions` (weekly, root `.github/workflows`)
  - `npm` (weekly, repo root)
  - `pip` (weekly, `apps/api`) — Dependabot does not natively read `uv.lock`, but it reads `pyproject.toml` dependency declarations, which is enough to surface upstream advisories.
- **Rationale**: Low-noise, weekly cadence; matches solo-maintainer bandwidth.
- **Alternatives considered**: *Renovate*: more powerful but heavier; deferred.

## 21. Permissions

- **Decision**: Top-level `permissions: contents: read` on every workflow. Override per-job:
  - Promotion-PR job: `contents: write`, `pull-requests: write`.
  - All other jobs: inherit `contents: read` only.
- **Rationale**: Principle of least privilege; satisfies the user brief's permissions plan.
- **Alternatives considered**: None — this is the documented best practice.

## 22. Branch protection rules (configured via runbook, not code)

- **Decision**: Documented in `docs/backend/ops/cicd.mdx` (not enforced by YAML — branch protection is a repo setting). Required state:
  - `staging`: require PR; require `ci-status`; block force-pushes; block direct pushes; do **not** require approval (solo maintainer + AI).
  - `main`: require PR; require ≥1 approval; require `ci-status`; require branch up-to-date; restrict source branch to `staging`; block force-pushes; block direct pushes.
- **Rationale**: GitHub branch protection is configured in repo settings, not via Actions YAML. The runbook makes the exact configuration reproducible (SC-009).
- **Alternatives considered**: *Repository ruleset committed as code via the GitHub API*: rejected — adds an out-of-band bootstrap step for marginal benefit at this scale.

---

## Open follow-ups (out of scope for this feature, captured for tracking)

- Promote `mypy` to a blocking gate once `apps/api/src` is clean.
- Replace lightweight diff secrets-scan with Gitleaks once a real near-miss occurs.
- Switch from major-version action tags to SHA pinning once Dependabot is settled.
- Consider Render Blueprint (`render.yaml`) when service count > 4 or drift between environments becomes a real problem.
- Move migrations to Render Pre-Deploy command when the API service is on a paid plan.
