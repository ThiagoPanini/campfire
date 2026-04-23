# Contract: GitHub OIDC → AWS IAM trust

## Principle

- No long-lived AWS credentials in GitHub secrets (SC-004).
- One role per environment (`campfire-ci-dev`, `campfire-ci-prod`), each in its own AWS account.
- Least-privilege policies (Constitution Principle X). Prod is strictly more restricted than dev.

## Trust policy shape

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "arn:aws:iam::<account>:oidc-provider/token.actions.githubusercontent.com" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:<owner>/campfire:ref:refs/heads/main",
            "repo:<owner>/campfire:environment:<env-name>"
          ]
        }
      }
    }
  ]
}
```

- `sub` MUST pin to a branch and/or GitHub Environment name. Wildcards on `sub` are
  forbidden for `prod`.
- `aud` MUST equal `sts.amazonaws.com`.
- The OIDC provider thumbprint is managed by AWS's well-known GitHub provider (no
  manual thumbprint pinning required as of GitHub's current practice; revisit during
  implementation).

## Role policy boundaries

- **Dev role**: Permission to manage resources in the `campfire-dev-*` Terraform
  module scope only (S3 prefixes, DynamoDB tables, Lambda functions, IAM roles named
  `campfire-dev-*`). No `*:*` actions. No cross-account access.
- **Prod role**: Same shape as dev but scoped to prod names. Additionally:
  - May NOT assume the dev role.
  - May NOT write to the prod artifact bucket object-lock configuration.
  - May NOT delete objects in the prod artifact bucket.

## Session policy

Every workflow that assumes a role MUST pass a session policy that further narrows the
session to the specific action being performed (plan vs. apply vs. smoke). This makes
a compromised runner's blast radius smaller than the role itself.

## CI enforcement

- `scripts/ci/assert-oidc.sh` runs at the top of every deploy job and exits non-zero
  if `AWS_WEB_IDENTITY_TOKEN_FILE` is not set, guaranteeing no static-creds fallback
  path can accidentally be introduced.
- A scheduled workflow inventories the repo for any `AWS_ACCESS_KEY_ID` or
  `AWS_SECRET_ACCESS_KEY` secrets defined in Actions secrets and fails if found.

## Audit

- Every assume-role call is logged in CloudTrail with the GitHub workflow-run URL
  as the `RoleSessionName`, enabling correlation from an AWS API call to a pipeline
  run.
