---
name: building-typescript-rest-apis
description: Use when creating, modifying, reviewing, or refactoring TypeScript REST APIs, including Node.js or Express endpoints, request validation with Zod or similar schemas, Prisma or PostgreSQL persistence, authentication or authorization, transactions, HTTP error handling, or API tests with tools such as Vitest and Supertest.
---

# Building TypeScript REST APIs

## Core principle

Preserve and extend existing project conventions before creating new ones. Build predictable, typed, secure, testable APIs without introducing an architectural pattern, layer, dependency, or abstraction that the repository does not already need.

## Before changing code

Inspect the repository and the closest existing implementation first:

1. Read `AGENTS.md`, `CLAUDE.md`, or equivalent project instructions when present.
2. Trace the current API architecture from route registration through request handling, business rules, persistence, and error mapping.
3. Find similar endpoints and reuse their route shape, response format, status semantics, middleware, validation, and test style.
4. Inspect existing authentication and authorization enforcement before adding protected behavior.
5. Inspect schemas, database access, Prisma models/migrations, constraints, and transaction patterns that affect the change.
6. Inspect relevant tests before deciding what boundary to extend.

Do not introduce Clean Architecture, DDD, repositories, services, classes, or new directory conventions solely because they are common elsewhere.

## HTTP boundary

- Keep routes/controllers focused on HTTP concerns: parse input, invoke the existing application flow, and translate outcomes into the project's response conventions.
- Parse path parameters, query parameters, headers, and bodies explicitly where they affect behavior.
- Return status codes and response bodies consistently with nearby endpoints.
- Keep domain/business decisions out of HTTP-specific conditionals when the project already has a suitable non-HTTP boundary for them; do not create a new layer only to satisfy this guideline.
- Avoid leaking framework request/response objects deeper into the code unless that is already the project convention.

## Validation

Validate every relevant external input before trusting it, including body, params, query, and environment/configuration when applicable. Zod is a strong fit when the project uses it; otherwise follow the existing schema/validation approach.

- Produce validation errors that are actionable for clients and distinct from unexpected server failures.
- Derive TypeScript input types from schemas when that removes duplication and fits the codebase.
- Do not maintain parallel TypeScript interfaces and runtime schemas without a reason.
- Treat coercion deliberately: URL/query input often arrives as strings, and silent coercion can change semantics.

See `references/validation-and-errors.md` for deeper guidance.

## Authentication and authorization

Authentication establishes identity; authorization decides whether that identity may perform the requested action.

- Enforce authorization on the server for every protected operation. Hidden frontend controls are not authorization.
- Apply least privilege and reuse the project's existing policy, role, permission, or ownership model.
- Do not trust roles, ownership, tenant identifiers, or permissions supplied directly by the client when the server can derive them from authenticated context or persisted data.
- Use `401 Unauthorized` for missing/invalid authentication and `403 Forbidden` when an authenticated caller is not permitted, unless the project deliberately uses a different concealment strategy.

See `references/authentication-and-authorization.md`.

## Error handling

Make expected failure modes explicit and predictable:

- invalid input;
- missing resources;
- conflicts or violated business constraints;
- authentication/authorization failures;
- unexpected internal failures.

Do not expose stack traces, SQL details, secrets, or internal implementation data to clients. Preserve useful technical context in server logs using the project's logging conventions. Do not catch errors only to ignore them, and do not reduce client-correctable failures to an unhelpful generic `500`.

## Persistence with Prisma/PostgreSQL

- Keep queries explicit and readable; select/include only what the operation needs when that materially reduces data loading or sensitive exposure.
- Avoid N+1 access patterns and unnecessary round trips.
- Treat `null`, optional fields, defaults, and relation existence consciously.
- Let database constraints enforce invariants that truly belong in the database, and map expected constraint failures to stable API outcomes.
- Review indexes when a new or changed query pattern can become frequent or expensive; do not add speculative indexes without a query reason.
- Review cascade behavior before changing relations or delete flows.
- Keep business rules understandable rather than scattering them across opaque query expressions.
- Prefer Prisma's parameterized APIs. Use raw SQL only when it has a clear advantage that the normal client cannot express reasonably, and parameterize it safely.

See `references/prisma-and-transactions.md`.

## Transactions

Use a transaction when multiple database changes must succeed or fail as one business operation. Do not wrap a single simple write in a transaction without a concrete consistency reason.

- Keep transactions as short as practical.
- Avoid slow network calls or other external side effects inside a database transaction.
- Consider concurrency, uniqueness, stale reads, and retry behavior when the same resource can be changed concurrently.
- Ensure important multi-step invariants are atomic rather than relying on application timing.

## Security

- Never log passwords, tokens, secrets, session material, or other sensitive credentials.
- Never store plaintext passwords; use the project's established password hashing approach.
- Validate external input and avoid mass assignment of arbitrary client fields into persistence operations.
- Protect sensitive operations with server-side authentication and authorization.
- Return only data the caller is allowed to see.
- Treat file uploads as untrusted input and enforce the project's limits and storage rules.
- Use parameterized database access; avoid string-built SQL.
- Apply rate limiting to abuse-prone or sensitive endpoints when the project and threat model justify it.

## Testing

Prefer tests that exercise observable API behavior over tests coupled to internal implementation details. Vitest and Supertest are good examples when already used by the project, but follow the repository's runner and helpers.

For relevant endpoints, cover the cases that apply:

- happy path;
- invalid body/params/query;
- resource not found;
- missing authentication;
- insufficient authorization;
- important business rules;
- conflicts;
- persisted effects and side effects that are part of the contract.

Use integration tests for HTTP-to-persistence behavior when practical, and mock external boundaries only where isolation is useful. See `references/api-testing.md`.

## Quality gate

Before considering API work complete:

- run the project's lint command;
- run the project's typecheck command;
- run relevant tests and the full suite when appropriate;
- run the build when the project defines one;
- run Prisma validation/generation commands when applicable;
- review generated migrations and their data/cascade impact when schema changes exist;
- verify no credential or secret was added;
- verify authorization is enforced on the server;
- verify important error paths are covered and responses do not expose internals.

Use commands defined by the consuming repository; this skill does not prescribe package-manager scripts.

## References

Read only the references relevant to the task:

- `references/validation-and-errors.md` — runtime validation, request parsing, error contracts, and HTTP status mapping.
- `references/authentication-and-authorization.md` — identity, RBAC/permissions, ownership, tenant boundaries, and server-side enforcement.
- `references/prisma-and-transactions.md` — Prisma/PostgreSQL query design, constraints, transactions, concurrency, indexes, and raw SQL.
- `references/api-testing.md` — behavior-focused API testing, database isolation, fixtures, mocks, authorization, and persistence assertions.
