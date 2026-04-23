# Contract: LocalStack service set

LocalStack is the canonical local AWS plane. This contract enumerates the services
the project depends on locally, how they are configured, and how changes are
versioned.

## Configuration

- **Image**: `localstack/localstack:4@sha256:8a2a5b507ae0aae700e4f3ef8527cbbe8af8f14a19a003bd64ed8291a347e33c` — pinned by digest in `docker-compose.backend.yml`. Floating tags (`latest`, version tags) are forbidden.
- **Endpoint**: `http://localhost:4566` for every AWS service (LocalStack unified endpoint).
- **Region**: `us-east-1` locally (matches dev env).
- **Credentials**: Any non-empty string works; all helpers default to `campfire-local` (see `scripts/backend-local-env.sh`).
- **Volume**: Named docker volume `localstack-data` mounted at `/var/lib/localstack` for cross-restart persistence.

## Services (launch scope)

| Service | Used for | Seed | Health check |
|---|---|---|---|
| `dynamodb` | User table (`campfire-local-users`), future aggregates. | `make seed` creates tables from `apps/api/src/infrastructure/dynamodb/schema.py`. | `awslocal dynamodb list-tables` succeeds. |
| `sts` | Assume-role simulation for integration tests that exercise role-switching. | none | `awslocal sts get-caller-identity`. |
| `ssm` | Runtime config parameters consumed by the backend (feature flags, endpoint URLs). | `make seed` populates `/campfire/local/**` keys. | `awslocal ssm get-parameters-by-path --path /campfire/local`. |
| `secretsmanager` | JWT signing key material, third-party API keys. | `make seed` populates dev-only dummy secrets. | `awslocal secretsmanager list-secrets`. |
| `s3` | Artifact-staging prototype, future object storage. | `make seed` creates `campfire-local-artifacts` bucket. | `awslocal s3 ls`. |
| `logs` | CloudWatch Logs destination for Powertools structured logs. | none | `awslocal logs describe-log-groups`. |

## Explicitly deferred services

- `lambda`, `apigateway`, `cognito-idp`: require LocalStack Pro for full parity. The current backend uses a local Python process + a self-signed JWT issuer (`campfire-local-auth`) to stand in; this remains until a Pro ADR is written.
- `eventbridge`, `sqs`, `sns`: not yet used by the product domain; add to this contract when a feature introduces them.

## Change control

- Adding a service requires:
  1. An entry in this document.
  2. An entry in `Local Stack Definition` ([../data-model.md](../data-model.md)).
  3. Wiring in `docker-compose.backend.yml` (env var `SERVICES=...`).
  4. A seed step (or a justification for "no seed").
  5. An integration test that exercises it end-to-end.
- Removing a service requires an ADR and a deprecation notice on previously-using tests.

## CI parity

The GitHub Actions `reusable-backend.yml` workflow starts LocalStack using the same
`docker-compose.backend.yml` and waits for the same health probes. Any divergence is a
bug (FR-013).
