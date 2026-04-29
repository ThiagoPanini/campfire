# Tasks: Complete CI/CD Pipeline for Campfire

**Input**: Design documents from `/specs/005-cicd-pipeline/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Tests**: The specification defines independent verification criteria for each story. This infra feature uses story-level verification tasks rather than new app test files.
**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches a different file and has no dependency on incomplete tasks.
- **[Story]**: Maps to the user story in `spec.md` (`US1`, `US1A`, `US2`, etc.).
- Every task names the concrete file or directory path to change or verify.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the repository locations and shared metadata files used by the CI/CD feature.

- [X] T001 Create infrastructure directories `.github/workflows/`, `scripts/ci/`, and `docs/backend/ops/`
- [X] T002 [P] Create the validation and promotion checklist in `.github/pull_request_template.md`
- [X] T003 [P] Create weekly dependency update configuration in `.github/dependabot.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared scripts used by multiple workflows. These must be complete before any deployment or PR automation story is implemented.

- [X] T004 [P] Implement bounded HTTP probing in `scripts/ci/probe-url.sh`
- [X] T005 [P] Implement secret-safe Render deploy hook invocation in `scripts/ci/render-deploy.sh`
- [X] T006 [P] Implement missing-name-only environment validation in `scripts/ci/preflight-secrets.sh`
- [X] T007 [P] Implement feature-to-staging PR body generation in `scripts/ci/feature-pr-body.sh`
- [X] T008 [P] Implement staging-to-main promotion PR body generation in `scripts/ci/promotion-pr-body.sh`
- [X] T009 Implement idempotent GitHub PR create/update helper in `scripts/ci/ensure-pr.sh`
- [X] T010 Set executable permissions on `scripts/ci/probe-url.sh`, `scripts/ci/render-deploy.sh`, `scripts/ci/preflight-secrets.sh`, `scripts/ci/feature-pr-body.sh`, `scripts/ci/promotion-pr-body.sh`, and `scripts/ci/ensure-pr.sh`

**Checkpoint**: Shared workflow scripts are ready for CI, deployment, and PR automation stories.

---

## Phase 3: User Story 1 - Validated pull request into `staging` (Priority: P1)

**Goal**: Pull requests into `staging` and `main`, plus pushes to those branches, run named validation jobs and expose a single required `ci-status` check.

**Independent Test**: Open or update a PR into `staging` with a deliberate TypeScript or Alembic failure; confirm the failing named job is clear and `ci-status` blocks merge until fixed.

### Implementation for User Story 1

- [X] T011 [US1] Create CI workflow skeleton with triggers, permissions, concurrency, and job ordering in `.github/workflows/ci.yml`
- [X] T012 [US1] Add frontend dependency install, typecheck, build, and `apps/web/dist/` artifact upload in `.github/workflows/ci.yml`
- [X] T013 [US1] Add backend `uv sync --frozen`, `ruff`, and non-blocking `mypy` warning steps in `.github/workflows/ci.yml`
- [X] T014 [US1] Add backend unit test job for `apps/api/tests/unit/` in `.github/workflows/ci.yml`
- [X] T015 [US1] Add PostgreSQL 16 integration test job for `apps/api/tests/integration/` in `.github/workflows/ci.yml`
- [X] T016 [US1] Add migrations and contract test job for `apps/api/alembic/` and `apps/api/tests/contract/` in `.github/workflows/ci.yml`
- [X] T017 [US1] Add docs JSON parsing, navigation target checks, `.env.example`, constitution, and diff-based secrets-scan hygiene job in `.github/workflows/ci.yml`
- [X] T018 [US1] Add `main` PR source-branch policy and feature-branch naming warning checks in `.github/workflows/ci.yml`
- [X] T019 [US1] Add `ci-status` aggregate job that fails on any failed, cancelled, or skipped dependency in `.github/workflows/ci.yml`
- [X] T020 [US1] Verify CI workflow names, summaries, timeouts, and required-check semantics in `.github/workflows/ci.yml`

**Checkpoint**: User Story 1 is independently verifiable with a failing and then fixed PR into `staging`.

---

## Phase 4: User Story 2 - Automatic staging deployment on merge into `staging` (Priority: P1)

**Goal**: A green `staging` branch tip deploys API and Web to Render staging, then probes `/healthz`, `/readyz`, and the public frontend URL.

