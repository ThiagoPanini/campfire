# Implementation Plan: Auth Bootstrap

**Branch**: `001-auth-bootstrap` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-bootstrap/spec.md`

**Note**: This plan covers the first deployable AWS environment for Campfire's secure foundation and stops before task generation.

## Summary

Deliver the minimum secure vertical slice as a static web application hosted behind CloudFront on the Campfire domain, authenticated through a managed Cognito Hosted UI flow, backed by a small AWS-native API built on API Gateway HTTP API and Lambda, with a DynamoDB table for the minimum local Campfire user record.

The implementation favors managed AWS services, keeps identity verification in platform infrastructure rather than domain logic, and preserves a modular-monolith application boundary: frontend handles navigation and session-aware UX, the backend handles user bootstrap and user-context retrieval, and Terraform owns all long-lived cloud resources and deployment wiring.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Python 3.12 (backend), Terraform 1.8+  
**Primary Dependencies**: React, React Router, TanStack Query, `oidc-client-ts`, Python standard library + AWS Lambda Powertools, boto3, pytest, Vitest, Playwright  
**Storage**: DynamoDB for the local user record; S3 for frontend asset hosting and Terraform remote state  
**Testing**: Vitest, React Testing Library, Playwright, pytest, contract tests, Terraform validate/plan in CI  
**Target Platform**: AWS public web application delivered through CloudFront with Lambda-backed API  
**Project Type**: Web application with separately deployed frontend, backend, and Terraform infrastructure  
**Performance Goals**: Public landing page and authenticated shell usable within 2 seconds on normal broadband after cached asset delivery; health and user-context responses typically under 500 ms in the first environment  
**Constraints**: Security-first defaults, no custom credential handling, no long-lived manual resources, one deployable environment first, no scope expansion beyond auth bootstrap  
**Scale/Scope**: Small early-stage workload, low concurrent usage, single team/maintainer, one protected shell, two backend endpoints, one persistence table

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Product mission alignment**: Pass. This slice is a prerequisite for future musical growth and group memory features without introducing vanity or social-network mechanics.
- **Contextualized identity rule**: Pass. No song-related domain modeling is introduced, so the non-negotiable song-context rule is not violated.
- **Private-first trust**: Pass. The authenticated area is private by default and exposes only the signed-in user's own bootstrap context.
- **Backend architectural discipline**: Pass. Identity verification is handled by platform infrastructure at the API boundary, while application/domain code focuses only on validated user context and local user bootstrap.
- **Frontend quality baseline**: Pass. The plan includes a public landing page, protected routes, authenticated shell, accessible sign-in flow, and clear loading/error states.
- **AWS-native Terraform rule**: Pass. All long-lived resources are Terraform-managed and use managed AWS services where possible.
- **Documentation and AI-governed workflow**: Pass. The plan produces research, data model, contracts, quickstart, and AGENTS context updates.
- **Operational baselines**: Pass. Logs, health checks, and diagnostic signals are included in the minimum slice.

**Post-design status**: Pass. The selected design remains a modular monolith with one frontend app, one backend app, and one infrastructure surface, with no unjustified complexity.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-bootstrap/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-bootstrap-api.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── web/
│   ├── src/
│   │   ├── app/
│   │   ├── routes/
│   │   ├── features/auth/
│   │   ├── features/me/
│   │   ├── components/
│   │   └── lib/
│   └── tests/
│       ├── unit/
│       └── e2e/
├── api/
│   ├── src/
│   │   ├── domain/
│   │   │   └── user/
│   │   ├── application/
│   │   │   └── user_context/
│   │   ├── infrastructure/
│   │   │   ├── http/
│   │   │   ├── auth/
│   │   │   └── persistence/
│   │   └── main/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── contract/
└── shared/
    └── contracts/

infra/
└── terraform/
    ├── modules/
    │   ├── dns/
    │   ├── frontend_hosting/
    │   ├── identity/
    │   ├── api_runtime/
    │   ├── persistence/
    │   ├── observability/
    │   └── tf_state/
    └── environments/
        └── dev/

docs/
└── adr/
```

