# Contract: `Makefile` targets

The root `Makefile` is the single command surface shared between developers and CI.
Every CI job invokes one of these targets; no CI job may inline a command that isn't
reachable via a `make` target.

Targets are grouped by lifecycle. All are `.PHONY` unless stated.

## Local environment

| Target | Contract |
|---|---|
| `make help` | Print a categorized list of public targets and one-line descriptions. |
| `make doctor` | Check prerequisites (docker, docker compose, python>=3.12, uv, node>=20) and port availability. Exits non-zero with a remediation message on failure. |
| `make up` | Start LocalStack via `docker-compose.backend.yml`, wait for health, seed local data. Idempotent. |
| `make down` | Stop containers and remove volumes for this project only. Does not touch unrelated docker state. |
| `make reset` | `make down && make up` with a clean volume. |
| `make seed` | Apply seed data (tables, secrets, SSM params) against the running LocalStack. |
| `make run` | Start the backend API process against the local stack in the foreground. |
| `make token` | Issue a local JWT for manual backend testing. |
| `make debug` | Start the backend under `debugpy --listen 0.0.0.0:5678`, waiting for a client. |
| `make logs` | Tail LocalStack + API logs with structured formatting. |

## Quality gates (used by both local and CI)

| Target | Contract |
|---|---|
| `make lint` | Runs `lint/backend`, `lint/frontend`, `lint/infra`, `lint/workflows`. |
| `make lint/backend` | `ruff check apps/api && ruff format --check apps/api`. |
| `make lint/frontend` | `npm --workspace apps/web run lint`. |
| `make lint/infra` | `terraform fmt -check -recursive infra/terraform && tflint --recursive`. |
| `make lint/workflows` | `actionlint` on `.github/workflows/**`. |
| `make type` | Runs `type/backend` and `type/frontend`. |
| `make type/backend` | `mypy apps/api/src`. |
| `make type/frontend` | `npm --workspace apps/web run typecheck` (`tsc --noEmit`). |
| `make test` | Runs `test/backend/unit`, `test/backend/integration`, `test/backend/contract`, `test/frontend/unit`. |
| `make test/backend/unit` | `pytest apps/api -m 'not integration and not contract'`. |
| `make test/backend/integration` | Requires `make up`; runs `pytest apps/api -m integration`. |
| `make test/backend/contract` | Requires `make up`; runs `pytest apps/api -m contract`. |
| `make test/frontend/unit` | `npm --workspace apps/web run test`. |
| `make test/e2e` | `make up` + `npm --workspace apps/web run test:e2e` (Playwright). |
| `make validate/infra` | `terraform validate` in each environment + `checkov -d infra/terraform`. |
| `make security` | `gitleaks detect`, `trivy fs .`, `pip-audit`, `npm audit --omit=dev`, `zizmor .github/workflows`. |
| `make docs` | `mintlify broken-links && mintlify build` (or whatever the repo's docs toolchain currently wires). |
| `make ci` | Aggregate local "run everything CI would run" target. Produces the same verdict as the PR summary job (SC-002). |

## Build & release

| Target | Contract |
|---|---|
| `make build/api` | Produce an immutable `api-lambda-<version>.zip` in `./dist/`, with SBOM and provenance alongside. |
| `make build/web` | Produce an immutable `web-static-<version>.tar.gz` in `./dist/`. |
| `make package` | All build targets. |
| `make plan ENV=<env>` | Produce a Terraform plan for the given environment, capturing it as `./dist/<env>.tfplan`. |
| `make apply ENV=<env> PLAN=<path>` | Apply the given plan (no re-planning). Refuses to run if `PLAN` is missing or stale. |
| `make smoke ENV=<env>` | Run post-deploy smoke checks against the deployed environment. |
| `make rollback ENV=<env> TO=<artifact_key>` | Re-deploy a prior artifact by key. |

## Operational

| Target | Contract |
|---|---|
| `make clean` | Remove local build artifacts (`./dist/`, caches). Never touches source or `deployments/`. |
| `make record-deployment ENV=<env> ARTIFACT=<key> OUTCOME=<outcome>` | Append a deployment record (used by `reusable-deploy.yml`). |

## Contract rules

1. **Local == CI**: For every gate listed in the PR summary job, a developer MUST be able to run the same thing via one `make <target>` invocation.
2. **Idempotency**: `up`, `seed`, `down`, `reset` are all idempotent.
3. **No hidden state**: Target behavior depends only on the repository, `./dist/`, and the running LocalStack container — nothing in `~/.cache` or the developer's shell env beyond what `make doctor` accepts.
4. **Exit codes**: Every target exits 0 on success, non-zero on failure, with a one-line actionable error message.
5. **No network at import**: `make help` and `make doctor` MUST NOT require network access.
