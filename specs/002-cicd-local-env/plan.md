# Implementation Plan: CI/CD Pipelines & Reproducible Local Environment

**Branch**: `002-cicd-local-env` | **Date**: 2026-04-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-cicd-local-env/spec.md`

## Summary

Deliver two tightly coupled artifacts that share one set of commands:

1. **A reproducible local environment** — a single `make`-driven entry point that brings up the backend service and its AWS-shaped dependencies (DynamoDB, Cognito-equivalent token issuance, SSM/SecretsManager, S3, eventually Lambda) on a developer's machine via **LocalStack Community** (replacing the current single-purpose `amazon/dynamodb-local` container), runs the unit + integration + contract test suites against that stack, supports debugger attach, and tears everything down cleanly.
2. **Production-grade GitHub Actions CI/CD** — a small, maintainable set of reusable workflows and composite actions that (a) run the same commands the local environment runs, path-filtered per workspace (`apps/api`, `apps/web`, `infra/terraform`, `docs/`), with required status checks that block merge; (b) build and publish immutable, provenance-attested artifacts on merge to `main`; (c) deploy to a non-production AWS environment automatically via OIDC-federated short-lived credentials, and to production only behind GitHub Environment approvals; (d) record every deployment in an auditable record and support one-button rollback.

Technical approach: one `Makefile` is the contract between humans and CI. All GitHub Actions jobs shell out to `make <target>` rather than re-encoding commands. LocalStack is the canonical local AWS plane for both the developer and the CI integration-test job (same `docker-compose.backend.yml`). Third-party actions are pinned by commit SHA. AWS auth from CI is exclusively OIDC → scoped IAM role. Artifacts live in S3 (infra bundles, Lambda zips) and ECR (if/when containerized). Deployments are performed by Terraform applying against pre-computed plans, with a `deployments/` ledger (commit-linked) as the audit trail.

## Technical Context

**Language/Version**:
- Backend: Python 3.12 (`apps/api`, uv + setuptools)
- Frontend: TypeScript 5.x / Node 20 LTS (`apps/web`, Vite + React)
- Infrastructure: Terraform 1.8.5 (`infra/terraform`)
- CI: GitHub Actions (YAML), shared logic in Bash (`scripts/`) and `Makefile`

**Primary Dependencies**:
- Backend: `aws-lambda-powertools`, `boto3`, `pydantic`, `pytest`, `moto[server]`, `PyJWT`
- Frontend: Vite, React, Vitest, Playwright
- Local AWS plane: **LocalStack Community** (`localstack/localstack` pinned by image digest), replacing `amazon/dynamodb-local`
- CI quality gates: `ruff` (lint/format), `mypy` (type), `pytest` (backend tests), `eslint` + `tsc --noEmit` + `vitest` + `playwright` (frontend), `terraform fmt/validate` + `tflint` + `checkov` (infra), `gitleaks` (secret scan), `trivy` (container + FS vuln scan), `actionlint` (workflow lint), `zizmor` (workflow security audit)
- CI orchestration: reusable workflows + composite actions; `dorny/paths-filter` for path scoping; `aws-actions/configure-aws-credentials` with `role-to-assume` + OIDC; merge-queue enabled on `main`

**Storage**:
- Local: DynamoDB inside LocalStack; filesystem-backed LocalStack volume for persistence across restarts
- CI artifacts: GitHub Actions artifact store (short-lived, per-run) for test reports and SBOMs
- Release artifacts: S3 bucket `campfire-artifacts-<account>-<region>` versioned + KMS-encrypted; ECR for container images (if/when applicable)
- Terraform state: existing remote state backend (already present in `infra/terraform/environments/tf_state/`)

**Testing**:
- Unit (backend): `pytest` against domain layer, no I/O
- Integration (backend): `pytest` against LocalStack-provided AWS services via the same `docker-compose.backend.yml` the developer uses
- Contract (backend): `pytest` HTTP contract tests against the local server process
- Unit (frontend): `vitest`
- E2E (frontend): `playwright` against a locally running backend + web build
- Infra: `terraform validate`, `tflint`, `checkov`
- Workflow: `actionlint`, `zizmor`
- Post-deploy: a generalized smoke runner promoted from `scripts/auth-bootstrap-smoke.sh`

**Target Platform**: GitHub-hosted `ubuntu-24.04` runners for CI; local developer machines on Linux / macOS / WSL2 with Docker Desktop or equivalent; AWS (us-east-1 dev, region TBD for prod) for deploy targets.

**Project Type**: Cross-cutting infrastructure feature — affects repository root (`Makefile`, `docker-compose.backend.yml`, `scripts/`), `apps/api`, `apps/web`, `infra/terraform`, and `.github/workflows/`.

**Performance Goals**:
- PR CI end-to-end ≤ 15 min p90 (see SC-003); individual jobs under 8 min
- Local `make up` (cold, first run) ≤ 3 min; warm ≤ 30 s
- Local `make test` full suite ≤ 5 min on a developer laptop
- Median merge → non-prod deploy ≤ 15 min (SC-011)
- Rollback ≤ 10 min (SC-008)

**Constraints**:
- Zero long-lived AWS credentials in GitHub (SC-004): OIDC only
- Least-privilege permissions on every workflow (SC-005)
- All third-party actions pinned by 40-char commit SHA (SC-006)
- Local env must work without any cloud credentials (FR-004)
- Same commands local / CI (FR-008, FR-013)
- Merge-queue-compatible: checks must pass on the merge commit, not just the PR head

**Scale/Scope**:
- ~4 workflow files (PR, release, deploy, scheduled security), ~4 reusable workflows, ~4 composite actions
- 1 `Makefile` with ~20 public targets
- 2 deploy environments at launch (dev, prod), extensible to 3+
- Initially 1 backend service (Lambda-shaped) + 1 web app + Terraform; scales to N services

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Constitutional rule | Applies here? | Plan alignment |
|---|---|---|
| I. Musical growth over vanity mechanics | Indirect — platform work | No user-facing vanity mechanics introduced. PASS. |
| II. Contextualized musical identity | N/A | N/A. |
| III. Jam sessions first-class | N/A | N/A. |
| IV. Explainable recommendations | N/A | N/A (no ML). |
| V. Private-first, small-group trust | Yes — deploy-time secret handling | Secrets MUST NOT leak; workflows fail-closed on missing secrets (FR-026). PASS. |
| VI. Historical memory as asset | Yes — deployment records are history | Deployment records retained; immutable artifacts in versioned S3. PASS. |
| VII. Copyright-respecting | N/A | N/A. |
| VIII. DDD / Hexagonal / Clean backend | Yes — CI must not couple to framework internals | Integration tests exercise real adapters (LocalStack), not mocks; domain-layer unit tests remain fast and I/O-free. PASS. |
| IX. Polished, accessible frontend | Indirectly affected | This feature must not weaken existing frontend accessibility baselines, but it does not introduce a new accessibility gate. No additional accessibility coverage is claimed here. |
| X. AWS-native, Terraform as source of truth | Yes — core to this feature | All deployment is Terraform-driven; OIDC-federated IAM; remote encrypted state; least-privilege IAM per environment. PASS. |
| XI. Docs-as-code with Mintlify | Yes | New Mintlify pages under `docs/guides/` for local env, CI contract, deployment runbook, rollback; docs build is a blocking PR check. PASS. |
| AI-Assisted Development Governance | Yes | Workflow files + skills reviewed like code; protected branches require CI green; merge-queue enforces. PASS. |
| Spec-Driven Development Discipline | Yes | This plan is the traceable artifact; tasks emitted by `/speckit-tasks`. PASS. |

**Gate status**: PASS. No violations; no `Complexity Tracking` entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-cicd-local-env/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── makefile-targets.md
│   ├── github-status-checks.md
│   ├── oidc-iam-trust.md
│   ├── deployment-record.schema.json
│   └── localstack-services.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
Makefile                               # NEW — canonical command surface (local == CI)
docker-compose.backend.yml             # MODIFIED — replace dynamodb-local with LocalStack
scripts/
├── local/                             # NEW — consolidated helpers
│   ├── up.sh                          # wraps docker compose up + health wait + seed
│   ├── down.sh                        # clean teardown (containers, volumes, temp files)
│   ├── test.sh                        # runs the same commands CI runs
│   ├── debug.sh                       # starts API with debugpy listener
│   ├── smoke.sh                       # generalized post-deploy smoke
│   └── doctor.sh                      # prerequisite/port/stale-state checks (FR-007)
└── ci/                                # NEW — CI-only helpers
    ├── assert-oidc.sh                 # CI fails closed if not running under OIDC
    └── emit-deployment-record.sh      # writes deployment ledger entry

apps/api/                              # existing Python service — tests wired to LocalStack
apps/web/                              # existing Vite/React app — CI gates added
infra/terraform/                       # existing — CI adds validate/lint/checkov gates
docs/
├── guides/
│   ├── platform/local-environment.mdx # NEW — matches quickstart.md
│   ├── ci-cd-overview.mdx             # NEW — workflow catalog + status-check contract
│   └── deployment-runbook.mdx         # NEW — deploy + rollback procedure
└── adr/
    ├── 0002-localstack-as-local-aws-plane.md   # NEW
    ├── 0003-github-oidc-for-aws-deploy.md      # NEW
    └── 0004-makefile-as-command-surface.md     # NEW

.github/
├── workflows/
│   ├── pr.yml                         # NEW — the PR gate (replaces auth-bootstrap-infra.yml)
│   ├── release.yml                    # NEW — on push to main: build + deploy dev + gate prod
│   ├── scheduled-security.yml         # NEW — nightly vuln + secret scans
│   ├── reusable-backend.yml           # NEW — lint, type, unit, integration (LocalStack)
│   ├── reusable-frontend.yml          # NEW — lint, type, unit, build, e2e
│   ├── reusable-infra.yml             # NEW — fmt, validate, tflint, checkov
│   ├── reusable-docs.yml              # NEW — mintlify build check
│   └── reusable-deploy.yml            # NEW — terraform plan/apply via OIDC + smoke
├── actions/
│   ├── setup-python/action.yml        # NEW composite — uv install + cache
│   ├── setup-node/action.yml          # NEW composite — node + npm ci + cache
│   ├── setup-terraform/action.yml     # NEW composite — terraform + tflint + cache
│   └── aws-oidc/action.yml            # NEW composite — configure-aws-credentials wrapper
└── dependabot.yml                     # NEW — actions + pip + npm + terraform

deployments/                           # NEW — append-only audit ledger (git-tracked)
└── records/
    └── <env>/<timestamp>-<commit>.json
```

**Structure Decision**: Multi-workspace monorepo with a **single `Makefile` at the repo root** as the command contract, **LocalStack** in `docker-compose.backend.yml` as the canonical local AWS plane, and **reusable GitHub Actions workflows + composite actions** invoking that same `Makefile`. New content stays in directories already established by the constitution (`apps/`, `infra/`, `scripts/`, `docs/`, `.github/`) and adds a minimal `deployments/` ledger. Existing `.github/workflows/auth-bootstrap-*.yml` and `scripts/backend-local-*.sh` are migrated into the new structure (git-renamed where possible) rather than deleted outright, preserving history.

## Complexity Tracking

No constitutional violations — table intentionally omitted.
