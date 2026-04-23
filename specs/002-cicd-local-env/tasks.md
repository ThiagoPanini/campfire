---
description: "Task list for 002-cicd-local-env"
---

# Tasks: CI/CD Pipelines & Reproducible Local Environment

**Input**: Design documents from `/specs/002-cicd-local-env/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: The existing backend already has a unit/integration/contract test layout (`apps/api/tests/{unit,integration,contract,e2e}`). Test tasks below wire NEW behaviors of this feature (Makefile, LocalStack, workflows, deploy ledger) into that layout. No new TDD scaffolding is invented.

**Organization**: Tasks are grouped by user story. User stories from spec.md:

- **US1 (P1)**: Reproducible local backend for development & debugging
- **US2 (P1)**: Trustworthy pull-request CI gate
- **US3 (P2)**: Safe, auditable release & deployment
- **US4 (P2)**: Secure-by-default pipelines
- **US5 (P3)**: Maintainable, discoverable pipeline definitions

Per user request, **documentation updates are first-class throughout** — every story ships its own Mintlify topic(s), not a single "docs at the end" task.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks).
- **[Story]**: Which user story this task belongs to (e.g., US1, US2).

## Path Conventions

Multi-workspace monorepo (see plan.md "Project Structure"):

- Repo root: `Makefile`, `docker-compose.backend.yml`, `scripts/local/`, `scripts/ci/`, `deployments/`
- Backend: `apps/api/`
- Frontend: `apps/web/`
- Infra: `infra/terraform/`
- Docs (Mintlify): `docs/`
- Workflows: `.github/workflows/`, `.github/actions/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Repository-level scaffolding that every user story depends on.

- [X] T001 Create `Makefile` at repo root with the help system, phony-target declarations, and empty target bodies for every target listed in `specs/002-cicd-local-env/contracts/makefile-targets.md` (bodies filled incrementally by later tasks).
- [X] T002 [P] Create `scripts/local/` directory with empty executable stubs `up.sh`, `down.sh`, `test.sh`, `debug.sh`, `smoke.sh`, `doctor.sh` (each exits 0 with a `TODO` banner). Mark executable (`chmod +x`).
- [X] T003 [P] Create `scripts/ci/` directory with empty executable stubs `assert-oidc.sh`, `emit-deployment-record.sh`. Mark executable.
- [X] T004 [P] Create `deployments/records/dev/.gitkeep` and `deployments/records/prod/.gitkeep` so the ledger directory is tracked from day one.
- [X] T005 [P] Add `.github/actions/` directory with one subfolder per composite action (`setup-python/`, `setup-node/`, `setup-terraform/`, `aws-oidc/`), each containing an empty `action.yml` skeleton declaring `name`, `description`, and an empty `runs: { using: composite, steps: [] }`.
- [X] T006 [P] Add `.github/dependabot.yml` covering `github-actions`, `pip` (pointing at `apps/api`), `npm` (root and `apps/web`), and `terraform` (`infra/terraform/environments/dev`).
- [X] T007 Add `.editorconfig` rules for `Makefile` (tab indent, no trim on tabs) if not already present, and ensure `.gitignore` covers `./dist/` and `apps/api/.local/`.

**Checkpoint**: Repository has the skeleton for every surface this feature touches.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core machinery that every user story depends on — the Makefile command dispatcher, LocalStack-based local plane, and the composite actions CI workflows will call. NO user story work may begin until Phase 2 is complete.

