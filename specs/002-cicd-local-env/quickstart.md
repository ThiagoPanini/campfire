# Quickstart — Local Backend & CI Contract

**Audience**: A new contributor on a clean checkout.
**Goal**: From `git clone` to "backend running + tests green + ready to debug" in under 15 minutes (SC-001).

## 1. Install prerequisites

| Tool | Minimum version | Why |
|---|---|---|
| Docker + Docker Compose v2 | latest stable | Runs LocalStack. |
| Python | 3.12 | Matches the backend's `requires-python`. |
| `uv` | latest | Python dependency & venv manager. |
| Node.js | 20 LTS | Frontend + Playwright. |
| GNU Make | 4.x | Command surface. |
| AWS CLI (optional, for `awslocal` use) | 2.x | Inspecting LocalStack. |

Run the one-command preflight check:

```bash
make doctor
```

It reports any missing tool with a link to install.

## 2. Start the local backend

```bash
make up              # starts LocalStack + seeds DynamoDB table, secrets, SSM params
make run             # starts the API process; reachable on http://127.0.0.1:8010
```

On first run, `make up` pulls the pinned LocalStack image (~1 min) and creates the
seed data. Subsequent runs are idempotent and near-instant.

## 3. Run the test suite

```bash
make test            # unit + integration + contract + frontend unit
```

Integration tests exercise the backend against LocalStack — the same AWS services
the CI integration job uses.

## 4. Debug a failing test or endpoint

```bash
make debug           # starts the API under debugpy on port 5678, waiting for a client
```

Attach VS Code (`Python: Remote Attach`, `host=localhost`, `port=5678`) or PyCharm.

Inspect LocalStack-side state:

```bash
aws --endpoint-url http://localhost:4566 dynamodb scan --table-name campfire-local-users
aws --endpoint-url http://localhost:4566 ssm get-parameters-by-path --path /campfire/local
```

## 5. Clean up

```bash
make down            # stops containers, removes volumes owned by this project
make clean           # removes ./dist and build caches
```

## 6. "What does CI run?"

Exactly what `make ci` runs. You can reproduce the full PR gate locally:

```bash
make ci              # lint + type + test + validate/infra + security + docs
```

If `make ci` is green locally, the PR gate is very likely to be green (SC-002).

## 7. Where things live

- Command surface: [Makefile](../../Makefile) (see [contracts/makefile-targets.md](contracts/makefile-targets.md)).
- Local stack definition: [docker-compose.backend.yml](../../docker-compose.backend.yml) + [contracts/localstack-services.md](contracts/localstack-services.md).
- CI workflows: [.github/workflows/](../../.github/workflows/).
- CI contract: [contracts/github-status-checks.md](contracts/github-status-checks.md).
- Deploy contract & audit: [contracts/oidc-iam-trust.md](contracts/oidc-iam-trust.md), [contracts/deployment-record.schema.json](contracts/deployment-record.schema.json), `deployments/records/`.
- Runbook for deploys and rollbacks: [docs/guides/deployment-runbook.mdx](../../docs/guides/deployment-runbook.mdx) (added during implementation).

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `make up` errors with port in use | Previous LocalStack or another tool on `:4566` | `make down` or `lsof -i :4566` |
| Integration tests fail instantly | LocalStack not ready | Re-run `make up` and wait for the `READY` banner |
| `make test` cannot import `moto` | Dev extras not installed | `uv sync --extra dev` in `apps/api` (happens automatically via `make up`) |
| `make ci` passes locally, CI fails | Lockfile drift | Commit updated `uv.lock` / `package-lock.json` |
| Debugger doesn't attach | Wrong port / stale container | `make down && make debug` and verify the banner shows `listening on 0.0.0.0:5678` |
| LocalStack disk full | Stale volume | `docker volume rm campfire_localstack-data` then `make up` |
