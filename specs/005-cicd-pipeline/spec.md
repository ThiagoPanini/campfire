# Feature Specification: Complete CI/CD Pipeline for Campfire

**Feature Branch**: `005-cicd-pipeline`
**Created**: 2026-04-29
**Status**: Draft
**Input**: User description: "Complete CI/CD Pipeline for Campfire — automate validation and Render deployments with a Spec-Kit-aligned branch strategy (feature → staging → main), separate staging/production environment controls, post-deployment health checks, and operational documentation."

## Clarifications

### Session 2026-04-29

- Q: What live database migration strategy should the CI/CD pipeline use for Render environments? → A: Manual/local migrations for staging free tier now; revisit staging PostgreSQL redeploy after 20 days.
- Q: What should happen to staging data during the 20-day free-tier PostgreSQL redeploy/recreation? → A: Recreate as disposable data, then migrate and seed required test data.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validated pull request into `staging` (Priority: P1)

As the solo maintainer (working with AI agents), when I open or update a
pull request from a Spec-Kit feature branch (e.g. `005-cicd-pipeline`) into
the `staging` branch, the platform must run a complete validation pipeline
covering the frontend, the backend, the database migrations, the
documentation, and basic repository security. The pull request must be
blocked from merging if any required check fails, and the failure messages
must be precise enough for the maintainer to act without re-running the
job locally.

**Why this priority**: This is the foundation of every other guarantee in
the pipeline. Without trustworthy validation on `staging` PRs, automated
deployment is unsafe and the rest of the workflow cannot be enabled. It
also delivers value on its own — it stops bad changes from reaching
`staging` even before any deploy automation is wired up.

**Independent Test**: Open a draft PR from a feature branch into
`staging` containing a deliberate failure (e.g. a TypeScript type error or
a broken Alembic migration). Verify that (a) all required checks run, (b)
the failing check is clearly identified by name and log line, and (c) the
PR is not mergeable until the failure is fixed.

**Acceptance Scenarios**:

1. **Given** a feature branch following the `###-feature-name` pattern, **When** a pull request targeting `staging` is opened or updated, **Then** the CI pipeline runs the full validation suite and reports each job as a separate, named check.
2. **Given** any required validation job fails, **When** the maintainer attempts to merge the pull request, **Then** the merge is blocked by branch protection until the failing check turns green.
3. **Given** the pull request is opened from a branch that does **not** follow the `###-feature-name` pattern, **When** CI runs, **Then** the pipeline still validates the change but a warning is surfaced indicating the branch naming deviation.
4. **Given** a pull request that introduces a new Alembic migration, **When** CI runs, **Then** the pipeline applies migrations from a clean Postgres database up to head and fails loudly if upgrade does not succeed.

---

### User Story 1A - Automatic feature branch PR into `staging` (Priority: P2)

When a Spec-Kit feature branch is pushed to GitHub, the platform must
automatically create or update a pull request from that branch into
`staging`, provided the branch follows the `###-feature-name` convention
and has changes to review. The automation must be idempotent: repeated
pushes update the same PR metadata/body and never open duplicates; branches
that do not match the feature pattern, have no diff against `staging`, or
already have a valid open PR are ignored without failing unrelated CI.

**Why this priority**: This reduces maintainer friction in the intended
solo + AI workflow while keeping the human merge decision intact. It is
useful, but not more important than the CI/CD gates themselves.

**Independent Test**: Push a branch named `123-sample-feature` with a
small documentation-only change. Verify that a PR targeting `staging` is
opened automatically with the expected labels and body. Push another commit
to the same branch and verify the same PR is updated rather than duplicated.
Push a branch named `scratch-test` and verify no PR is opened.

**Acceptance Scenarios**:

1. **Given** a pushed branch that matches `###-feature-name` and is not `main` or `staging`, **When** the auto-PR workflow runs, **Then** it creates a pull request targeting `staging` if no open PR exists for that head/base pair.
2. **Given** an open PR already exists from the feature branch into `staging`, **When** the branch receives another push, **Then** the workflow refreshes PR metadata/body/labels in place and does not create a duplicate PR.
3. **Given** a pushed branch does not match the Spec-Kit feature branch pattern, **When** the workflow runs, **Then** it exits successfully without opening a PR.
4. **Given** the feature branch has no diff against `staging`, **When** the workflow runs, **Then** it exits successfully without opening a PR.