- [X] T008 Fill `.github/actions/setup-python/action.yml` — composite action that installs Python 3.12, installs `uv`, and caches `~/.cache/uv` keyed on `apps/api/uv.lock`. Pin each `uses:` reference to a 40-char SHA.
- [X] T009 [P] Fill `.github/actions/setup-node/action.yml` — composite action that installs Node 20 LTS, runs `npm ci` at repo root, and caches keyed on `package-lock.json` + `apps/web/package-lock.json`. Pin SHAs.
- [X] T010 [P] Fill `.github/actions/setup-terraform/action.yml` — installs Terraform 1.8.5 + `tflint`, caches `.terraform` keyed on `**/.terraform.lock.hcl`. Pin SHAs.
- [X] T011 [P] Fill `.github/actions/aws-oidc/action.yml` — wraps `aws-actions/configure-aws-credentials` (pinned by SHA), requires `role-to-assume` + `aws-region` inputs, sets `role-session-name` to the workflow-run URL, and refuses to run if `id-token` permission is not present.
- [X] T012 Replace `docker-compose.backend.yml` content so the sole service is `localstack` using `localstack/localstack@sha256:<digest>` with `SERVICES=dynamodb,sts,ssm,secretsmanager,s3,logs`, port `4566:4566`, `PERSISTENCE=1`, and volume `localstack-data:/var/lib/localstack`. Remove the prior `dynamodb` service. Document the pinned digest in `contracts/localstack-services.md` (already templated) and update `scripts/backend-local-env.sh` so `DYNAMODB_ENDPOINT_URL` points at `http://localhost:4566`.
- [X] T013 Implement `scripts/local/doctor.sh` per the Prerequisite entity in `data-model.md` — check `docker`, `docker compose`, `python>=3.12`, `uv`, `node>=20`, `make`, and port `4566` availability. On failure, print the missing item plus a remediation URL and exit non-zero (satisfies FR-007).
- [X] T013A [US1] Extend `scripts/local/doctor.sh` to distinguish missing-tool failures from network-dependent failures, print which local commands require network access, and fail with an actionable timeout/error message rather than hanging when required network access is unavailable.
- [X] T014 Implement `scripts/local/up.sh` — runs `docker compose -f docker-compose.backend.yml up -d localstack`, waits for `GET /_localstack/health` to report all declared services as `running` (timeout 60 s), and invokes `make seed`.
- [X] T015 Implement `scripts/local/down.sh` — `docker compose -f docker-compose.backend.yml down -v --remove-orphans` scoped to this project's volume name only; does NOT touch unrelated docker state.
- [X] T016 Wire up the Makefile dispatch: make `make help` parse target comments, and make `make up`/`make down`/`make reset`/`make doctor` call the corresponding `scripts/local/*.sh`. Verify idempotency (FR-001/FR-002): running `make up` twice is a no-op after the first.
- [X] T017 [P] Create `scripts/local/seed.sh` that uses `boto3` (via `uv run`) against LocalStack to create the `campfire-local-users` DynamoDB table, the `campfire-local-artifacts` S3 bucket, `/campfire/local/**` SSM parameters, and placeholder Secrets Manager entries documented in `contracts/localstack-services.md`. Wire to `make seed`.
- [X] T018 [P] Update `apps/api/tests/conftest.py` so integration tests point `boto3` at `DYNAMODB_ENDPOINT_URL` (same env var already used); add a session-scoped fixture that asserts LocalStack health before yielding, failing fast with a message pointing at `make up` if it's unreachable (satisfies FR-013).
- [X] T019 Delete (git-rm) the legacy `scripts/backend-local-up.sh`, `scripts/backend-local-down.sh`, `scripts/backend-local-run.sh`, `scripts/backend-local-test.sh`, `scripts/backend-local-token.sh`, `scripts/backend-local-smoke.sh` after their logic is absorbed into `scripts/local/*.sh`. Keep `scripts/backend-local-env.sh` (the env-var loader) — it is still sourced by the new scripts.
- [X] T020 Create the foundational Mintlify index page for this feature: `docs/guides/platform/index.mdx` — lists the three new topic clusters (Local environment, CI/CD, Operations) and updates `docs/docs.json` to include them in the sidebar (addresses Constitution Principle XI and the user's "new topics" request).

**Checkpoint**: Developers can `make up` / `make down`, CI composite actions exist, and the docs sidebar has a "Platform" section ready to receive story-specific topics.

---

## Phase 3: User Story 1 — Reproducible local backend (Priority: P1) 🎯 MVP

**Goal**: A developer can clone the repo, run one `make` command, bring up the backend against LocalStack, run all tests, attach a debugger, and clean up — all in ≤ 15 minutes (SC-001).

**Independent Test**: On a fresh clone with prerequisites installed, run `make doctor && make up && make test && make debug` + client attach + `make down`. Every step passes without manual intervention. Verified by a new-hire-style dry run on both Linux and WSL2.

### Implementation for User Story 1

- [X] T021 [US1] Implement `scripts/local/test.sh` — invokes `make test/backend/unit test/backend/integration test/backend/contract test/frontend/unit` in sequence, honoring `PYTEST_ARGS` / `VITEST_ARGS` passthrough. Prints a one-line pass/fail summary per gate.
- [X] T022 [US1] Fill the Makefile test targets per `contracts/makefile-targets.md`: `test`, `test/backend/unit`, `test/backend/integration`, `test/backend/contract`, `test/frontend/unit`, `test/e2e`. Each depends on `make up` only where it needs LocalStack, so unit tests can run without the container.
- [X] T023 [US1] Implement `scripts/local/debug.sh` — starts the API under `python -m debugpy --listen 0.0.0.0:5678 --wait-for-client -m main.local_server` against the running LocalStack. Prints a banner with the attach hostname/port. Wire to `make debug`.
- [X] T024 [P] [US1] Add `apps/api/pyproject.toml` dev-extra `debugpy>=1.8` so `uv sync --extra dev` provides the debugger without a separate install step.
- [X] T025 [P] [US1] Add VS Code launch config `.vscode/launch.json` with a `Python: Remote Attach` entry pointing at `localhost:5678` and a PyCharm equivalent in `docs/guides/platform/local-environment.mdx` (below). Do NOT commit editor-specific workspace settings beyond the launch config.
- [X] T026 [US1] Add `apps/api/tests/integration/test_localstack_bootstrap.py` — asserts that after `make up` the seed resources exist (DynamoDB table present, SSM params resolvable, S3 bucket present, health endpoint reports `running` for every declared service). This is the canonical "LocalStack parity" regression test.
- [X] T027 [US1] Doctor-script self-test: add `apps/api/tests/unit/test_doctor_messages.py` that shells out to `scripts/local/doctor.sh --check=<name>` per prerequisite and verifies the error message + remediation URL format when a prerequisite is deliberately mocked missing (`PATH`-stripped subshell). Enforces FR-007 as a unit test.
- [X] T028 [US1] Fill `make clean` to remove `./dist/`, `apps/api/.local/`, and language caches (`.mypy_cache`, `.pytest_cache`, `apps/web/node_modules/.vite`) without touching tracked files.

### Documentation for User Story 1 (NEW Mintlify topics)

- [X] T029 [P] [US1] Write `docs/guides/platform/local-environment.mdx` mirroring `specs/002-cicd-local-env/quickstart.md`: prerequisites table, `make` targets, debugger attach procedure (VS Code + PyCharm), LocalStack inspection recipes, troubleshooting table. Add to `docs/docs.json` sidebar under "Platform → Local environment".
- [X] T029A [US1] Add an "Offline / restricted network" section to `docs/guides/platform/local-environment.mdx` listing which commands work offline, which require network access, the expected failure mode, and the remediation path.
- [X] T030 [P] [US1] Write `docs/guides/platform/localstack-services.mdx` — human-readable twin of `contracts/localstack-services.md` covering the launch service set, pinned digest, change control for adding services, and the deferred-services list. Add to sidebar.
- [X] T031 [P] [US1] Write ADR `docs/adr/0002-localstack-as-local-aws-plane.md` (Context / Decision / Consequences) citing `research.md §1`. Link from both Mintlify pages above and from `docs/adr/README.md` (create an ADR index if it doesn't exist).
- [X] T032 [P] [US1] Update `README.md` "Getting started" section to direct new contributors to `docs/guides/platform/local-environment.mdx`. Replace any references to the old `backend-local-*.sh` scripts with `make` equivalents.

**Checkpoint**: A new engineer can go from `git clone` to green tests and a working debugger in under 15 minutes, with documentation that matches exactly.

---

## Phase 4: User Story 2 — Trustworthy pull-request CI gate (Priority: P1)

**Goal**: Every PR runs path-scoped quality gates that finish within 15 minutes p90, produce actionable failure output, and block merge on required status checks.

**Independent Test**: Open four PRs — (a) docs-only, (b) backend-only with a deliberate lint violation, (c) infra-only with an invalid Terraform file, (d) cross-cutting with a leaked dummy secret — and confirm each PR gets the expected pass/fail with clear messages, no wasted unrelated jobs, and merge is blocked on failure.

### Implementation for User Story 2

- [ ] T033 [US2] Fill lint/type Makefile targets: `lint`, `lint/backend`, `lint/frontend`, `lint/infra`, `lint/workflows`, `type`, `type/backend`, `type/frontend`. Use `ruff`, `mypy`, `npm run lint`, `tsc --noEmit`, `terraform fmt -check`, `tflint`, `actionlint`.
- [ ] T034 [P] [US2] Fill infra validation target: `make validate/infra` — runs `terraform init -backend=false` + `terraform validate` for each environment under `infra/terraform/environments/*` and then `checkov -d infra/terraform --framework terraform --quiet`.
- [ ] T035 [P] [US2] Fill `make security` — orchestrates `gitleaks detect --source=. --no-banner`, `trivy fs --severity HIGH,CRITICAL --exit-code=1 .`, `pip-audit --strict -r apps/api/uv.lock`-equivalent (use `uv export` piped to `pip-audit`), `npm audit --omit=dev --audit-level=high`, and `zizmor .github/workflows/`.
- [ ] T036 [P] [US2] Fill `make docs` — runs the Mintlify build + broken-link check. If Mintlify is not yet installed as a CLI dep in the repo, use the `mintlify-docs` skill's recommended invocation and record the choice in the deployment runbook.
- [ ] T037 [US2] Fill `make ci` — aggregate target that runs `make lint type test validate/infra security docs` in the same order the CI summary job does. This is the local mirror that enforces SC-002.
- [ ] T038 [US2] Write `.github/workflows/reusable-backend.yml` — `workflow_call` inputs `python-version` (default 3.12). Jobs: `lint`, `type`, `unit`, `integration` (spins up LocalStack via `docker-compose.backend.yml`), `contract`. Each job uses `./.github/actions/setup-python` and shells out to `make <target>`. Concurrency: cancel-in-progress per PR.
- [ ] T039 [P] [US2] Write `.github/workflows/reusable-frontend.yml` — jobs `lint`, `type`, `unit`, `build`, `e2e` (last one boots LocalStack + backend via `make up` + starts the API process, then runs Playwright). Uses `./.github/actions/setup-node`.
- [ ] T040 [P] [US2] Write `.github/workflows/reusable-infra.yml` — jobs `fmt`, `validate`, `tflint`, `checkov`. Uses `./.github/actions/setup-terraform`.
- [ ] T041 [P] [US2] Write `.github/workflows/reusable-docs.yml` — single `build` job gated on `docs/**` paths. Blocks merge via the summary job.
- [ ] T042 [US2] Write `.github/workflows/pr.yml` — the top-level PR gate. Uses `dorny/paths-filter` (pinned SHA) to compute `backend`, `frontend`, `infra`, `docs` booleans, then conditionally calls each reusable workflow. Declares top-level `permissions: { contents: read }`. Triggers: `pull_request`, `merge_group`. Adds an `always-run` job for `make security`'s PR-fast subset (gitleaks + actionlint + zizmor + trivy fs). Orders cheap prerequisite gates before expensive jobs and skips or cancels downstream work when prerequisite gates fail. Ends with a `summary` job depending on all the above, succeeding iff all non-skipped deps succeeded (contract in `contracts/github-status-checks.md`).
- [ ] T042A [US2] Define the fail-fast policy in `specs/002-cicd-local-env/contracts/github-status-checks.md`: security and lint/type checks run first; integration and e2e jobs only run after prerequisite gates succeed; canceled jobs must surface as `skipped` or `cancelled` rather than disappearing.
- [ ] T042B [US2] Add explicit concurrency and cancellation behavior to the reusable workflows so superseded PR runs are canceled and blocked downstream jobs are visibly marked as skipped/cancelled.
- [ ] T043 [US2] Add `scripts/ci/summary-comment.sh` invoked by the `summary` job — posts or updates a sticky PR comment with gate name, conclusion, duration, log link, reproduction command, and the first actionable file/line reference when available (satisfies FR-012). Fails closed if the GitHub token is missing the `pull-requests: write` scope for this comment step only.
- [ ] T043A [US2] Standardize each Makefile gate so failures end with a compact footer containing: failing gate name, exact local reproduction command, and the first `file:line` reference when the underlying tool provides one. Use this footer as the source for CI failure summaries.
- [ ] T044 [US2] Configure GitHub merge queue + branch protection via repo settings (documented in the runbook; actual GitHub state is out-of-repo configuration, but record the required checks as `pr / summary` in `docs/guides/platform/ci-cd-overview.mdx` and a one-time admin checklist in `docs/guides/platform/branch-protection-checklist.mdx`).
- [ ] T045 [US2] Migrate `.github/workflows/auth-bootstrap-infra.yml` content into the new reusable workflows and delete (git-rm) the old file. Preserve the behavior (backend tests + Terraform validate on the auth-bootstrap paths) by ensuring `reusable-backend.yml` + `reusable-infra.yml` cover it; the migration itself is a single commit alongside the new `pr.yml`.
- [ ] T046 [US2] Enforce flake-report-only policy: add `pytest-rerunfailures` as a dev dep, configure `[tool.pytest.ini_options]` to record flakes without auto-retrying, and wire a scheduled weekly workflow `scheduled-flaky-report.yml` (skeleton here; body in Phase 7) that surfaces flaky markers. This upholds FR-014.

### Documentation for User Story 2 (NEW Mintlify topics)

- [ ] T047 [P] [US2] Write `docs/guides/platform/ci-cd-overview.mdx` — catalog of every workflow (trigger, purpose, gates, time budget), the status-check contract from `contracts/github-status-checks.md`, and the "how to re-run" / "how to skip with justification" procedures. Add to sidebar.
- [ ] T047A [US2] Document CI outage handling in `docs/guides/platform/ci-cd-overview.mdx`: how to identify runner/platform outages, when retry is appropriate, how to distinguish infrastructure failure from code failure, and what maintainers should do when branch protection is blocking merges.
- [ ] T048 [P] [US2] Write `docs/guides/platform/extending-ci.mdx` — how to add a new gate (one Makefile target, one reusable workflow step, one row in the quality-gate table). Covers the "local == CI" invariant from FR-008 with a concrete worked example (adding a new linter).
- [ ] T049 [P] [US2] Write `docs/guides/platform/branch-protection-checklist.mdx` — one-time admin setup of required checks, merge queue, and restricted settings (fork-PR policy, required reviewers).

**Checkpoint**: Every PR gets a trustworthy gate. Docs explain what runs, why, and how to change it.

---

## Phase 5: User Story 3 — Safe, auditable release & deployment (Priority: P2)

**Goal**: Merging to `main` produces an immutable, provenance-attested artifact; deploy-to-dev is automatic; deploy-to-prod is gated by human approval; every deploy has a retrievable audit record; rollback is a one-button operation.

**Independent Test**: Merge a trivial change to `main` → confirm artifact in S3, deployment record in `deployments/records/dev/`, non-prod deploy green, prod deploy waiting on approval. Approve prod, confirm record with `approved_by`. Trigger `workflow_dispatch` rollback with the prior artifact key, confirm a new record with `rollback_of` populated and the prior artifact redeployed (SC-008, ≤10 min).

### Implementation for User Story 3

- [ ] T050 [US3] Fill build Makefile targets: `build/api` (produces `./dist/api-lambda-<version>.zip` via `uv build` + bundling per `apps/api/pyproject.toml`), `build/web` (produces `./dist/web-static-<version>.tar.gz` via `npm run build:web`), and `package` (runs both). Version = `YYYY.MM.DD-<shortsha>` derived from `git rev-parse --short HEAD` + UTC date.
- [ ] T051 [P] [US3] Add SBOM generation to each build target using `syft packages <artifact>` producing SPDX JSON alongside the artifact. Store at `./dist/<artifact>.sbom.spdx.json`.
- [ ] T052 [P] [US3] Add SLSA provenance generation using GitHub's `actions/attest-build-provenance` (pinned SHA) during CI; locally, `make build/*` writes a placeholder attestation file for shape-parity but clearly marked `local-only`.
- [ ] T053 [US3] Fill deploy Makefile targets: `plan ENV=<env>` (runs `terraform plan -out=./dist/<env>.tfplan` in the matching `infra/terraform/environments/<env>`), `apply ENV=<env> PLAN=<path>` (runs `terraform apply <PLAN>` — refuses if plan missing or older than 24h), `smoke ENV=<env>` (invokes `scripts/local/smoke.sh` with the env's API base URL).
- [ ] T054 [US3] Implement `scripts/local/smoke.sh` as the generalized successor to `auth-bootstrap-smoke.sh`: takes `--api-url` + `--web-url`, runs a set of read-only probes (health endpoint, JWKS endpoint, signed-ping), emits structured pass/fail per probe.
- [ ] T055 [US3] Fill `make rollback ENV=<env> TO=<artifact_key>` — looks up the target artifact in S3, re-runs `make apply ENV=<env>` with a plan that only changes the artifact reference, and writes a rollback deployment record with `rollback_of` populated.
- [ ] T056 [US3] Implement `scripts/ci/emit-deployment-record.sh` per `contracts/deployment-record.schema.json` — takes env + artifact + outcome + smoke-result flags, generates the record JSON, validates it against the schema, commits it to `deployments/records/<env>/` with a deterministic filename, and pushes (on `release.yml` path, using a dedicated committer identity).
- [ ] T057 [US3] Write `.github/workflows/reusable-deploy.yml` — `workflow_call` inputs `environment`, `artifact-key` (optional; defaults to the just-built artifact). Steps: `scripts/ci/assert-oidc.sh`, `./.github/actions/aws-oidc`, `make plan`, `make apply`, `make smoke`, `scripts/ci/emit-deployment-record.sh`. On failure, emits a `failed`-outcome record and exits non-zero. Requires `permissions: { id-token: write, contents: write }`.
- [ ] T058 [US3] Write `.github/workflows/release.yml` — triggers on `push: { branches: [main, 'hotfix/**'] }` and `workflow_dispatch` (with `rollback_to` input). Jobs: `build` (runs `make package` + uploads artifact to the S3 artifact bucket with immutable key), `deploy-dev` (calls `reusable-deploy.yml` with `environment: dev`), `deploy-prod` (calls `reusable-deploy.yml` with `environment: prod`, wrapped by a GitHub Environment that enforces required reviewers). Concurrency: one lane for `main`, one per hotfix branch, with `cancel-in-progress: false`.
- [ ] T058A [US3] Add branch classification in `release.yml` so hotfix branches follow the same artifact, deploy-dev, deploy-prod, and deployment-record path as `main`, with the source branch captured in deployment metadata and surfaced in the runbook.
- [ ] T059 [P] [US3] Provision the artifact S3 bucket + object-lock configuration + KMS CMK via Terraform in a new module `infra/terraform/modules/artifact_bucket/` and wire it into `infra/terraform/environments/dev` and `prod`. Bucket name: `campfire-artifacts-<account>-<region>`, versioning on, object-lock in governance mode for the `prod/` prefix (90 days).
- [ ] T060 [P] [US3] Add `apps/api/tests/contract/test_deployment_record_schema.py` — JSON-Schema validation smoke that every record under `deployments/records/` validates against `specs/002-cicd-local-env/contracts/deployment-record.schema.json`. Run as part of `make test/backend/contract`.

### Documentation for User Story 3 (NEW Mintlify topics)

- [ ] T061 [P] [US3] Write `docs/guides/platform/deployment-runbook.mdx` — happy-path deploy, production-approval procedure, rollback procedure (with the `make rollback` command), artifact naming scheme, how to find a deployment record, and the "what to do when smoke fails" incident playbook.
- [ ] T062 [P] [US3] Write `docs/guides/platform/release-artifacts.mdx` — artifact bucket layout, versioning scheme, SBOM + provenance semantics, retention policy, object-lock caveats.
- [ ] T063 [P] [US3] Write `docs/guides/platform/environments.mdx` — per-environment configuration matrix (account, region, approval rules, approvers), how to add a new environment, and the boundaries between dev and prod.

**Checkpoint**: Deploys are safe, auditable, and rollable; every operational behavior is documented.

---

## Phase 6: User Story 4 — Secure-by-default pipelines (Priority: P2)

**Goal**: No long-lived cloud credentials in CI; every workflow uses least-privilege; third-party actions pinned by SHA; secrets never logged; fork-PR jobs can't access secrets.

**Independent Test**: Run the audit script `make audit/security-posture` — it must return zero findings against the checklist below; introducing any single violation (a `uses: foo@v1` tag, a workflow without explicit `permissions:`, a stored `AWS_ACCESS_KEY_ID`) must cause it to fail with a clear message.

### Implementation for User Story 4

- [ ] T064 [US4] Provision AWS OIDC identity provider + two IAM roles (`campfire-ci-dev`, `campfire-ci-prod`) via Terraform in `infra/terraform/modules/github_oidc/`, with trust policies matching `contracts/oidc-iam-trust.md`. Add least-privilege role policies scoped to the `campfire-<env>-*` name prefix only. Wildcards require a comment justification.
- [ ] T065 [US4] Implement `scripts/ci/assert-oidc.sh` — exits non-zero if `AWS_WEB_IDENTITY_TOKEN_FILE` is unset. Called at the top of every deploy job and every job that uses AWS at all.
- [ ] T066 [P] [US4] Add `make audit/security-posture` — a Makefile target that runs a set of checks:
  - Every `.github/workflows/*.yml` declares an explicit top-level `permissions:` block.
  - Every `uses:` in every workflow + composite action references a 40-char SHA (regex-enforced).
  - The repo's GitHub Actions secrets (via `gh secret list`) contain no `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, or other long-lived cloud key names (list maintained in `scripts/ci/forbidden-secrets.txt`).
  - Every workflow that uses `secrets` either pins to `github.repository` for fork PRs or is `workflow_dispatch`-only.
  - Wire into `make security` and `pr.yml`'s always-run job.
- [ ] T067 [US4] Write `.github/workflows/scheduled-security.yml` — nightly cron. Jobs: `trivy-image` (scans the LocalStack image pin and any container images we publish), `pip-audit`, `npm-audit`, `sbom-publish` (regenerates SBOM for the latest `latest-dev` artifact). Failures open a GitHub issue (via `peter-evans/create-issue-from-file` pinned by SHA) rather than blocking a PR.
- [ ] T067A [US4] For scheduled and external-service-dependent jobs, add bounded retry/backoff only for known transient infrastructure failures; otherwise fail with an explicit outage-classification message that distinguishes platform issues from repository issues.
- [ ] T068 [P] [US4] Add a fork-PR-safety test: a synthetic PR from a fork in a test environment (documented manual check) must show the `deploy-*` and integration jobs requiring secrets as `skipped` with a visible comment. The comment is posted by `scripts/ci/fork-pr-comment.sh`, invoked from `pr.yml` when `github.event.pull_request.head.repo.full_name != github.repository`.
- [ ] T069 [US4] Configure all reusable workflows + composite actions so every `uses:` is a pinned SHA. Run `make audit/security-posture` as a one-time sweep; replace any floating tags inherited from earlier scaffolding.
- [ ] T070 [P] [US4] Add `zizmor` and `actionlint` configs (`.zizmor.yml`, `.actionlint.yaml`) capturing any intentional exceptions with justification comments. Any exception must reference a GitHub issue.

### Documentation for User Story 4 (NEW Mintlify topics)

- [ ] T071 [P] [US4] Write `docs/guides/platform/security-posture.mdx` — the current posture (OIDC, least privilege, pinned SHAs, fork-PR policy, scheduled scans), how `make audit/security-posture` enforces it, and how to add a new workflow without regressing the posture.
- [ ] T072 [P] [US4] Write `docs/guides/platform/oidc-federation.mdx` — plain-language twin of `contracts/oidc-iam-trust.md`: how the trust works, how to add a new environment role, how to rotate, and the CloudTrail correlation recipe (`RoleSessionName` ↔ workflow-run URL).
- [ ] T073 [P] [US4] Write ADR `docs/adr/0003-github-oidc-for-aws-deploy.md` citing `research.md §4`, and ADR `docs/adr/0004-makefile-as-command-surface.md` citing `research.md §2`. Both link from `docs/adr/README.md`.

**Checkpoint**: Security posture is enforced in code, not just in docs.

---

## Phase 7: User Story 5 — Maintainable, discoverable pipelines (Priority: P3)

**Goal**: Shared CI logic lives in one place; naming is consistent; a new contributor can extend a workflow in under an hour.

**Independent Test**: Pick an existing gate (e.g., `lint/backend`). Add a new sub-step (e.g., a new ruff rule set). Verify it runs via `make lint/backend` locally AND in CI after a one-line edit to the Makefile target (no workflow YAML edit required). Time from start to merged: under an hour.

### Implementation for User Story 5

- [ ] T074 [US5] Audit and dedupe: every step in `.github/workflows/*` that invokes something other than `make <target>` is either (a) rewritten to call a Makefile target, or (b) moved to a composite action with a documented reason. Produce a short rationale in `docs/guides/platform/extending-ci.mdx` for any exception.
- [ ] T075 [P] [US5] Add a workflow-naming lint: `scripts/ci/lint-naming.sh` ensures workflow file names, job IDs, and composite action names follow `kebab-case` + the documented convention. Wire into `make lint/workflows`.
- [ ] T076 [P] [US5] Implement `scheduled-flaky-report.yml` (stubbed in T046) — weekly report of flaky test markers, posted as a GitHub issue with the list and the failing-rate data pulled from a simple `pytest` JSON report archive in GitHub Actions artifacts (retention 30 days).
- [ ] T077 [US5] Add a repo-level `make index` target that prints a single, sorted catalog of: every Makefile public target, every reusable workflow + its inputs, every composite action + its inputs, and every scheduled workflow. Output committed as `docs/guides/platform/command-index.mdx` by a one-time setup and regenerated in CI on a `docs/` change to prevent drift.

### Documentation for User Story 5 (NEW Mintlify topics)

- [ ] T078 [P] [US5] Write `docs/guides/platform/command-index.mdx` — the single discoverable index referenced by FR-030, auto-generated from `make index`.
- [ ] T079 [P] [US5] Write `docs/guides/platform/contributing-to-pipelines.mdx` — one-hour onboarding for a new contributor touching the pipelines, linking to `extending-ci.mdx`, `security-posture.mdx`, and the ADRs.

**Checkpoint**: Pipelines are discoverable, DRY, and newcomer-friendly.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation sweep, removal of legacy artifacts, validation of success criteria.

- [ ] T080 [P] Update `docs/docs.json` to reflect the final sidebar: a "Platform" section with sub-sections "Local environment", "CI/CD", "Security", "Operations", each pointing to the pages created in Phases 3–7. Run `make docs` locally; fix any broken links.
- [X] T081 [P] Update `docs/introduction.mdx` and `docs/quickstart.mdx` to reference the new Platform section.
- [X] T082 [P] Update repo `README.md`: refresh the "Development" section to be a pointer to `docs/guides/platform/local-environment.mdx` and `docs/guides/platform/ci-cd-overview.mdx`; remove any stale references to the retired workflow files and scripts.
- [ ] T083 Run the quickstart validation (`specs/002-cicd-local-env/quickstart.md` step 1 through 5) on a clean clone and time it; record the measured time in `docs/guides/platform/local-environment.mdx` as evidence for SC-001.
- [ ] T084 Measure SC-003 (PR CI ≤ 15 min p90) over 10 synthetic PRs touching each path category; record in the same doc. Tune job concurrency/caching if the budget is missed.
- [ ] T085 [P] Archive the spec-kit checklist: mark every item in `specs/002-cicd-local-env/checklists/requirements.md` as verified post-implementation.
- [ ] T086 [P] Remove the legacy `.github/workflows/auth-bootstrap-smoke.yml` only after confirming the new `reusable-deploy.yml` + `make smoke` path covers its use cases. Replace any external references.
- [ ] T087 Close the loop with the constitution: add a brief "Platform & CI/CD" entry to the project's ADR index documenting that this feature landed, linking to the plan and the four new ADRs.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1. BLOCKS every user story.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2. May be worked in parallel with Phase 3.
- **Phase 5 (US3)**: Depends on Phase 2 AND on US2 landing the `reusable-*.yml` foundation (T038–T042) because `reusable-deploy.yml` reuses the same composite actions and summary-job pattern.
- **Phase 6 (US4)**: Depends on Phase 2. US4's OIDC roles are required by US3's deploy jobs, so **T064–T065 must land before T057–T058 can be exercised end-to-end** — keep that ordering even when the two phases run in parallel.
- **Phase 7 (US5)**: Depends on Phases 2–6 (can't dedupe what isn't there yet).
- **Phase 8 (Polish)**: Depends on all user-story phases.

### Within Each Phase

- Makefile skeleton (T001) before any target-body task.
- Composite actions (T008–T011) before reusable workflows that use them.
- `docker-compose.backend.yml` update (T012) before `scripts/local/up.sh` (T014) which is before `make up` wiring (T016) which is before integration-test fixtures (T018).
- Smoke script (T054) before `reusable-deploy.yml` uses it (T057).
- OIDC roles in AWS (T064) before `reusable-deploy.yml` can complete a real deploy (T058).
- Every implementation task precedes its matching Mintlify documentation task within the same phase; docs describe the shipped reality, not the plan.

### Parallel Opportunities

- **Phase 1**: T002, T003, T004, T005, T006 all in parallel.
- **Phase 2**: T009, T010, T011 parallel with each other (different composite-action files). T017, T018 parallel after T014.
- **Phase 3**: T024, T025, T029, T030, T031, T032 parallel (different files). T026 and T027 parallel (different test files).
- **Phase 4**: T034, T035, T036, T039, T040, T041 parallel. T047, T048, T049 parallel (different doc pages).
- **Phase 5**: T051, T052, T059, T060 parallel. T061, T062, T063 parallel.
- **Phase 6**: T066, T068, T070 parallel. T071, T072, T073 parallel.
- **Phase 7**: T075, T076 parallel. T078, T079 parallel.
- **Phase 8**: T080, T081, T082, T085, T086 parallel.

### Parallel Example: Phase 3 (User Story 1) documentation sweep

```bash
# After implementation tasks T021–T028 are green, run the doc tasks in parallel:
#   T029 docs/guides/platform/local-environment.mdx
#   T030 docs/guides/platform/localstack-services.mdx
#   T031 docs/adr/0002-localstack-as-local-aws-plane.md
#   T032 README.md update
# Each touches a distinct file; a single developer (or four parallel agents) can work them concurrently.
```

---

## Implementation Strategy

1. **MVP scope = User Story 1 (Phase 3)** plus its Phase 1 + Phase 2 prerequisites. Delivered in isolation, it already satisfies the "reproducible local environment" half of the feature's primary objective and unblocks every engineer.
2. **First shippable increment past MVP = User Story 2 (Phase 4)**. Adds the PR gate; combined with US1, the repository now has a trustworthy "green = safe" signal.
3. **Second increment = User Stories 3 + 4 together (Phases 5 + 6)**. Deploy automation is only safe once security posture is enforced; those two stories are co-scheduled so the OIDC roles (US4) exist before the deploy workflow (US3) runs in anger.
4. **Third increment = User Story 5 (Phase 7)**. Dedupe and discoverability — valuable, but not blocking any user-facing outcome.
5. **Finalization = Phase 8** — docs sweep and success-criteria evidence.

Each user story is independently testable against its Independent Test criterion; any one of them can be reverted without reverting the others.
