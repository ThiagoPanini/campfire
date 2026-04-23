# Phase 0 — Research

**Feature**: CI/CD Pipelines & Reproducible Local Environment
**Date**: 2026-04-23

This document resolves every open technical choice for the plan. Each decision states
what was chosen, why, and what was considered and rejected.

---

## 1. Local AWS plane: LocalStack vs. status quo

**Decision**: Adopt **LocalStack Community** as the single local AWS plane, replacing `amazon/dynamodb-local` in `docker-compose.backend.yml`. Pin the image by digest (e.g. `localstack/localstack@sha256:...`). Persist state via the `LOCALSTACK_VOLUME_DIR` mount. Services enabled at launch: `dynamodb`, `sts`, `ssm`, `secretsmanager`, `s3`, `logs`. Lambda + API Gateway are gated behind a follow-up ADR once the backend's packaging story is settled.

**Rationale**:
- The backend already targets AWS (Lambda + DynamoDB + Cognito-shaped tokens + SSM), per `infra/terraform/modules/`. Emulating only DynamoDB forces every other AWS-shaped integration to be mocked in code, which is exactly the kind of drift between test and prod that integration tests exist to prevent.
- LocalStack exposes a single AWS endpoint (`http://localhost:4566`) so every `boto3` client just needs `endpoint_url`, matching what the code already does for DynamoDB.
- Community edition covers every service this feature needs initially. Upgrading to Pro later (for Cognito, EventBridge Scheduler, etc.) is a contained decision, not a re-architecture.
- One container to start, one container to stop, one log stream to read — simpler than a growing set of per-service containers.

**Alternatives considered**:
- *Keep `amazon/dynamodb-local` + `moto-server` for the rest*: two containers, two health-check mechanisms, two sets of env vars. Rejected — more surface area, same expressive power.
- *Pure `moto` in-process (library mode)*: loses process-level parity with prod, can't be shared between the dev server and the test runner, and doesn't persist across restarts. Kept as a secondary option for pure unit tests.
- *Real AWS sandbox account for integration tests*: violates FR-004 (no cloud creds needed for local), adds cost, adds rate limits, and couples CI to a shared cloud resource. Rejected.

**Follow-up**: ADR-0002 documents this choice and the upgrade path to Pro.

---

## 2. Command contract: Makefile vs. task runner vs. scripts-only

**Decision**: **One root `Makefile`** as the single command surface. GitHub Actions jobs invoke `make <target>`. Shell logic that exceeds ~5 lines lives in `scripts/local/*.sh` and is invoked by the Makefile.

**Rationale**:
- Already ubiquitous on every dev and CI environment the project targets — no new tool for contributors to install.
- `make` gives phony targets, dependency ordering, and a discoverable top-level help without any framework.
- Keeps shell logic out of YAML, which is the single biggest source of CI drift from local.
- The constitution's AI-Assisted Development Governance rule — "AI-generated work MUST be reviewable the same way human work is" — is easier to enforce when a single file lists every command the project runs.

**Alternatives considered**:
- *`just`*: nicer ergonomics but introduces a new prerequisite. Not worth the friction for a solo-maintainer project.
- *`npm run` at the root*: works for the frontend but awkward for Python/Terraform tasks and pulls Node into contexts that shouldn't need it.
- *Scripts only, no Makefile*: loses the discoverable top-level index and the `make help` convention.

**Follow-up**: ADR-0004 records this choice and the rule that CI MUST NOT inline commands that aren't also in the Makefile.

---

## 3. CI platform: GitHub Actions

**Decision**: **GitHub Actions** on GitHub-hosted `ubuntu-24.04` runners, with self-hosted runners explicitly out of scope for this feature.

**Rationale**:
- The repository is already on GitHub; two workflows already exist.
- Native OIDC-to-AWS federation removes the hardest credential-management problem.
- GitHub Environments provide per-environment secrets, required reviewers, and wait timers at no extra cost.
- Merge queues are native, which matters for deterministic CI on a busy `main`.

**Alternatives considered**:
- *CircleCI / Buildkite / self-hosted*: more flexibility, more operational overhead for a solo maintainer — violates constitution ("a solo builder cannot absorb operational chaos").

