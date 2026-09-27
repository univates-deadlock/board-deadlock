# Authentication and authorization

Treat authentication and authorization as separate checks even when the same middleware participates in both.

## Authentication

Authentication answers: "Who is making this request?"

Use the repository's existing session, token, API-key, or identity-provider integration. Validate credentials on the server and derive authenticated identity from trusted server-side verification, not from client-submitted `userId`, email, role, or tenant fields.

Use `401 Unauthorized` when authentication is required but missing, invalid, expired, or otherwise unusable. Follow the project's existing challenge/header behavior when relevant.

## Authorization

Authorization answers: "May this authenticated identity perform this action on this resource?"

Enforce it at the backend boundary that actually protects the operation. UI visibility can improve user experience but cannot grant or deny authority.

Common authorization inputs include:

- role or permission membership;
- ownership of the target resource;
- tenant/organization membership;
- resource state;
- action-specific policy.

Use `403 Forbidden` when the caller is authenticated but does not have permission, unless the project intentionally returns `404` for particular resources to avoid confirming their existence. Apply such concealment consistently rather than ad hoc.

## RBAC and permissions

When the project uses roles, keep role definitions server-controlled and translate them into the smallest privileges the user needs. Avoid broad admin checks when an existing narrower permission is available.

Do not derive the caller's authority from a role or permission name supplied in a request body/query. Use authenticated claims that were cryptographically verified or reload server-owned permissions from persistence according to the project's model.

A target user's role is a separate input: an authorized administrator may be allowed to assign one. Validate allowed values and enforce the caller's permission to assign that value; do not confuse target fields with trusted caller identity. Apply the same distinction to writable ownership or tenant fields.

## Ownership and tenant boundaries

Ownership is authorization, not just filtering. For a resource such as `/:id`, verify that the authenticated caller may access that specific record before exposing or mutating it.

In multi-tenant systems, scope reads and writes by the authenticated tenant/organization context. Never accept a client-supplied tenant identifier as sufficient proof of membership. Prefer query conditions that make crossing the boundary impossible rather than fetching broadly and forgetting a later check.

## Sensitive state changes

For operations that change credentials, permissions, billing-relevant state, destructive resources, or other sensitive data, verify the same server-side authorization on every mutation path. Background jobs, alternate routes, batch operations, and admin endpoints should not bypass the policy accidentally.

## Library-provided mutation paths

Map application-owned routes alongside the identity library's native signup, profile update, email change, account deletion, and credential-change endpoints. Identify which can change the same records and what each path permits. A protected custom controller does not protect a library handler mounted elsewhere.

Apply or restrict native routes according to product policy, using supported configuration, hooks, or middleware for the installed version. Preserve intended self-service flows; do not disable all native routes by default. Verify writable fields and policies on both native and custom paths.

## Cookie sessions and provisioning

Let the existing identity library manage cookie signing, session expiry, and logout. Preserve its trusted-origin and CSRF protections. For browser requests between origins, verify credentialed CORS with an explicit permitted origin and credentials support; a wildcard origin does not support credentialed access. Check cookie host/domain, path, `SameSite`, `Secure`, and `HttpOnly` settings against the actual deployment. Cross-origin and cross-site are different; do not change cookie policy solely because ports differ.

Prefer officially supported library APIs for internal account provisioning. If the project already writes credentials directly, inspect the installed version's record format, identity/account linkage, hashing algorithm and parameters, and atomicity of required writes before extending it. Do not generalize manual credential storage to other projects.

## Account state and session consistency

Determine the product's policy for deactivation, role/email changes, and existing sessions. Inspect whether the library reads persisted state on each request or uses cached/session claims, and how logout, revocation, and cache invalidation affect subsequent authorization.

Checking activity before login can be insufficient: deactivation may revoke sessions while a concurrent login inserts a new session afterward. Trace verification, session creation, hooks, cache reads, and transaction boundaries across both operations. Choose a supported coordination strategy that enforces the required invariant, and verify concurrent behavior. Do not assume an initial check or a particular isolation level solves every library lifecycle.

## Rate limits

General and authentication-specific limiters can coexist. Inspect their route scope, identity/IP keys, time-window units, special endpoint rules, overrides, and storage, including behavior across application instances. Trace which layer returned `429` and respect its `Retry-After` contract when present. Use isolated fixtures and appropriate pacing during verification; do not disable protection merely to make a check succeed.

## Common insecure patterns

Avoid:

- relying on hidden/disabled frontend controls;
- deriving caller authority from `req.body.role` or another client-owned field;
- checking authentication but not resource ownership;
- querying by resource ID without tenant scoping in a multi-tenant system;
- duplicating authorization logic inconsistently across handlers when the project already has a reusable policy/middleware;
- returning sensitive fields merely because the caller can access the resource at all.