---

### User Story 2 - Automatic staging deployment on merge into `staging` (Priority: P1)

When a pull request is merged into `staging`, the platform must
automatically deploy the merged commit to the Render staging environment
(backend API + frontend web), without any manual step. After the deploy
hooks complete, the workflow must validate that the staging API responds
on `/healthz` and `/readyz` and that the staging frontend URL responds
successfully. If any deploy hook or post-deploy probe fails, the workflow
must fail loudly and identify which service/environment broke.

**Why this priority**: This is the value proposition of "CD". Without it,
every merge requires manual Render intervention, which defeats the purpose
of the pipeline and is error-prone for a solo maintainer.

**Independent Test**: Merge a trivial change into `staging`. Verify that
(a) the deploy workflow triggers automatically, (b) Render staging
services receive the deploy, (c) `/healthz`, `/readyz`, and the public
frontend URL are probed and reported, and (d) the workflow run page shows
which environment was deployed and which commit.

**Acceptance Scenarios**:

1. **Given** a successful CI run on `staging`, **When** the commit lands on the `staging` branch tip, **Then** the staging CD workflow triggers exactly once for that commit.
2. **Given** Render returns a non-success response from a deploy hook, **When** the staging CD workflow runs, **Then** the workflow fails and the failing service name and environment are visible in the job summary.
3. **Given** the staging deploy hooks succeed, **When** post-deploy validation runs, **Then** the workflow probes `/healthz`, `/readyz`, and the frontend public URL with bounded retries and fails the run if any probe does not return success within the timeout.
4. **Given** two merges land on `staging` in quick succession, **When** the CD workflow runs, **Then** concurrency control ensures only one deploy executes at a time per environment, and the older run is cancelled or queued in a defined way.

---

### User Story 3 - Automatic `staging → main` promotion PR (Priority: P2)

After a staging deployment succeeds, the platform must automatically
create a pull request from `staging` into `main` (or update the existing
one if it is already open) so that promotion to production is always one
human review away. The PR description must summarize the commits being
promoted and include a checklist of production-readiness items
(post-deploy probes green on staging, migrations applied, secrets
present).

**Why this priority**: This guarantees that `main` is never silently out
of date relative to `staging`. It removes the cognitive load of
remembering to open the promotion PR and gives the maintainer a single
place to gate production releases.

**Independent Test**: Trigger a successful staging deployment. Verify
that a pull request from `staging` into `main` exists with an up-to-date
title, description, and commit list. Trigger a second successful staging
deploy and verify the same PR is updated, not duplicated.

**Acceptance Scenarios**:

1. **Given** a staging deployment succeeds with all post-deploy probes green, **When** the workflow finishes, **Then** a pull request from `staging` into `main` is created if none is open, or updated in place if one is already open.
2. **Given** the staging deployment fails or has red probes, **When** the workflow finishes, **Then** no `staging → main` promotion PR is created or updated.
3. **Given** the promotion PR already exists, **When** the workflow runs again, **Then** the PR description is refreshed with the new commit list and the run never opens a duplicate PR.

---

### User Story 4 - Gated production deployment on merge into `main` (Priority: P1)

When a pull request from `staging` into `main` is approved by a human
reviewer and merged, the platform must deploy the merged commit to the
Render production environment using **production-only** secrets and
variables, behind a GitHub Environment that enforces protection rules
(required reviewers and/or wait timer when applicable). After the deploy,
the workflow must run the same post-deploy probes against the production
endpoints. Production deployments must be impossible from any branch
other than `main`.

**Why this priority**: Production blast radius is much larger than
staging. Without this gate, a misconfigured workflow could ship untested
code to real users; without separated secrets, a leaked staging secret
would also leak production.

