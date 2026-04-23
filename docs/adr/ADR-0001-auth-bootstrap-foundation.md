# ADR-0001: Auth Bootstrap Foundation

## Status

Accepted

## Context

Campfire needs the smallest secure AWS-deployable slice that lets a pre-provisioned user reach the public site, authenticate through managed infrastructure, enter a protected shell, and trigger local user bootstrap on first access.

## Decision

- Host the frontend as a static React/Vite application on S3 behind CloudFront.
- Use Cognito Hosted UI with authorization code + PKCE for managed authentication.
- Use API Gateway HTTP API with JWT authorization and a Python 3.12 Lambda backend.
- Persist the minimum local user record in a single DynamoDB table.
- Restrict access to pre-provisioned users with verified email claims.

## Consequences

- Identity remains a platform capability, while the Campfire backend owns only local user bootstrap and authenticated user context.
- The first environment stays simple enough for a solo maintainer, with Terraform managing the full AWS footprint.
- Future features can build on a stable `GET /me` boundary and an internal Campfire `user_id` without coupling product logic to Cognito subjects.

## Operator Notes

- Create test users directly in Cognito or through AWS CLI/admin tooling. Public self-service registration is intentionally disabled.
- Validate that invited users have verified email addresses before using the environment smoke flow.
- Use CloudWatch logs, the Lambda error alarm, and the `/health` smoke script first when triaging deployment issues.