---

## 4. AWS auth from CI: OIDC federation

**Decision**: **GitHub OIDC → AWS IAM role**, one role per environment (`github-actions-dev`, `github-actions-prod`). No long-lived access keys in GitHub secrets. Trust policy pins `repo:<owner>/campfire:*` with environment-scoped `job_workflow_ref` conditions.

**Rationale**:
- SC-004 mandates zero long-lived cloud credentials.
- Short-lived STS tokens reduce blast radius of any runner compromise.
- Constitution Principle X requires least privilege; per-env roles make that reviewable.

**Alternatives considered**:
- *IAM user + access keys stored as secrets*: explicitly forbidden by SC-004.
- *AWS SSO device flow in CI*: not a CI pattern; requires interactive auth.

**Follow-up**: ADR-0003 records this choice and captures the Terraform for the OIDC provider and the two roles.

---

## 5. Artifact storage & versioning

**Decision**:
- **Infrastructure/Lambda bundles**: versioned S3 bucket `campfire-artifacts-<account>-<region>`, KMS-CMK encrypted, with object-lock in governance mode on the `prod/` prefix for 90 days.
- **Container images** (if/when introduced): ECR with immutable tags and image-scan-on-push.
- **Versioning scheme**: `<yyyy>.<mm>.<dd>-<short-sha>` for every build, plus a floating `latest-<env>` tag in a separate key for environment promotion.
- **Retention**: keep all artifacts indefinitely until a dedicated lifecycle policy is introduced; a rollback is never blocked by a missing artifact.

**Rationale**:
- Traceability from artifact → commit → deployment record.
- Immutable references mean "rollback" is "redeploy the prior key" — no rebuild.
- Object-lock protects against accidental or malicious deletion of a production artifact still in use.

**Alternatives considered**:
- *GitHub Actions artifacts as the deploy artifact source*: 90-day retention cap and no KMS control — not suitable for production rollbacks.
- *SemVer tags*: overhead for a continuous-deployment product; the date+sha scheme already gives total ordering and commit traceability.

---

## 6. Deployment mechanism

**Decision**: **Terraform apply** from the CI runner, against a plan produced in a preceding job. The plan is uploaded as an encrypted artifact and the apply job consumes it verbatim — no re-planning between approval and apply.

**Rationale**:
- Constitution Principle X requires Terraform as source of truth; reusing it for application-layer deploys keeps the story simple.
- Plan/apply separation makes the prod approval gate review the exact change about to land, not a later re-planned superset.

**Alternatives considered**:
- *GitOps via Argo / Flux*: overkill for a Lambda + S3 + DynamoDB shape; no Kubernetes in the picture.
- *Custom bash deploy scripts*: violates Principle X.

---

## 7. Rollback strategy

**Decision**: Rollback is **re-deployment of the previous known-good artifact** via the same `reusable-deploy.yml` workflow, parameterized by `artifact_key`. The `deployments/records/<env>/` ledger stores the previous `artifact_key` in every record, so the rollback target is retrievable from the latest N-1 record. Schema/data-layer rollbacks are explicitly out of scope of "one-button" — those require an ADR and a dedicated migration plan per deploy (edge case called out in spec).

**Rationale**: Simple, artifact-driven, works identically across environments, auditable via the same ledger.

**Alternatives considered**:
- *Blue/green at the infrastructure level*: valuable, but a second initiative — not required for SC-008 and adds cost.

---

## 8. Path-filtered CI

**Decision**: **`dorny/paths-filter@v3` pinned by SHA** in the top-level `pr.yml`, producing boolean outputs consumed by conditional calls to each `reusable-*.yml`. A cross-cutting `always-run` job runs `gitleaks`, `actionlint`, and `zizmor` on every PR regardless of path.

**Rationale**: Minimal, reviewable, and keeps the "what runs when" logic in one place.

**Alternatives considered**:
- *Separate workflow per path*: duplicates trigger boilerplate; harder to enforce cross-cutting checks.
- *Hand-rolled `git diff` step*: reinvents a well-tested action; harder to maintain.

---

## 9. Caching

