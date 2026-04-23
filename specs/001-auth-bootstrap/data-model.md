# Data Model: Auth Bootstrap

## Overview

This slice introduces only the minimum Campfire-owned data needed after successful authentication: a local user record that links a validated external identity to an internal Campfire user.

Identity sessions and token verification remain platform concerns handled by Cognito and API Gateway. The backend consumes verified claims and persists only Campfire-owned user data.

## Entities

### LocalUser

**Purpose**: Represents the minimum Campfire-owned identity record created on first successful login and reused for future authenticated requests.

**Fields**:
- `user_id`: Internal Campfire identifier
- `provider_name`: External identity provider identifier for the authenticated source
- `provider_subject`: Stable external subject claim used for identity lookup
- `email`: Current email claim if available
- `email_verified`: Whether the identity provider considers the email verified
- `display_name`: Best available human-readable name for bootstrap display
- `status`: Current account status
- `created_at`: First bootstrap timestamp
- `updated_at`: Most recent write timestamp
- `last_login_at`: Most recent successful authenticated access timestamp

**Validation Rules**:
- `user_id` must be immutable once created
- `provider_name` + `provider_subject` must uniquely identify one LocalUser
- `status` must default to `active` for this slice
- `created_at` must be set only once
- `last_login_at` must update only after successful authenticated retrieval

**Relationships**:
- Has a one-to-one linkage to one external identity subject for this slice
- Is returned by the bootstrap identity view

### BootstrapIdentityView

**Purpose**: The user-context representation returned to the authenticated shell after the API resolves the signed-in person.

**Fields**:
- `user_id`
- `display_name`
- `email`
- `status`
- `first_login`: Boolean indicating whether the local user was created during this request
- `last_login_at`

**Validation Rules**:
- Must only be returned for authenticated requests with verified boundary claims
- Must not include secrets, raw tokens, or internal infrastructure details

### VerifiedIdentityClaims

**Purpose**: Normalized claims handed to the application layer after API Gateway accepts the JWT.

**Fields**:
- `provider_name`
- `provider_subject`
- `email`
- `email_verified`
- `display_name`

**Validation Rules**:
- Must originate from a request that already passed platform-level token verification
- Must contain a non-empty `provider_subject`

## State Transitions

### LocalUser lifecycle

1. **Absent**
   - No Campfire-owned local record exists yet for the verified external identity.
2. **Bootstrapped**
   - First authenticated request creates the LocalUser record.
3. **Active**
   - Returning authenticated requests reuse the LocalUser and update access metadata.

For this slice, `Bootstrapped` and `Active` may share the same persisted `status` value while remaining distinct at the use-case level through the `first_login` flag.

## Persistence Model

### Minimum AWS persistence

**Chosen store**: One DynamoDB table dedicated to local users.

**Table responsibilities**:
- Store the LocalUser record
- Support unique lookup by provider identity
- Support idempotent first-login bootstrap

### Key strategy

- Primary identifier: `user_id`
- Unique lookup path: `provider_name` + `provider_subject`

**Implementation note for planning**:
- The table should support conditional create semantics so two concurrent first-logins for the same identity do not create duplicate users.
- The persistence adapter should hide the concrete key shape from the domain and application layers.

## Use Cases

### GetOrBootstrapLocalUser

**Input**:
- Verified identity claims

**Behavior**:
1. Look up existing LocalUser by provider identity.
2. If found, update last-login metadata and return BootstrapIdentityView with `first_login = false`.
3. If not found, create LocalUser, set baseline timestamps, and return BootstrapIdentityView with `first_login = true`.

**Failure Cases**:
- Missing required verified claims
- Persistence conflict during bootstrap
- Persistence unavailable

## Out of Scope for this model

- Rich user profile editing
- User roles or permissions
- Multi-provider account linking
- Group membership
- Music-domain entities such as songs, instruments, or proficiency
