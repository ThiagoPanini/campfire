# Research: Auth Bootstrap

## Decision: Use a static web app on S3 + CloudFront for the first public Campfire domain

**Rationale**:
- The first slice needs a fast public landing page, protected navigation, and an auth callback flow, not server-rendered content.
- S3 + CloudFront is the smallest AWS-native hosting path that supports custom domain delivery, TLS termination, and asset caching.
- It keeps runtime responsibilities out of the frontend tier and reduces operational overhead for a solo maintainer.

**Alternatives considered**:
- **Next.js on Lambda or containers**: Adds SSR/runtime complexity before it provides meaningful value.
- **AWS Amplify Hosting**: Viable, but introduces an additional hosting abstraction when direct CloudFront/S3 Terraform is simpler and keeps infrastructure explicit.

## Decision: Use Cognito Hosted UI with authorization code + PKCE for web authentication

**Rationale**:
- Credentials remain inside a managed identity provider flow.
- Authorization code + PKCE is the safest mainstream browser flow for this slice.
- Hosted UI reduces the amount of custom auth UI and security-sensitive code in the frontend.

**Alternatives considered**:
- **Custom username/password forms**: Rejected due to higher security burden and unnecessary complexity.
- **Embedded Cognito sign-in UI**: Still workable, but Hosted UI keeps the first deployable slice simpler and clearer.

## Decision: Enforce JWT validation at API Gateway with Cognito integration

**Rationale**:
- Token authenticity and audience validation are enforced at the API boundary before requests reach business logic.
- This aligns with the requirement to treat identity as infrastructure/platform capability, not domain logic.
- It minimizes duplicate verification code inside the Lambda handler.

**Alternatives considered**:
- **Manual JWT verification in Lambda**: More custom code and a weaker separation of concerns.
- **Session cookie validation at a custom backend layer**: Adds complexity and is not required for the current slice.

## Decision: Use AWS Lambda as the minimal backend runtime

**Rationale**:
- The slice needs only two endpoints and low early traffic.
- Lambda keeps the deployment footprint small and integrates naturally with API Gateway, CloudWatch, IAM, and DynamoDB.
- It fits the constitution's preference for managed, AWS-native simplicity.

**Alternatives considered**:
- **ECS/Fargate**: Rejected for higher infrastructure and deployment complexity.
- **EC2**: Rejected as operationally heavy and misaligned with the current scale.

## Decision: Implement the backend in Python 3.12 with AWS Lambda Powertools

**Rationale**:
- Python is already a supported language in the repository and is well-suited to small application-service style backends.
- AWS Lambda Powertools gives structured logging, routing helpers, and tracer/metrics support without introducing a full web framework.
- The application core can stay framework-light and hexagonal.

**Alternatives considered**:
- **FastAPI + Mangum**: Reasonable, but adds an ASGI layer the slice does not need.
- **TypeScript Lambda**: Also reasonable, but introduces a second large TypeScript codebase at the same time the frontend is already TypeScript-heavy.

## Decision: Use a single DynamoDB table for local users

**Rationale**:
- The only persistent business artifact needed now is the minimum Campfire-owned user record.
- DynamoDB supports conditional writes for safe first-login bootstrap and avoids running a relational database before relationships exist.
- The cost and operational profile are appropriate for an early-stage slice.

**Alternatives considered**:
- **RDS/PostgreSQL**: Strong future candidate once richer relational modeling is needed, but too heavy for the first slice.
- **No local persistence**: Rejected because the spec requires local user bootstrap.

## Decision: Model the local user as an internal Campfire record linked to external identity claims

**Rationale**:
- Campfire needs its own user identity record even though authentication is externalized.
- A Campfire-owned `user_id` preserves a clean domain boundary and prevents future business logic from depending directly on identity-provider internals.
- The external provider subject remains a unique lookup key, not the domain identifier itself.

**Alternatives considered**:
- **Use the provider subject as the only key**: Simpler today, but couples the domain model tightly to one identity provider.

## Decision: Start with one deployable `dev` environment, but structure Terraform for later `prod` isolation

**Rationale**:
- The user asked for the first deployable environment, and a single active environment keeps the slice executable.
- Terraform module boundaries should still anticipate dev/prod separation to satisfy the constitution's environment-isolation direction.

**Alternatives considered**:
- **Provision dev and prod immediately**: More complete, but slows the first executable slice.
- **Use one undifferentiated shared environment forever**: Rejected because it conflicts with future environment isolation needs.
