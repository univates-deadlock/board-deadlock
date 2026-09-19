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

Do not trust a role or permission name supplied in a request body/query. Use authenticated claims that were cryptographically verified or reload server-owned permissions from persistence according to the project's model.

## Ownership and tenant boundaries

Ownership is authorization, not just filtering. For a resource such as `/:id`, verify that the authenticated caller may access that specific record before exposing or mutating it.

In multi-tenant systems, scope reads and writes by the authenticated tenant/organization context. Never accept a client-supplied tenant identifier as sufficient proof of membership. Prefer query conditions that make crossing the boundary impossible rather than fetching broadly and forgetting a later check.

## Sensitive state changes

For operations that change credentials, permissions, billing-relevant state, destructive resources, or other sensitive data, verify the same server-side authorization on every mutation path. Background jobs, alternate routes, batch operations, and admin endpoints should not bypass the policy accidentally.

## Common insecure patterns

Avoid:

- relying on hidden/disabled frontend controls;
- authorizing from `req.body.role` or another client-owned field;
- checking authentication but not resource ownership;
- querying by resource ID without tenant scoping in a multi-tenant system;
- duplicating authorization logic inconsistently across handlers when the project already has a reusable policy/middleware;
- returning sensitive fields merely because the caller can access the resource at all.
