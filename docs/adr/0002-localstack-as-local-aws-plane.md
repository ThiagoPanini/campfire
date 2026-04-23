# ADR 0002: LocalStack as the Local AWS Plane

## Context

Campfire’s backend depends on multiple AWS-shaped services, while the pre-existing local flow only covered DynamoDB. That created drift between local validation and the shape of production integrations.

## Decision

Campfire uses LocalStack as the single local AWS plane for developer workflows and CI integration tests. The image is pinned by digest, reached through one endpoint at `http://localhost:4566`, and seeded through `make seed`.

## Consequences

- Local and CI integration flows share the same service definition.
- Debugging stays simple because the API still runs as a normal Python process.
- Service additions become explicit repository changes instead of ad-hoc local setup steps.

## References

- [Research §1](../../specs/002-cicd-local-env/research.md)
- [Local environment guide](/guides/platform/local-environment)
- [LocalStack services](/guides/platform/localstack-services)
