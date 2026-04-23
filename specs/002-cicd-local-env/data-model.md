# Phase 1 — Data Model

**Feature**: CI/CD Pipelines & Reproducible Local Environment
**Date**: 2026-04-23

This feature is platform infrastructure, so "data" here means the configuration and
record entities that the pipelines produce and consume — not user-facing persistence.

---

## Entity: Workflow

A named, versioned GitHub Actions workflow.

| Field | Type | Notes |
|---|---|---|
| `name` | string | Human-readable, appears in UI and status checks. |
| `file` | path | `.github/workflows/<name>.yml`. |
| `triggers` | enum set | `pull_request`, `push`, `merge_group`, `workflow_dispatch`, `schedule`. |
| `required_permissions` | map | Minimum GITHUB_TOKEN scopes; default `contents: read`. |
| `environment` | string? | GitHub Environment name (deploy workflows only). |
| `required_secrets` | list[string] | Declared and validated at step 0; workflow fails closed if missing. |
| `time_budget_minutes` | int | Declared; monitored via workflow-run analytics. |
| `owner` | string | Maintainer or team handle. |

Invariants:
- Every workflow MUST declare `permissions:` at the workflow level (no implicit defaults).
- Every workflow invoking AWS MUST declare `id-token: write` at the job level, nowhere else.
- Third-party `uses:` references MUST be 40-char SHAs, not tags.

---

## Entity: Reusable Workflow

A workflow called by other workflows via `workflow_call`.

| Field | Type | Notes |
|---|---|---|
| `name` | string | `reusable-<scope>.yml`. |
| `inputs` | map | Typed inputs (bool/string/number). |
| `outputs` | map | E.g. `artifact_key`, `status`. |
| `secrets_inherited` | bool | `secrets: inherit` only if strictly required. |

Invariants:
- Every reusable workflow MUST document its contract (inputs/outputs) at the top of the file.

---

## Entity: Composite Action

A reusable action under `.github/actions/<name>/action.yml`.

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `inputs` | map | |
| `outputs` | map | |
| `wraps` | list[string] | External actions wrapped, each pinned by SHA. |

Invariants:
- A composite action MUST be pinned to a commit when referenced across workflows (`./.github/actions/<name>` is stable within the repo).

---

## Entity: Quality Gate

A named check with a pass/fail contract.

| Field | Type | Notes |
|---|---|---|
| `id` | slug | `backend.lint`, `backend.type`, `backend.unit`, `backend.integration`, `frontend.unit`, `frontend.e2e`, `infra.validate`, `infra.checkov`, `security.secrets`, `security.workflow`, `docs.build`. |
| `make_target` | string | The `Makefile` target that implements the gate. |
| `blocking` | bool | Whether failure blocks merge. |
| `path_scope` | list[glob] | Paths that trigger the gate. |
| `time_budget_seconds` | int | |

Invariants:
- Every gate MUST be invokable locally by running its `make_target`.
- Adding a gate means adding one row here AND one target in `Makefile` AND one step in a reusable workflow — no more, no less.

---

## Entity: Build Artifact

An immutable, uniquely versioned output of a build.

| Field | Type | Notes |
|---|---|---|
| `artifact_key` | string | S3 key: `<component>/<yyyy>/<mm>/<yyyy.mm.dd-<shortsha>>.<ext>`. |
| `component` | enum | `api-lambda`, `web-static`, `infra-plan`. |
| `version` | string | `YYYY.MM.DD-<shortsha>`. |
| `source_commit` | sha | 40-char. |
| `built_at` | ISO-8601 | UTC. |
| `built_by_workflow_run` | URL | GitHub workflow run URL. |
| `sbom_key` | string | S3 key of attached SBOM (SPDX JSON). |
| `provenance_key` | string | S3 key of SLSA provenance attestation. |
| `sha256` | hex | Content hash. |
| `size_bytes` | int | |

Invariants:
- `artifact_key` MUST be unique across all time (no overwrite).
- `version` MUST be monotonically orderable by time.
- Every artifact MUST have a linked SBOM and provenance attestation.

---

## Entity: Environment

A target deployment stage.

