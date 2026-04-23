# Quickstart: Auth Bootstrap

## Goal

Stand up the first deployable Campfire environment in AWS and validate the end-to-end secure slice:
- public site reachable on the Campfire domain
- managed sign-in flow
- protected authenticated shell
- bootstrap user-context retrieval
- automatic local user creation on first login

## Prerequisites

- AWS account and deployment credentials for the target environment
- Registered Campfire domain with DNS control
- Terraform installed and authenticated
- Node.js and package manager for the frontend
- Python 3.12 and dependency tooling for the backend
- A pre-provisioned Cognito test user with a verified email address

## Environment Inputs

Prepare environment-specific values for:
- root domain and web hostname
- API hostname
- Cognito callback and logout URLs
- deployment region
- Terraform state bucket/lock configuration

## Deployment Order

1. **Bootstrap Terraform state**
   - Create or apply the remote-state bootstrap needed for encrypted shared state storage.

2. **Apply infrastructure for the first environment**
   - Provision DNS, TLS, static hosting, Cognito, API Gateway, Lambda, DynamoDB, IAM, secure config, and log groups.

3. **Deploy backend**
   - Package and publish the Lambda artifact.
   - Confirm that the unauthenticated health endpoint responds successfully.
   - Ensure the Lambda environment variables match the Terraform outputs for API base URL, web base URL, table name, and Cognito metadata.

4. **Deploy frontend**
   - Build the static web app with the environment outputs from Terraform.
   - Publish the assets to the hosting bucket and invalidate the CloudFront distribution if needed.

5. **Smoke test the system**
   - Open the public site through the Campfire domain.
   - Verify the sign-in button starts the managed auth flow.
   - Sign in with a valid test user.
   - Confirm redirect into the protected shell.
   - Confirm the bootstrap screen loads the authenticated user context.
   - Sign out and verify protected routes are blocked again.

## Pre-Provisioned User Administration

- Use Cognito admin user creation only. Public sign-up remains disabled for this slice.
- Create a test user with a verified email claim before running smoke validation.
- Store temporary onboarding credentials out of band; do not commit them or place them in Terraform variables.
- Confirm the user can complete the Hosted UI challenge flow before testing `/me`.

## Validation Checklist

- Public domain resolves and serves TLS correctly
- Landing page loads without exposing protected content
- Protected route redirects unauthenticated users to sign-in
- Successful sign-in reaches the authenticated shell
- First sign-in creates the local user record
- Returning sign-in reuses the existing local user record
- `/health` is reachable without authentication
- `/me` is not reachable without valid authentication
- Sign-out clears protected access
- Logs are available for sign-in, token rejection, bootstrap create, and bootstrap lookup paths

## Failure Triage

- If the site is down, check CloudFront distribution status, S3 asset deployment, DNS, and ACM certificate validation.
- If sign-in cannot start, check Cognito app client callback/logout URLs and frontend environment configuration.
- If sign-in succeeds but `/me` fails, check API Gateway JWT authorization, Lambda logs, and DynamoDB table access.
- If first login creates duplicates, check conditional write logic and provider-subject uniqueness enforcement.
- If the Hosted UI flow succeeds but the shell still fails, confirm the frontend is using the latest Cognito client id, callback URL, and logout URL outputs.