**Independent Test**: Merge a trivial change into `staging`; confirm the staging workflow runs once, calls both staging deploy hooks, probes all three URLs, and identifies the deployed commit.

### Implementation for User Story 2

- [X] T021 [US2] Create staging deploy workflow skeleton with exact-SHA successful CI gating, triggers, permissions, concurrency, environment, and branch guard in `.github/workflows/deploy-staging.yml`
- [X] T022 [US2] Add staging API Render deploy job using `scripts/ci/render-deploy.sh` in `.github/workflows/deploy-staging.yml`
- [X] T023 [US2] Add staging Web Render deploy job using `scripts/ci/render-deploy.sh` in `.github/workflows/deploy-staging.yml`
- [X] T024 [US2] Add staging post-deploy probe job for `STAGING_API_URL` and `STAGING_WEB_URL` using `scripts/ci/probe-url.sh` in `.github/workflows/deploy-staging.yml`
- [X] T025 [US2] Verify staging deploy summaries, bounded probe behavior, and secret-safe hook logging in `.github/workflows/deploy-staging.yml`

**Checkpoint**: User Story 2 can deploy staging independently after a green `staging` branch run.

---

## Phase 5: User Story 4 - Gated production deployment on merge into `main` (Priority: P1)

**Goal**: A green `main` branch tip deploys production only through the protected GitHub Environment, with production-scoped secrets and post-deploy probes.

**Independent Test**: Attempt production deployment from a non-`main` ref and confirm it is refused; then merge an approved `staging -> main` PR and confirm production deploy waits for the Environment gate before hooks run.

### Implementation for User Story 4

- [X] T026 [US4] Create production deploy workflow skeleton with exact-SHA successful CI gating, triggers, permissions, concurrency, environment, and branch guard in `.github/workflows/deploy-production.yml`
- [X] T027 [US4] Add production preflight job that reads production environment values via `scripts/ci/preflight-secrets.sh` in `.github/workflows/deploy-production.yml`
- [X] T028 [US4] Add production API and Web Render deploy jobs using `scripts/ci/render-deploy.sh` in `.github/workflows/deploy-production.yml`
- [X] T029 [US4] Add production post-deploy probe job for `PROD_API_URL` and `PROD_WEB_URL` using `scripts/ci/probe-url.sh` in `.github/workflows/deploy-production.yml`
- [X] T030 [US4] Add always-running production deployment summary with commit SHA and environment result in `.github/workflows/deploy-production.yml`
- [X] T031 [US4] Verify production-only branch enforcement and GitHub Environment gate behavior in `.github/workflows/deploy-production.yml`

**Checkpoint**: User Story 4 can deploy production only from `main` after the protected environment permits it.

---

## Phase 6: User Story 1A - Automatic feature branch PR into `staging` (Priority: P2)

**Goal**: Pushes to `###-feature-name` branches create or update exactly one PR into `staging`, while ignored branches and no-diff branches exit successfully.

**Independent Test**: Push `123-sample-feature` with a small change and confirm one PR opens into `staging`; push again and confirm the same PR is updated; push `scratch-test` and confirm no PR opens.

### Implementation for User Story 1A

- [X] T032 [US1A] Create feature PR workflow skeleton with push trigger, minimal permissions, and branch exclusions in `.github/workflows/feature-pr.yml`
- [X] T033 [US1A] Add Spec-Kit branch pattern, deleted-ref, protected-branch, and no-diff guards in `.github/workflows/feature-pr.yml`
- [X] T034 [US1A] Wire `scripts/ci/feature-pr-body.sh` and `scripts/ci/ensure-pr.sh` into `.github/workflows/feature-pr.yml`
- [X] T035 [US1A] Add idempotent labels, title, body refresh, and duplicate prevention behavior in `.github/workflows/feature-pr.yml`
- [X] T036 [US1A] Verify ignored branch, no-diff branch, first push, and repeated push behavior in `.github/workflows/feature-pr.yml`

**Checkpoint**: User Story 1A can run independently from a pushed feature branch without changing application files.

---

## Phase 7: User Story 3 - Automatic `staging -> main` promotion PR (Priority: P2)

**Goal**: A successful staging deployment creates or updates a single promotion PR from `staging` into `main` with commit context and production-readiness checks.

**Independent Test**: Complete a successful staging deploy; confirm a `staging -> main` PR exists and is updated, not duplicated, after the next successful staging deploy.