**Structure Decision**: Use a small monorepo layout with `apps/web`, `apps/api`, and `infra/terraform`. This keeps the first slice readable, aligns with the constitution's modular-monolith preference, and gives frontend, backend, and Terraform clear ownership boundaries without introducing service sprawl.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Work Breakdown

### Frontend

1. Create a static single-page web app optimized for CloudFront delivery.
2. Implement a public landing page with a clear sign-in action.
3. Implement Cognito Hosted UI redirect/callback handling using authorization code with PKCE.
4. Implement authenticated route guards and session-aware navigation.
5. Implement the protected authenticated shell.
6. Implement the `/me` bootstrap screen with loading, success, expired-session, and temporary-error states.
7. Implement sign-out, session clear-down, and redirect back to public entry.
8. Add unit coverage for auth/session helpers and end-to-end browser tests for public entry, protected-route redirect, successful login, `/me` load, and sign-out.

### Backend

1. Create a Lambda-based API with a thin HTTP adapter and explicit application use cases.
2. Expose `GET /health` as an unauthenticated liveness endpoint.
3. Expose `GET /me` as the authenticated user-context endpoint.
4. Use API Gateway JWT authorization with Cognito so token authenticity and audience are enforced before the Lambda handler runs.
5. Implement a `GetOrBootstrapLocalUser` use case that:
   - accepts verified identity claims,
   - looks up the local user by provider subject,
   - creates the local user on first login,
   - updates last-login metadata for returning users,
   - returns the bootstrap identity view.
6. Implement persistence through a repository port with a DynamoDB adapter.
7. Add unit tests for domain/application logic, integration tests for the DynamoDB adapter, and contract tests for `/health` and `/me`.

### Terraform Infrastructure

1. Bootstrap encrypted remote Terraform state.
2. Provision the public DNS and TLS path for the web domain.
3. Provision static frontend hosting on S3 behind CloudFront.
4. Provision Cognito User Pool, App Client, and Hosted UI configuration for the managed sign-in flow.
5. Provision API Gateway HTTP API, Lambda runtime, IAM roles, and CloudWatch log groups.
6. Provision the DynamoDB table for local users with encryption and point-in-time recovery.
7. Provision secure runtime configuration through SSM Parameter Store or Secrets Manager.
8. Wire least-privilege IAM permissions between API, persistence, logging, and config services.
9. Add baseline observability resources and deployment outputs needed to validate the first environment.

## Runtime Design Decisions

### Frontend Stack Choice

- **Chosen**: React + TypeScript + Vite, React Router, TanStack Query, `oidc-client-ts`
- **Why**: This is the smallest modern stack that cleanly supports static hosting, protected routes, OIDC redirect handling, and a future component/design-system approach without adding server-rendering or full framework complexity.
- **Design Reference**: Frontend implementation should use `DESIGN.md` as the visual-system reference while still following the constitution's accessibility and design-system requirements.
- **Rejected alternatives**:
  - Next.js: stronger full-stack story, but adds SSR/server concerns that are unnecessary for the first protected shell.
  - AWS Amplify frontend framework: helpful abstractions, but adds another opinionated layer and is broader than the current slice needs.

### Backend Runtime Choice

- **Chosen**: API Gateway HTTP API + AWS Lambda (Python 3.12) with AWS Lambda Powertools
- **Why**: This is the most AWS-native minimal runtime for a two-endpoint authenticated API. It keeps operational burden low, integrates cleanly with Cognito JWT authorization, and supports a clean hexagonal application core.
- **Rejected alternatives**:
  - ECS/Fargate: more flexibility, but too much operational surface for the first slice.
  - Lambda + FastAPI/Mangum: viable, but the slice does not need a full ASGI framework and can stay simpler with a thinner Lambda HTTP adapter.

### Authentication Boundary Choice