**Decision**: Cache keyed on lockfiles:
- Python: `setup-python` cache + `uv` cache keyed on `apps/api/uv.lock`.
- Node: `setup-node` cache + `npm ci` keyed on `package-lock.json` and `apps/web/package-lock.json`.
- Terraform: `.terraform` cache keyed on `infra/terraform/**/.terraform.lock.hcl`.
- LocalStack: Docker layer cache for the pinned image digest.

**Rationale**: Predictable, invalidation-safe, lockfile-driven.

**Alternatives considered**:
- *Cache by branch name*: cross-branch pollution, non-deterministic.

---

## 10. Security scanning cadence

**Decision**:
- Every PR: `gitleaks` (secrets), `actionlint` + `zizmor` (workflow), `trivy fs` (FS vuln), `checkov` (Terraform).
- Nightly scheduled workflow: `trivy image` on any published container, `pip-audit`, `npm audit --omit=dev`, SBOM generation.
- Release: SBOM attached to the artifact; `cosign` attestation using GitHub's OIDC identity.

**Rationale**: Balances PR latency (fast scans inline) with depth (longer scans scheduled), and produces auditable provenance for production artifacts.

**Alternatives considered**:
- *All scans on every PR*: blows the PR time budget (SC-003).
- *No nightly scan*: first-seen-in-the-wild vulnerabilities wouldn't surface until the next PR to that path.

---

## 11. Flaky-test handling

**Decision**: **No automatic retries**. Intermittent failures are surfaced via a `pytest` plugin (`pytest-rerunfailures` configured in **report-only** mode) that marks but does not hide flakes. Known flakes are tagged `@pytest.mark.flaky(reason="...", issue="#N")` and a scheduled job reports on them weekly.

**Rationale**: FR-014 explicitly forbids silent retries. Making flakes visible is how they get fixed.

**Alternatives considered**:
- *Retry-on-failure with `--reruns 2`*: hides flakes, produces noise in "green" CI, violates FR-014.

---

## 12. Debugger attach workflow

**Decision**: `make debug` starts the backend under `debugpy --listen 0.0.0.0:5678 --wait-for-client`. Documented VS Code and PyCharm `launch.json`/`Run configurations` snippets in `docs/guides/local-development.mdx`.

**Rationale**: `debugpy` is already a transitive `pytest` dev dep in Python's standard debugger stack; no new prerequisites.

---

## 13. Merge queue & required status checks

**Decision**: **Enable GitHub merge queue** on `main`. Required checks: the top-level `pr / summary` job that aggregates the reusable workflows' results. Individual reusable jobs are *not* directly required — only the summary — so removing a gate from scope doesn't require a branch-protection edit.

**Rationale**: Decoupling branch protection from the specific job names lets the pipeline evolve without an admin change; the summary job remains the contract.

**Alternatives considered**:
- *List each job as a required check*: brittle; every rename triggers a branch-protection update.

---

## 14. Docs build in CI

**Decision**: A `reusable-docs.yml` job runs `mintlify broken-links` + `mintlify build` (or the repo's currently wired equivalent) on every PR that touches `docs/`, and is a required check via the summary job.

**Rationale**: Constitution Principle XI mandates a buildable docs surface on every PR.

---

## Summary of resolved unknowns

| Topic | Decision |
|---|---|
| Local AWS plane | LocalStack Community, pinned by digest |
| Command surface | Root `Makefile` |
| CI platform | GitHub Actions, ubuntu-24.04 runners |
| AWS auth | OIDC → scoped IAM role per env |
| Artifact storage | Versioned KMS-encrypted S3 + ECR |
| Versioning | `YYYY.MM.DD-<shortsha>` |
| Deploy mechanism | Terraform plan/apply split with approval between |
| Rollback | Re-deploy prior artifact by key |
| Path filtering | `dorny/paths-filter` + summary job |
| Caching | Lockfile-keyed per language |
| Security scans | Inline on PR, depth on nightly |
| Flaky tests | Report-only, never silent retry |
| Debugger | `debugpy` via `make debug` |
| Required checks | Summary job only |
| Docs | Mintlify build gated on PR |

No `NEEDS CLARIFICATION` items remain.