### Implementation for User Story 3

- [X] T037 [US3] Finalize commit-list and production-readiness checklist content in `scripts/ci/promotion-pr-body.sh`
- [X] T038 [US3] Add promotion PR job using `scripts/ci/ensure-pr.sh` and `scripts/ci/promotion-pr-body.sh` in `.github/workflows/deploy-staging.yml`
- [X] T039 [US3] Gate the promotion PR job on successful staging probes only in `.github/workflows/deploy-staging.yml`
- [X] T040 [US3] Verify closed-PR, existing-open-PR, and failed-probe behavior in `.github/workflows/deploy-staging.yml`

**Checkpoint**: User Story 3 is independently verifiable after any green staging deployment.

---

## Phase 8: User Story 5 - Controlled behaviour when production is not yet provisioned (Priority: P2)

**Goal**: Production deploy fails closed before contacting Render when required production secrets or variables are missing.

**Independent Test**: Run production deployment with production values unset; confirm preflight lists missing names only, exits non-zero, and no deploy hook job runs.

### Implementation for User Story 5

- [X] T041 [US5] Strengthen missing-value output to list names only and never values in `scripts/ci/preflight-secrets.sh`
- [X] T042 [US5] Add production-not-configured error text and `docs/backend/ops/cicd.mdx#provisioning-production` link in `.github/workflows/deploy-production.yml`
- [X] T043 [US5] Verify deploy jobs are skipped after preflight failure when production values are absent in `.github/workflows/deploy-production.yml`

**Checkpoint**: User Story 5 protects the unprovisioned production environment without leaking secrets.

---

## Phase 9: User Story 7 - Operational documentation for first-time setup and rollback (Priority: P2)

**Goal**: A maintainer can configure GitHub, Render, branch protection, migrations, rollback, and troubleshooting from one docs entry point without reading workflow YAML.

**Independent Test**: Give the runbook to a fresh maintainer or agent and confirm they can name every required secret, describe rollback, and list the branch-protection checks without opening workflow source.

### Implementation for User Story 7

- [X] T044 [US7] Create the CI/CD operations runbook entry point in `docs/backend/ops/cicd.mdx`
- [X] T045 [US7] Add complete GitHub secrets and variables inventory for staging and production in `docs/backend/ops/cicd.mdx`
- [X] T046 [US7] Add GitHub Environments and branch protection setup for `staging` and `main` in `docs/backend/ops/cicd.mdx`
- [X] T047 [US7] Add Render service setup, deploy hook setup, disabled auto-deploy requirements, and staging migration procedure in `docs/backend/ops/cicd.mdx`
- [X] T048 [US7] Add staging PostgreSQL 20-day recreation note, disposable data guidance, production approval-before-preflight nuance, rollback procedure, and troubleshooting guide in `docs/backend/ops/cicd.mdx`
- [X] T049 [US7] Add the CI/CD operations runbook to Mintlify navigation in `docs/docs.json`
- [X] T050 [US7] Verify the runbook inventory matches `.github/workflows/ci.yml`, `.github/workflows/deploy-staging.yml`, and `.github/workflows/deploy-production.yml`

**Checkpoint**: User Story 7 is independently verifiable through documentation review and setup rehearsal.

---

## Phase 10: User Story 6 - Manual redeploy escape hatch (Priority: P3)

**Goal**: The maintainer can manually redeploy a known-good `staging` or `main` commit through `workflow_dispatch` with the same branch guards, environment gates, concurrency, and probes as automatic deploys.

**Independent Test**: Dispatch staging on `staging` and production on `main`; confirm both run the standard deploy and probe paths, while dispatching from any other branch exits with a clear refusal.

### Implementation for User Story 6

- [X] T051 [US6] Harden `workflow_dispatch` handling and branch-ref refusal for manual staging redeploys in `.github/workflows/deploy-staging.yml`
- [X] T052 [US6] Harden `workflow_dispatch` handling, production environment approval, and branch-ref refusal for manual production redeploys in `.github/workflows/deploy-production.yml`
- [X] T053 [US6] Document manual redeploy steps and failure interpretation in `docs/backend/ops/cicd.mdx`

**Checkpoint**: User Story 6 provides a safe manual redeploy path without bypassing normal deployment controls.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full CI/CD package and align generated docs with the final implementation.