**Independent Test**: From a non-`main` branch, attempt to trigger the
production CD workflow (via push, PR, or `workflow_dispatch`). Verify the
attempt is rejected. Then merge an approved PR into `main` and verify the
production deploy runs only after the GitHub Environment gate is
satisfied, using production secrets distinct from staging secrets, and
that probes run against production URLs.

**Acceptance Scenarios**:

1. **Given** a `staging → main` pull request is approved and merged, **When** the production CD workflow runs, **Then** it requests approval through the protected GitHub Environment before any deploy hook is called.
2. **Given** the production environment is approved, **When** deploy hooks are called, **Then** they use production-scoped secrets only and the workflow logs do not expose secret values.
3. **Given** a push or `workflow_dispatch` originates from any branch other than `main`, **When** it would target the production environment, **Then** the workflow refuses to run and surfaces a clear "production deploys are only allowed from main" message.
4. **Given** production deploy succeeds, **When** post-deploy validation runs, **Then** it probes the production `/healthz`, `/readyz`, and frontend URL and fails the run if any probe is unhealthy.

---

### User Story 5 - Controlled behaviour when production is not yet provisioned (Priority: P2)

Production services and secrets do not exist yet at the time this feature
is built. The production workflow must therefore fail in a clear,
controlled, non-secret-leaking way until the maintainer provisions the
production Render services and configures the production secrets. The
workflow must never partially deploy to a non-existent environment and
must never expose absent or placeholder secret values.

**Why this priority**: This protects against accidentally deploying when
production is half-configured, and gives the maintainer a clear "what's
missing" message instead of an opaque hook error.

**Independent Test**: Without setting any production secrets, merge a PR
into `main`. Verify the production workflow runs, stops at a
configuration check step, and fails with a human-readable list of
missing secrets/services. Confirm no secret values are echoed and no
deploy hook is called.

**Acceptance Scenarios**:

1. **Given** one or more required production secrets are missing, **When** the production CD workflow runs, **Then** it fails at a pre-flight configuration check before calling any deploy hook and lists the missing secret names (not values).
2. **Given** the production environment configuration is incomplete, **When** the workflow fails the pre-flight check, **Then** the failure message states what is missing and which document explains how to provide it.

---

### User Story 6 - Manual redeploy escape hatch (Priority: P3)

The maintainer must be able to redeploy a known-good commit to staging or
production manually via `workflow_dispatch` without re-merging a PR. The
manual path must enforce the same environment protections, the same
post-deploy probes, and the same concurrency rules as the automatic
flows.

**Why this priority**: Useful for redeploying after a transient Render
failure, retrying a probe, or rolling forward a hotfix without churn on
the branches. It is not on the critical path for normal day-to-day work.

**Independent Test**: From the GitHub Actions UI, dispatch the staging CD
workflow against the `staging` branch and confirm a redeploy + probes
run. Dispatch the production CD workflow against `main` and confirm the
GitHub Environment approval gate is enforced.

**Acceptance Scenarios**:

1. **Given** the maintainer dispatches the staging CD workflow on the `staging` branch, **When** the run starts, **Then** it deploys staging and runs the standard post-deploy probes.
2. **Given** the maintainer dispatches the production CD workflow on the `main` branch, **When** the run starts, **Then** it goes through the protected GitHub Environment before any deploy hook is invoked.
3. **Given** the maintainer dispatches a CD workflow on any other branch, **When** the run starts, **Then** the workflow refuses to deploy and exits with a clear message.

---

### User Story 7 - Operational documentation for first-time setup and rollback (Priority: P2)

A maintainer (human or AI agent) configuring the project from scratch
must be able to follow a single documentation entry point that explains:
(a) how to configure GitHub Secrets and GitHub Environments, (b) how to
configure Render services and deploy hooks for staging and production,
(c) how to configure branch protection on `staging` and `main`, (d) the
complete inventory of expected secrets and variables (per environment),
(e) the rollback procedure, and (f) common failure modes and how to
diagnose them.

**Why this priority**: A pipeline the maintainer cannot reproduce from
documentation is fragile. This is also the deliverable that makes the
production environment provisionable later by following a checklist.

**Independent Test**: Hand the documentation to a fresh contributor (or
agent) with no prior context and ask them to (a) enumerate every
required secret, (b) describe the rollback steps, and (c) identify which
checks must be required by branch protection. Success means they can do
all three without reading the workflow YAML.

