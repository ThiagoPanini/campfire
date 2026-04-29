# Implementation Plan: Complete CI/CD Pipeline for Campfire

**Branch**: `005-cicd-pipeline` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-cicd-pipeline/spec.md`

## Summary

Wire GitHub Actions as the sole orchestrator of validation and deployment for
Campfire on Render, using a `feature → staging → main` branch promotion flow.
A lightweight feature-PR workflow observes pushes to `###-feature-name`
branches and creates, updates, or intentionally ignores a PR into `staging`
without changing application files. CI runs on PRs into `staging`/`main` and
on pushes to those branches, with parallel jobs for frontend, backend
(lint/typecheck, unit, integration with PostgreSQL), migrations/contracts, and
docs/security; an aggregate `ci-status` job exposes a single required check for
branch protection while preserving named job-level diagnostics. Deployment is
performed by triggering Render Deploy Hooks from environment-scoped jobs only
after the CI run for the branch tip has completed successfully: `staging`
deploys after green CI for the `staging` tip and opens/updates a `staging →
main` promotion PR; `production` deploys after green CI for the `main` tip
behind a GitHub Environment approval gate, with a pre-flight check that fails
closed when production secrets are absent. All deployments are followed by
bounded post-deploy probes against `/healthz`, `/readyz`, and the public
frontend URL. Render auto-deploy is disabled so nothing reaches an environment
without going through GitHub-controlled gates. Operational documentation under
`docs/backend/ops/` captures GitHub and Render secrets/variables, environments,
branch protection, Render configuration, migration execution strategy,
troubleshooting, and rollback.

## Technical Context

**Language/Version**: GitHub Actions YAML (no runtime app code in this feature). Tooling versions used by jobs: Node.js 22.x (LTS, matches Vite 8 / React 19); Python 3.12 (matches `apps/api/.python-version` and `pyproject.toml requires-python = ">=3.12,<3.13"`); `uv` latest stable (pinned by `uv.lock`); PostgreSQL 16 service container.
**Primary Dependencies**: GitHub Actions runners (`ubuntu-latest`); official actions only — `actions/checkout@v4`, `actions/setup-node@v4`, `actions/setup-python@v5`, `astral-sh/setup-uv@v3`, `actions/upload-artifact@v4`, `actions/cache@v4`. PR automation uses the GitHub CLI/API with `GITHUB_TOKEN` and narrowly scoped workflow permissions instead of a third-party pull-request action. Render Deploy Hooks (HTTPS POST URLs) are the only outbound deployment integration. No Docker images built for app runtime.
**Storage**: Ephemeral PostgreSQL 16 service container per integration/migrations job (no persistence across runs); no storage owned by this feature.
**Testing**: Existing test suites under `apps/api/tests/{unit,contract,integration}` invoked via `uv run pytest -m <marker>`; frontend `npm run typecheck` and `npm run build` from repo root; Alembic upgrade + `alembic check` against the ephemeral Postgres; OpenAPI snapshot tests already present in `tests/contract/`.
**Target Platform**: GitHub-hosted Linux runners; Render managed platform (Web Service for the API, Static Site for the frontend, managed PostgreSQL). No self-hosted runners.
**Project Type**: web — monorepo with `apps/api` (FastAPI/uv) and `apps/web` (Vite/React) plus `docs/` (Mintlify). The CI/CD layer is cross-cutting infra, not a new app.
**Performance Goals**: No explicit CI wall-clock target in this iteration; keep workflow steps simple and bounded. Deploy probes use fixed retry limits so deployment validation cannot run indefinitely.
**Constraints**: Render free tier may be in use → no pre-deploy commands assumed available for free services; migrations run as a CI validation job against an ephemeral database, while live Render migrations require an explicit runbook path until the API service can use a Render pre-deploy command or another approved automation. Deploy hook URLs are secrets and MUST never be echoed. Production services do not exist yet → production workflow MUST fail closed with a human-readable list of missing secrets; if GitHub Environment approval is evaluated before environment secrets are readable, the runbook must call out that approval may be requested before the pre-flight failure is shown.
**Scale/Scope**: Solo maintainer + AI agents; ≤ a few dozen PRs/week; 2 environments (`staging` exists, `production` to be provisioned later) × 2 services each (API + Web) = up to 4 deploy hooks total.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Narrow MVP Scope | ✅ Pass | Pipeline serves the three MVP user jobs by making the existing apps deployable; introduces no product features. |
| II. Incremental Delivery | ✅ Pass | Delivered as P1 → P2 → P3 user stories; staging-only is independently usable while production stays unprovisioned. |
| III. Boring, Proven Stack | ✅ Pass | GitHub Actions + Render Deploy Hooks + Postgres service container. No AWS, Terraform, LocalStack, Kubernetes, Redis, queues. No Docker images for app runtime (FR-061). PR creation/update uses the built-in GitHub API/CLI surface rather than introducing a third-party action. |
| IV. Proportional Rigor | ✅ Pass | Secrets scan is diff-based (gitleaks-lite via shell, no SAST); `mypy` is non-blocking until codebase is clean; constitution check is presence/readability only; OpenAPI snapshot job is a no-op when no snapshot exists. |
| V. Docs-as-Code | ✅ Pass | Operational runbook delivered in `docs/backend/ops/cicd.mdx` in the same change set as the workflows; secrets inventory is the single source of truth. |
| Backend Architecture Invariants | N/A | Feature does not modify domain/application/adapters layers. |