- **Chosen**: Cognito Hosted UI with authorization code + PKCE for the web app; API Gateway JWT authorizer for protected API routes
- **Why**: It keeps credentials and token verification in managed infrastructure, aligns with the requirement to treat identity as a platform capability, and reduces custom auth code to session handling and claim consumption.
- **Rejected alternatives**:
  - Custom email/password handling: violates the desired simplicity and increases security risk.
  - Lambda-side raw JWT verification only: workable, but pushes platform concerns deeper into the application and duplicates API boundary responsibilities.

### Persistence Choice

- **Chosen**: Single DynamoDB table for local users
- **Why**: The local user record is the only application persistence required in this slice. DynamoDB is managed, cheap at small scale, easy to secure, and fits the bootstrap lookup/create pattern well.
- **Rejected alternatives**:
  - RDS/PostgreSQL: richer relational model, but unnecessary before multi-aggregate relationships exist.
  - No local persistence: would violate the requirement to bootstrap a Campfire-owned user record.

## Dependency and Sequence Plan

### Phase 0 - Foundations and research decisions

1. Confirm the stack and runtime choices captured in `research.md`.
2. Confirm the local user data model and API contract.
3. Establish Terraform module boundaries and environment assumptions.

### Phase 1 - Infrastructure skeleton first

1. Create Terraform remote state.
2. Create dev environment wiring.
3. Provision DNS, certificates, static hosting, Cognito, API runtime skeleton, DynamoDB, and secure config stores.
4. Expose deployment outputs needed by frontend and backend pipelines.

**Why first**: The frontend auth flow and backend token handling both depend on real infrastructure identifiers and callback URLs.

### Phase 2 - Backend implementation

1. Build the Lambda application skeleton with domain, application, and infrastructure layers.
2. Implement `/health`.
3. Implement authenticated user-context retrieval and local user bootstrap.
4. Add test coverage against the contract and DynamoDB integration.

**Dependency**: Requires Cognito configuration, API route shape, and DynamoDB table names from Terraform.

### Phase 3 - Frontend implementation

1. Build the public landing page and app shell.
2. Integrate Hosted UI redirect/callback flow.
3. Implement protected routes and bootstrap screen.
4. Integrate sign-out and invalid-session handling.
5. Add unit and browser coverage.

**Dependency**: Requires deployed web domain, Cognito app client settings, and the backend `/me` contract.

### Phase 4 - Deployment validation

1. Deploy infrastructure, backend, and frontend to the first environment.
2. Validate public domain reachability and TLS.
3. Validate sign-in, protected-route redirect, `/me`, sign-out, and expired-session behavior.
4. Verify logs, metrics, and failure diagnostics.

## Deliverables

- Terraform modules and one deployable `dev` environment for:
  - public web delivery,
  - managed auth,
  - API runtime,
  - local-user persistence,
  - secure configuration,
  - baseline observability
- Frontend application with:
  - landing page,
  - auth redirect/callback,
  - protected shell,
  - `/me` bootstrap experience,
  - sign-out flow
- Backend application with:
  - `/health`,
  - `/me`,
  - first-login local user bootstrap,
  - verified-claims-driven user-context retrieval
- Documentation artifacts:
  - `research.md`,
  - `data-model.md`,
  - `contracts/auth-bootstrap-api.openapi.yaml`,
  - `quickstart.md`

## Key Risks and Mitigations

- **Risk**: Callback URL and domain misconfiguration breaks sign-in.
  - **Mitigation**: Provision domain, CloudFront outputs, and Cognito callback configuration from the same Terraform environment and validate with deployment smoke tests.
- **Risk**: Duplicate local-user creation under concurrent first-login requests.
  - **Mitigation**: Use provider subject as a uniqueness-enforced lookup attribute and conditional writes in DynamoDB.
- **Risk**: Session handling drifts between frontend and backend assumptions.
  - **Mitigation**: Use a single explicit contract for authenticated user-context retrieval and cover it with browser and contract tests.
- **Risk**: Overbuilding the slice into a general account platform.
  - **Mitigation**: Keep the only persisted business record to the minimum local user and reject roles, invites, profile editing, and multi-provider expansion in this phase.