**Acceptance Scenarios**:

1. **Given** a new contributor reads the operations documentation, **When** they configure GitHub Actions, secrets, environments, branch protection, and Render hooks, **Then** the staging pipeline runs successfully end-to-end without further guidance.
2. **Given** a deployment misbehaves in production, **When** the maintainer follows the documented rollback procedure, **Then** they can return production to the last known-good Render deploy without ad-hoc steps.
3. **Given** any required secret or variable is added, removed, or renamed, **When** the documentation is checked, **Then** the secrets inventory section reflects the change and remains the single source of truth.

---

### Edge Cases

- A pull request targets `main` directly from a feature branch (bypassing `staging`): branch protection on `main` must reject the merge unless the source branch is `staging`.
- A force-push to `staging` or `main`: branch protection must disallow force-pushes on both branches.
- A Render deploy hook returns success but the service does not actually become healthy: post-deploy probes must catch this and fail the run.
- A health probe transient flake: probes must use bounded retries with timeouts, but must not retry indefinitely.
- A migration is added but never applied to the running environment: post-deploy validation includes a check that the API readiness endpoint reports a healthy database state.
- The staging Render PostgreSQL database must be recreated or redeployed after the free-tier lifecycle window: the runbook must document the local maintenance procedure, the expected 20-day revisit, and the fact that staging data is disposable and restored only through migrations plus required seed/test data.
- The OpenAPI snapshot, if present, drifts from generated output: CI fails with a clear "snapshot out of date" message and a hint on how to regenerate.
- Two merges into `staging` happen within seconds of each other: concurrency control ensures only one deploy is in flight per environment.
- A required secret is rotated mid-run: the workflow either uses the value present at job start (per GitHub Actions semantics) or fails cleanly; it must not leak partial state.
- A repository contributor accidentally commits a real secret in a PR: the secrets-scan check fails the PR and prevents merge.
- The promotion PR (`staging → main`) is closed manually by the maintainer: the workflow detects the closed state on the next staging deploy and creates a fresh PR rather than reopening the closed one.

## Requirements *(mandatory)*

### Functional Requirements

#### Branch strategy and protection

- **FR-001**: The system MUST treat `main` as the production branch and `staging` as the integration branch, with all feature work landing first on `staging` via pull request from a `###-feature-name` branch.
- **FR-002**: Branch protection on `staging` MUST require all designated CI checks to pass before merge and MUST disallow force-pushes and direct pushes.
- **FR-003**: Branch protection on `main` MUST additionally require at least one human approval and MUST disallow force-pushes and direct pushes.
- **FR-004**: The system MUST prevent any deploy to production from a branch other than `main`, including via `workflow_dispatch`.
- **FR-005**: The system MUST automatically create or update a pull request from a pushed `###-feature-name` branch into `staging` when the branch has a diff against `staging` and no valid open PR already exists.
- **FR-006**: The feature-to-staging PR automation MUST be idempotent: repeated pushes to the same feature branch MUST update the existing PR metadata/body/labels and MUST NOT create duplicates.
- **FR-007**: The feature-to-staging PR automation MUST ignore `main`, `staging`, tags, deleted branches, branches without a diff against `staging`, and branches that do not match the `###-feature-name` pattern.
- **FR-008**: The feature-to-staging PR automation MUST use only repository-scoped GitHub credentials with the minimum required permissions (`contents: read`, `pull-requests: write`) and MUST NOT push commits, rewrite history, or modify application files.
- **FR-009**: CI MUST include a policy check for pull requests targeting `main` that fails unless the source branch is `staging`, because repository settings may not natively enforce source-branch restrictions across all GitHub plans.

#### CI pipeline (validation, runs on PRs into `staging` and on pushes to `staging`/`main`)