**Initial gate**: PASS — no violations. No entries in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/005-cicd-pipeline/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (entities: workflows, environments, secrets, probes)
├── quickstart.md        # Phase 1 output (one-time setup walkthrough)
├── contracts/           # Phase 1 output (workflow trigger contracts, deploy-hook contract, probe contract)
│   ├── workflows.md
│   ├── deploy-hook.md
│   └── post-deploy-probe.md
└── tasks.md             # Phase 2 output (created by /speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
.github/
├── workflows/
│   ├── feature-pr.yml                # push to ###-feature-name → create/update/ignore PR into staging
│   ├── ci.yml                       # PR + push validation; jobs run in parallel; aggregate ci-status job
│   ├── deploy-staging.yml           # green CI for staging tip → Render hooks → probes → promotion PR
│   ├── deploy-production.yml       # green CI for main tip → environment gate → preflight → hooks → probes
│   └── release-candidate.yml       # OPTIONAL — extracted promotion-PR job if deploy-staging.yml grows too large
├── pull_request_template.md        # Validation + promotion checklist
└── dependabot.yml                  # npm, github-actions, pip (uv-compatible) ecosystems

scripts/
└── ci/
    ├── probe-url.sh                # Bounded-retry HTTP probe (used by both deploy workflows)
    ├── render-deploy.sh            # POST to a Render deploy hook; never echoes the URL
    ├── preflight-secrets.sh        # Asserts required env vars are non-empty without printing values
    ├── feature-pr-body.sh          # Builds/refreshes feature→staging PR body
    ├── promotion-pr-body.sh        # Builds the staging→main PR body (commit list + checklist)
    └── ensure-pr.sh                # Idempotent gh-based create/update helper for both PR flows

docs/
└── backend/
    └── ops/
        └── cicd.mdx                # Operational runbook (single entry point for FR-050..FR-053)

# Existing trees (unchanged by this feature, referenced by the workflows):
apps/
├── api/                            # FastAPI + uv; tests under apps/api/tests/{unit,contract,integration}
└── web/                            # Vite + React; built from repo root via `npm run build`
```

**Structure Decision**: Pure infra-as-code feature. All new artefacts live under
`.github/`, `scripts/ci/`, `docs/backend/ops/`, and the spec folder. No
application source code in `apps/api/src` or `apps/web/src` is modified. The
backend monorepo layout is respected: `npm` operates from repo root (Vite
config + root `package.json`), `uv` and `alembic` are invoked with
`working-directory: apps/api`. Workflow logic that exceeds ~10 lines of shell
is extracted to `scripts/ci/` so YAML stays declarative and the scripts are
unit-runnable locally.

## Activity Plan Before Task Generation

These activities refine the current design before `/speckit-tasks` is run.
They are not task output yet; they define what the eventual task list must
cover.

1. Update the specification and plan to include feature-branch auto-PR
   behaviour: trigger scope, ignore rules, idempotency, permissions, labels,
   and duplicate prevention.
2. Change CD trigger semantics from "raw push starts deploy" to "successful
   CI for the branch tip starts deploy" using `workflow_run` or an equivalent
   explicit `ci-status` lookup for the exact SHA.
3. Add a CI policy check that rejects PRs into `main` unless `head_ref` is
   `staging`, because GitHub settings alone may not express this safely across
   plans.
4. Replace the planned `peter-evans/create-pull-request` dependency with a
   repository-owned `gh`/GitHub API helper that can create or update both
   feature-to-staging and staging-to-main PRs without relying on workspace
   file changes.
5. Make live database migration handling explicit per environment: Render
   pre-deploy command when available, documented manual path while free-tier
   staging is accepted, or a separately approved GitHub Actions migration job
   if the maintainer chooses that trade-off.
6. Expand the runbook scope so it inventories both GitHub workflow
   secrets/variables and Render service runtime variables, including
   `VITE_API_URL`, backend database/auth settings, deploy hooks, and public
   probe URLs.
7. Document GitHub repository foundation setup out-of-band: ensure
   `main`/`staging`, labels, environments, variables, branch protection or
   rulesets, and safe repository options. Record anything blocked by plan or
   permission limitations in the operational runbook.

## Complexity Tracking

> No Constitution Check violations to justify. Section intentionally empty.