| Field | Type | Notes |
|---|---|---|
| `name` | enum | `dev`, `prod` (extensible). |
| `aws_account_id` | string | |
| `aws_region` | string | |
| `iam_role_arn` | string | Role assumed via OIDC. |
| `approval_required` | bool | `false` for `dev`, `true` for `prod`. |
| `approvers` | list[github-handle] | Only meaningful when `approval_required`. |
| `smoke_command` | string | `make smoke ENV=<name>`. |
| `state_backend` | S3 URI | Terraform state location. |

Invariants:
- `prod` MUST have `approval_required: true` and at least one approver.
- Shared accounts across environments are forbidden (Constitution Principle X).

---

## Entity: Deployment Record

An append-only audit entry linking one artifact to one environment.

Stored at `deployments/records/<env>/<YYYYMMDDTHHMMSSZ>-<shortsha>.json` (git-tracked) and mirrored to S3 under `deployments/<env>/` with the same key shape. Schema: [contracts/deployment-record.schema.json](contracts/deployment-record.schema.json).

| Field | Type | Notes |
|---|---|---|
| `id` | string | `<timestamp>-<shortsha>`. |
| `environment` | enum | Matches Environment.name. |
| `artifact_key` | string | Matches Build Artifact.artifact_key. |
| `artifact_version` | string | Denormalized for quick lookup. |
| `source_commit` | sha | |
| `deployed_at` | ISO-8601 | |
| `actor` | github-handle | Who triggered. |
| `approved_by` | github-handle? | Required when environment.approval_required. |
| `approved_at` | ISO-8601? | |
| `workflow_run_url` | URL | |
| `outcome` | enum | `succeeded`, `failed`, `rolled-back`. |
| `previous_artifact_key` | string? | The artifact this replaced — used as the rollback target. |
| `rollback_of` | string? | If this record is itself a rollback, the id of the failed deployment. |
| `smoke_result` | enum | `pass`, `fail`, `skipped`. |
| `terraform_plan_sha256` | hex | Hash of the plan file that was applied. |

Invariants:
- Records are **append-only**; corrections are new records, not edits.
- A `rolled-back` outcome MUST be followed (chronologically) by a deploy record whose `rollback_of` points back to it.

State transitions:

```
pending → succeeded
pending → failed
succeeded → rolled-back   (via a new deploy record of the prior artifact, whose rollback_of points here)
```

---

## Entity: Local Stack Definition

The source-of-truth for "what the backend needs locally."

| Field | Type | Notes |
|---|---|---|
| `services` | list[enum] | `dynamodb`, `sts`, `ssm`, `secretsmanager`, `s3`, `logs` at launch. |
| `localstack_image_digest` | string | Pinned `localstack/localstack@sha256:...`. |
| `seed_data` | list[path] | JSON/SQL files applied by `make seed`. |
| `health_probes` | list[{service, endpoint, timeout_s}] | Used by `make up` readiness wait. |
| `ports` | list[int] | Reserved host ports (single `4566` at launch). |

Invariants:
- The same definition is used by `make up` locally AND by the integration-test CI job.
- Changing `localstack_image_digest` is a PR-level change, not a runtime change.

---

## Entity: Prerequisite

Something the developer machine MUST have for `make up` / `make test` to work.

| Field | Type | Notes |
|---|---|---|
| `name` | string | `docker`, `docker-compose`, `python>=3.12`, `uv`, `node>=20`, `make`. |
| `check_command` | string | Run by `make doctor`. |
| `remediation_url` | URL | |
| `required_for` | list[string] | Subset of make targets. |

Invariants:
- Missing prerequisites MUST fail with a clear message and remediation (FR-007), never a stack trace.

---

## Relationships

```
Workflow ──calls──▶ Reusable Workflow ──uses──▶ Composite Action
                                          │
                                          └──invokes──▶ Quality Gate ──runs──▶ Makefile target

Release workflow ──produces──▶ Build Artifact ──deployed-to──▶ Environment
                                         │                          │
                                         └──────── referenced by ───┴──▶ Deployment Record
                                                                            ▲
                                                                            │
                                                              rollback_of   │ previous_artifact_key
                                                                            ▼
                                                                    Deployment Record

Local Stack Definition ◀── shared by ── Developer (make up) AND Integration-test CI job
```