- **FR-010**: CI MUST install frontend dependencies using the committed lockfile (no resolver drift).
- **FR-011**: CI MUST run frontend type checking and a production frontend build, and MUST publish the build artifact when it is useful for downstream jobs or debugging.
- **FR-012**: CI MUST install backend dependencies via `uv` using the committed lockfile.
- **FR-013**: CI MUST run `ruff` (lint + format check) on the backend.
- **FR-014**: CI MUST run backend unit tests, contract tests, and integration tests against a real PostgreSQL service.
- **FR-015**: CI MUST validate that Alembic upgrades a clean PostgreSQL database to the current head without errors and that no pending revisions remain.
- **FR-016**: CI MUST run `mypy` if it is currently viable on the backend; if it is not yet viable, the pipeline MUST emit a clearly labelled non-blocking warning and link to a tracked follow-up to promote it to a required gate.
- **FR-017**: CI MUST validate the OpenAPI snapshot, if one exists in the repository, by failing on drift between the generated specification and the committed snapshot.
- **FR-018**: CI MUST run a basic secrets scan over the diff and MUST fail if a real secret pattern is detected.
- **FR-019**: CI MUST verify that all `.env.example` files remain present and contain no real secret values (only placeholder values).
- **FR-020**: CI MUST validate documentation changes with lightweight
  Mintlify-compatible checks: `docs/docs.json` MUST parse, referenced
  navigation files MUST exist, and broken-link validation MAY run only when it
  is stable and fast enough for CI.
- **FR-021**: CI MUST validate alignment with the project constitution by failing the run if the constitution file is missing or unreadable; deeper semantic checks MAY be deferred to a future iteration.
- **FR-022**: CI MUST report each validation as a distinct named check and MUST expose an aggregate `ci-status` check that can be used as the single branch-protection gate without hiding the failing job.

#### Staging CD pipeline

- **FR-030**: The staging CD workflow MUST trigger automatically only after the CI workflow for the `staging` branch tip has completed successfully, and MUST also be invokable via `workflow_dispatch` on the `staging` branch.
- **FR-031**: The staging CD workflow MUST NOT run if the corresponding CI run for that commit did not succeed.
- **FR-032**: The staging CD workflow MUST call the configured Render deploy hook(s) for the staging backend and the staging frontend.
- **FR-033**: The staging CD workflow MUST fail if any deploy hook returns a non-success response, and MUST identify which service/environment failed in the job summary.
- **FR-034**: After deploy hooks succeed, the staging CD workflow MUST probe the staging API `/healthz` and `/readyz` endpoints and the staging frontend public URL with bounded retries and a defined timeout, and MUST fail if any probe does not return success.
- **FR-035**: The staging CD workflow MUST use a concurrency group keyed on the staging environment so that only one staging deploy runs at a time.
- **FR-036**: After a successful staging deployment, the workflow MUST create or update a pull request from `staging` into `main`, with a description summarizing the commits being promoted and a production-readiness checklist.

#### Production CD pipeline

- **FR-040**: The production CD workflow MUST trigger automatically only after the CI workflow for the `main` branch tip has completed successfully, and MUST also be invokable via `workflow_dispatch` on the `main` branch.
- **FR-041**: The production CD workflow MUST run inside a GitHub Environment named for production, with protection rules (required reviewers and/or wait timer) that the maintainer configures per the documentation.
- **FR-042**: The production CD workflow MUST run a pre-flight configuration check before any deploy hook is called; if any required production secret is missing, the run MUST fail at this step, list the missing secret names (not values), and exit without contacting Render.
- **FR-043**: The production CD workflow MUST use production-scoped secrets and variables, distinct from staging, and MUST NOT echo or print secret values in logs.
- **FR-044**: The production CD workflow MUST call the production Render deploy hook(s) only after the GitHub Environment approval (when configured) is granted and the pre-flight check passes.
- **FR-045**: After production deploys, the workflow MUST probe production `/healthz`, `/readyz`, and the production frontend public URL with bounded retries, and MUST fail if any probe is unhealthy.
- **FR-046**: The production CD workflow MUST use a concurrency group keyed on the production environment so that only one production deploy runs at a time.
- **FR-047**: Until production services are provisioned and production
  secrets configured, the production workflow MUST fail closed according to
  FR-042 and FR-043: no partial deploy, no Render contact before pre-flight
  passes, and no secret exposure.

