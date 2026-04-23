# Auth Bootstrap Runtime Flows

Generated: 2026-04-23  
Scope: current auth-bootstrap request and LocalStack-backed local-development execution paths

## 1. Purpose

This companion artifact captures the most important runtime sequences behind the current Campfire foundation:

- sign-in and callback completion
- protected-route access
- `/me` bootstrap resolution
- local backend execution

Use this document when debugging auth/bootstrap behavior or when adding new authenticated surfaces.

## 2. Production Sign-In and Callback Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant SPA as React SPA
    participant Cognito as Cognito Hosted UI

    User->>Browser: Open app domain
    Browser->>SPA: Load landing page
    User->>SPA: Click sign in
    SPA->>Cognito: beginSignIn() / redirect
    Cognito-->>Browser: Hosted UI login flow
    Cognito-->>SPA: Redirect to /auth/callback?code=...
    SPA->>SPA: completeSignIn()
    SPA->>SPA: Persist session + auth-changed event
    SPA->>Browser: Navigate to /app/me
```

### Observations

- Credential handling is delegated fully to Cognito Hosted UI.
- The frontend owns only redirect initiation and callback completion.
- Development mode bypasses this flow with a synthetic session for faster local UI work.

## 3. Protected Route and Bootstrap Flow

```mermaid
sequenceDiagram
    participant User
    participant Router as ProtectedRoute
    participant Session as session.ts
    participant Hook as useMe()
    participant API as API Gateway
    participant Lambda as lambda_handler
    participant Claims as map_verified_claims()
    participant UseCase as GetOrBootstrapLocalUser
    participant Repo as DynamoDbLocalUserRepository
    participant DDB as DynamoDB

    User->>Router: Open /app or /app/me
    Router->>Session: getSession() + isAuthenticated()
    alt No valid session
        Router-->>User: Redirect to /?returnTo=...
    else Session exists
        Router->>Hook: Render protected shell
        Hook->>API: GET /me with bearer token
        API->>Lambda: Forward validated request
        Lambda->>Claims: Map trusted claims
        Claims->>UseCase: VerifiedIdentityClaims
        UseCase->>Repo: get_by_provider_identity()
        Repo->>DDB: Query gsi1
        alt Existing local user
            DDB-->>Repo: Local user item
            Repo-->>UseCase: LocalUser
            UseCase->>Repo: update(register_login)
            Repo->>DDB: Put item
        else First login
            DDB-->>Repo: No user
            UseCase->>Repo: create(LocalUser.bootstrap(...))
            Repo->>DDB: Conditional put
        end
        UseCase-->>Lambda: BootstrapIdentityDto
        Lambda-->>Hook: 200 JSON response
        Hook-->>User: Render bootstrap state
    end
```

### Observations

- Trust establishment happens before the application use case executes.
- The use case works with normalized claims, not raw API Gateway event payloads.
- `/me` is both the first-login bootstrap path and the returning-session refresh path.

## 4. Unauthorized and Invalid Identity Paths

```mermaid
flowchart TD
    A[Request /app/me] --> B{Frontend session exists?}
    B -- No --> C[Redirect to landing page]
    B -- Yes --> D[GET /me]
    D --> E{JWT / claims valid?}
    E -- No --> F[401 from API]
    E -- Yes --> G{Email verified and subject present?}
    G -- No --> H[401 unauthorized]
    G -- Yes --> I[Resolve or create LocalUser]
```

### Notes

- Missing frontend session never reaches protected content.
- Backend rejects both missing JWT context and mapped-claim validation failures.
- Verified email is a business gate for initial Campfire access.

## 5. Local Backend Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Make as make run
    participant Script as scripts/local/run.sh
    participant Server as local_server.py
    participant Auth as local_auth.py
    participant Handler as lambda_handler
    participant DDB as LocalStack DynamoDB

    Dev->>Make: Start local backend
    Make->>Script: Invoke canonical local runner
    Script->>Server: Run local HTTP adapter
    Server->>Auth: Ensure signing material
    Dev->>Server: GET /health or GET /me
    alt /me with bearer token
        Server->>Auth: verify_access_token()
        Auth-->>Server: Local claims
    end
    Server->>Handler: Build Lambda-like event
    Handler->>DDB: Repository access when needed
    Handler-->>Server: Lambda-style response
    Server-->>Dev: HTTP JSON response with CORS headers
```

### Why This Matters

- Local execution reuses the real handler instead of a separate dev-only app.
- Auth verification still happens before the handler sees claims.
- This keeps local debugging close to the production trust boundary.

## 6. Infrastructure Provisioning Flow

```mermaid
flowchart LR
    TF[Terraform dev environment]
    DNS[dns module]
    WEB[frontend_hosting module]
    ID[identity module]
    DB[persistence module]
    OBS[observability module]
    API[api_runtime module]

    TF --> DNS
    TF --> WEB
    TF --> ID
    TF --> DB
    TF --> OBS
    TF --> API
    DNS --> WEB
    DNS --> API
    ID --> API
    DB --> API
    OBS --> API
```

### Notes

- `environments/dev/main.tf` is the orchestration root.
- `api_runtime` depends on DNS, identity, persistence, and observability outputs.
- Web and API domains are separate subdomains under one root domain.

## 7. Debugging Checklist By Runtime Step

### Landing or redirect problems

- Verify CloudFront and Route53 alias records.
- Verify frontend env values for auth authority and redirect URI.
- Verify Cognito callback and logout URLs match deployed domains.

### Callback problems

- Check whether `completeSignIn()` resolves or rejects.
- Confirm the returned URL includes a valid authorization code.
- Confirm browser storage receives the session payload.

### Protected route problems

- Confirm `getSession()` returns a non-expired session.
- Confirm `ProtectedRoute` is mounted under the expected path.
- Confirm the route is not redirecting due to a stale dev session.

### `/me` problems

- Check API Gateway JWT authorizer configuration.
- Check backend logs for `me_unauthorized`, `me_rejected`, or `me_success`.
- Check DynamoDB lookup/create behavior for the provider identity.

### Local backend problems

- Confirm LocalStack is running on `http://localhost:4566`.
- Confirm local JWT signing material exists.
- Confirm the generated token issuer/audience match the local verifier settings.
- Confirm the local server is building the event with `authorizer.jwt.claims`.