- [X] T054 [P] Run shell syntax validation and fix issues in `scripts/ci/probe-url.sh`, `scripts/ci/render-deploy.sh`, `scripts/ci/preflight-secrets.sh`, `scripts/ci/feature-pr-body.sh`, `scripts/ci/promotion-pr-body.sh`, and `scripts/ci/ensure-pr.sh`
- [X] T055 Run GitHub workflow static validation and fix issues in `.github/workflows/feature-pr.yml`, `.github/workflows/ci.yml`, `.github/workflows/deploy-staging.yml`, and `.github/workflows/deploy-production.yml`
- [X] T056 [P] Validate the quickstart against the final workflow and runbook paths in `specs/005-cicd-pipeline/quickstart.md`
- [X] T057 [P] Reconcile final secrets and variables inventory in `docs/backend/ops/cicd.mdx`
- [X] T058 Record any blocked external GitHub or Render configuration steps in `docs/backend/ops/cicd.mdx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup; blocks all workflow stories.
- **P1 User Stories (Phases 3-5)**: Depend on Foundational; implement in order US1 -> US2 -> US4 for the safest MVP path.
- **P2 User Stories (Phases 6-9)**: Depend on Foundational and the relevant workflow file from P1.
- **P3 User Story (Phase 10)**: Depends on the staging and production deploy workflows.
- **Polish (Phase 11)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no dependency on other user stories.
- **US2 (P1)**: Starts after Foundational; deployment value is strongest after US1 is green.
- **US4 (P1)**: Starts after Foundational; production deployment is independently testable with preflight and branch guards.
- **US1A (P2)**: Starts after Foundational; benefits from US1 because created PRs need CI checks.
- **US3 (P2)**: Depends on US2 because promotion PRs are created only after successful staging probes.
- **US5 (P2)**: Depends on US4 because it refines production preflight failure behavior.
- **US7 (P2)**: Can start after Foundational, but final verification depends on US1, US2, US3, US4, and US5.
- **US6 (P3)**: Depends on US2 and US4 because it reuses their deploy paths.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T004 through T008 can run in parallel after T001.
- After T010, US1, US2, US4, and US1A can be developed by separate people with coordination on shared scripts.
- US7 documentation drafting can begin in parallel with workflow implementation, then T050 reconciles it with final workflow names.
- T054, T056, and T057 can run in parallel once implementation is complete.

---

## Parallel Example: Foundational Scripts

```bash
Task: "Implement bounded HTTP probing in scripts/ci/probe-url.sh"
Task: "Implement secret-safe Render deploy hook invocation in scripts/ci/render-deploy.sh"
Task: "Implement missing-name-only environment validation in scripts/ci/preflight-secrets.sh"
Task: "Implement feature-to-staging PR body generation in scripts/ci/feature-pr-body.sh"
Task: "Implement staging-to-main promotion PR body generation in scripts/ci/promotion-pr-body.sh"
```

## Parallel Example: Documentation With Workflow Work

```bash
Task: "Create the CI/CD operations runbook entry point in docs/backend/ops/cicd.mdx"
Task: "Create CI workflow skeleton with triggers, permissions, concurrency, and job ordering in .github/workflows/ci.yml"
Task: "Create staging deploy workflow skeleton with triggers, permissions, concurrency, environment, and branch guard in .github/workflows/deploy-staging.yml"
```

---

## Implementation Strategy

### MVP First (P1 Scope)

1. Complete Phase 1 and Phase 2.
2. Complete US1 so every PR into `staging` has reliable CI and `ci-status`.
3. Complete US2 so green `staging` deploys automatically with probes.
4. Complete US4 so `main` has a protected production deploy path.
5. Stop and validate P1 end-to-end before adding convenience automation.

### Incremental Delivery

1. Add US1A to reduce feature-branch PR friction.
2. Add US3 so every healthy staging deploy produces a promotion PR.
3. Add US5 so unprovisioned production fails closed with clear guidance.
4. Add US7 so setup, rollback, and troubleshooting are reproducible from docs.
5. Add US6 once the automatic deployment paths are stable.

### Validation Notes

- Keep shell logic in `scripts/ci/` when workflow steps exceed about 10 lines.
- Keep workflow-level permissions at `contents: read`; escalate only per job.
- Do not echo Render hook URLs or secret values in scripts, workflow logs, or docs examples.
- Keep application runtime code under `apps/api/src/` and `apps/web/src/` untouched for this feature.