#### Operational documentation and observability

- **FR-050**: The repository MUST include operational documentation, reachable from a single entry point, that covers: GitHub Secrets configuration per environment, GitHub Environments and protection rules, branch protection rules for `staging` and `main`, Render service and deploy hook configuration, Render service environment variables, the migration execution strategy per environment, the complete inventory of expected secrets and variables (per environment, marked staging-ready vs production-pending), the rollback procedure, and a troubleshooting guide.
- **FR-050A**: While staging Render services use the free tier without pre-deploy commands, live staging database migrations MUST be performed manually from the maintainer's local machine and documented as an explicit runbook path; the documentation MUST also flag the staging PostgreSQL redeploy/recreation revisit expected after 20 days.
- **FR-050B**: The staging PostgreSQL redeploy/recreation runbook MUST treat staging data as disposable: after recreation, the maintainer MUST run migrations and seed only required test data, with no requirement to back up or restore prior staging records.
- **FR-051**: The documentation MUST list 100% of secrets and variables consumed by the workflows and by the Render services, grouped by environment, with the exact name as referenced in workflows or Render service configuration.
- **FR-052**: The rollback procedure MUST describe how to roll back a Render deploy to the previous known-good revision for each environment without ad-hoc steps.
- **FR-053**: All workflow failure messages MUST be specific enough that the maintainer can identify the failing area (CI job, deploy hook, probe, missing secret) without reading workflow source.

#### Constitution alignment

- **FR-060**: The pipeline MUST respect the project constitution: narrow MVP scope, incremental delivery, boring/proven stack (Render + Postgres), proportional rigor (no Kubernetes, Terraform, AWS, Redis, queues, or heavy observability), and docs-as-code.
- **FR-061**: The pipeline MUST NOT introduce Docker images for application runtime if the Render native runtime suffices for the existing apps.

### Key Entities

- **CI Pipeline**: The set of validation jobs run on pull requests into `staging` and on pushes to `staging`/`main`. Inputs: the commit under test. Outputs: pass/fail per job, build artifacts where useful.
- **Feature PR Automation**: The workflow that observes pushes to `###-feature-name` branches and creates, updates, or intentionally ignores a pull request into `staging`.
- **Staging CD Pipeline**: The deployment workflow that runs on the `staging` branch tip after CI succeeds, calls Render staging deploy hooks, runs post-deploy probes, and opens/updates the promotion PR.
- **Production CD Pipeline**: The deployment workflow that runs on the `main` branch tip after a promotion merge, gated by the production GitHub Environment, using production secrets and post-deploy probes.
- **GitHub Environment**: A logical grouping of secrets, variables, and protection rules in GitHub Actions; one per deployment target (`staging`, `production`). Production has stricter protection (required reviewers, optional wait timer).
- **Render Service / Deploy Hook**: A Render-managed service (backend or frontend) and the URL that triggers a deploy of that service. There are two services per environment (API + Web), so up to four hooks total once production is provisioned.
- **Branch Promotion**: The flow `feature → staging → main`. Promotion from staging to main is mediated by the auto-managed promotion PR and human approval.
- **Release Candidate**: The commit at the tip of `staging` after a successful staging deploy and green probes. It is the candidate that the promotion PR offers for production.
- **Post-Deployment Validation**: The set of probes (`/healthz`, `/readyz`, frontend URL reachable) executed after deploy hooks complete, with bounded retries and timeouts.
- **Rollback Procedure**: The documented steps to revert a Render deploy in a given environment to the previous known-good revision.
- **Secrets Inventory**: The single, authoritative list (in operational documentation) of every secret and variable consumed by the workflows, with name, scope (staging or production), and purpose.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of pull requests targeting `staging` run the full required validation suite, and 0% can merge with any required check red.
- **SC-001A**: 100% of pushed branches matching `###-feature-name` with a diff against `staging` result in exactly one open or updated pull request into `staging`; 0 duplicate pull requests are created for repeated pushes to the same branch.
- **SC-002**: 100% of merges into `staging` trigger a staging deployment automatically; 0% require manual intervention to start the deploy.
- **SC-003**: 100% of successful staging deployments result in a `staging → main` pull request that is created or updated; 0% of failed staging deployments do so.
- **SC-004**: 100% of merges into `main` trigger a production deployment that is gated by the GitHub Environment protection; 0% bypass it.
- **SC-005**: 0% of production deployments originate from any branch other than `main`.
- **SC-006**: When any required production secret is missing, 100% of production workflow runs fail at the pre-flight step before any deploy hook is contacted, and 0% of secret values appear in logs.
- **SC-007**: 100% of staging and production deployments are followed by post-deploy probes against `/healthz`, `/readyz`, and the public frontend URL, and any unhealthy probe fails the run.
- **SC-008**: 100% of secrets and variables consumed by the workflows are listed in the operational documentation, with names matching the workflow references.
- **SC-009**: A maintainer (or AI agent) configuring the project from scratch can bring the staging pipeline to green by following only the operational documentation, without reading workflow source.
- **SC-011**: When Render returns an error from any deploy hook, 100% of resulting workflow runs fail and the failing service + environment are visible in the run summary.
- **SC-012**: 0% of workflow runs complete with a "successful" status while any deploy hook or probe was unhealthy (no false greens).
- **SC-013**: 0% of pull requests from a branch other than `staging` into `main` can pass the required CI policy gate.

## Assumptions

- The maintainer will own the one-time configuration of GitHub Secrets, GitHub Environments, branch protection rules, and Render deploy hooks; the workflows assume those exist or fail with a clear message when they do not.
- Automatic feature-to-staging PR creation is a convenience layer, not an approval bypass. The maintainer still reviews and merges into `staging`.
- Branch source restrictions for PRs into `main` are enforced by a required CI policy check even if GitHub repository settings cannot express the rule directly.
- Render's native runtime is sufficient for both `apps/web` and `apps/api`; the pipeline does not build or push container images for application runtime. CI MAY still use containers internally (e.g. a Postgres service container for tests) without changing this stance.
- The PostgreSQL service used in CI is ephemeral per run and does not need to be reused between runs.
- The promotion PR from `staging` to `main` is sufficient as a release record for an MVP; a dedicated changelog or release-notes generator is out of scope for this feature.
- Documentation validation refers to lightweight checks for the existing
  Mintlify documentation site under `docs/`; no new documentation tooling is
  introduced by this feature.
- The OpenAPI snapshot check is included if a snapshot file already exists in the repository; if it does not, that specific job is a no-op until a snapshot is added (no separate feature is required to introduce one here).
- The constitution-alignment check in CI is intentionally minimal in this iteration (presence/readability of the constitution file). Deeper semantic alignment checks are deferred and noted as a follow-up.
- `mypy` is treated as a controlled warning rather than a blocking gate in the first iteration if the codebase is not yet clean under it; the follow-up to make it blocking is tracked but out of scope for this feature.
- "Basic security" in CI means a diff-based secrets scan and `.env.example` integrity, not full SAST/DAST tooling, in keeping with proportional rigor.
- Production services on Render do not exist at the time of this feature's implementation. The production workflow will be authored and committed but expected to fail closed until the maintainer provisions services and configures secrets; depending on GitHub Environment protection semantics, manual approval may be requested before the pre-flight failure can surface.
- CI validation of Alembic against an ephemeral database does not by itself apply migrations to live Render databases. Staging live migrations are intentionally manual/local while Render free-tier staging lacks pre-deploy commands, and the runbook must not claim full automatic live schema migration until that path is automated or explicitly changed.
- The staging Render PostgreSQL database may need to be recreated or redeployed after the current free-tier lifecycle window; the operational documentation must record the expected 20-day revisit and the local commands/procedure the maintainer uses. Staging data is disposable for this process, so the documented recovery path is migrations plus required seed/test data rather than backup and restore.
- Rollback is performed using Render's built-in rollback to a previous deploy; the workflow does not implement a custom rollback mechanism.
- Concurrency policy on duplicate deploys is to keep one in-flight deploy per environment and cancel or queue subsequent runs; the precise choice (cancel vs queue) is a workflow-implementation detail to be decided in the plan phase, not in this specification.
