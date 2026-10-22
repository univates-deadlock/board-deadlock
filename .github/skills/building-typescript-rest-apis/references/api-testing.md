# API testing

Test the contract a caller can observe. Vitest and Supertest are useful examples for Node/Express projects, but use the consuming repository's runner, app bootstrap, fixtures, and database helpers.

## Choose verification for the request

Inspect the user's explicit scope, repository instructions/CI gates, applicable commands, and actual test files. A test script or installed runner is not evidence that a suite exists. If automated tests are requested or an existing suite applies, follow its runner and helpers, run relevant tests and broader checks as appropriate, and extend behavior coverage when within scope.

If the user explicitly excludes automated tests, run applicable lint, typecheck, and build commands, and check schema/migrations when the change affects them. Exercise affected HTTP and persistence behavior in an isolated environment with fictitious data where feasible: status/body, authorization failures, writable fields, and persisted effects. For session changes, include relevant alternate mutation paths and concurrent lifecycle behavior. Preserve existing CI gates and do not introduce test infrastructure solely because this reference lists testing techniques.

Record scenarios, commands, actual results, and limitations. Manual HTTP exercises are not an automated suite. State when no suite was run, a command is unavailable, or sandbox/environment restrictions prevent a check; do not claim an unexecuted command passed. Static checks alone do not prove endpoint behavior.

Use temporary/test environments and fictitious credentials for either verification mode. Never use production data or real user credentials, or reset/truncate a database without appropriate authorization and a confirmed disposable target.

## What to test

For an endpoint, choose cases from the actual contract rather than mechanically duplicating the same matrix everywhere:

- successful request and response shape/status;
- invalid body, params, or query;
- missing target resource;
- unauthenticated request when protected;
- authenticated caller without required permission/ownership;
- business-rule rejection;
- uniqueness or state conflict;
- persisted state after a successful mutation;
- absence of forbidden side effects after a failed mutation.

For list/search endpoints, also cover important filtering, pagination, sorting, tenant scoping, and empty-result behavior when those are part of the contract.

## Integration level

When practical, exercise the real HTTP application and real persistence boundary together. This catches route registration, middleware order, validation, authorization, serialization, Prisma behavior, and status mapping that isolated unit tests can miss.

Use smaller unit tests for complex pure business logic where they improve diagnosis, but do not replace endpoint behavior tests with assertions about which internal function was called.

## Test database

Use the repository's dedicated test database strategy. Tests must not depend on production or developer data.

Keep tests isolated and repeatable by using the project's preferred approach, such as transaction rollback, truncation/reset, disposable databases, or carefully scoped fixtures. Avoid order-dependent tests.

Create only the data relevant to each behavior. Named fixture/build helpers can reduce noise, but do not hide the important authorization or state setup behind opaque defaults.

## Authentication and authorization cases

Protected endpoints deserve explicit negative tests. A passing happy-path test with an authenticated admin does not prove ordinary users are protected.

Where relevant, test:

- no credentials;
- invalid/expired credentials if the application owns that behavior;
- valid user without permission;
- valid user who owns the resource;
- valid user who does not own the resource;
- tenant/organization boundary violations.

Assert that denied mutations did not change persisted state.

## Mocks

Mock boundaries that are expensive, nondeterministic, or outside the service, such as email providers, payment APIs, queues, or object storage, when the repository does not provide a safe local substitute.

Avoid mocking Prisma or internal functions by default in endpoint integration tests; doing so can make a test pass while the real query, relation, constraint, or transaction is broken.

If a mock is used, assert the behavior that matters to the API rather than mirroring implementation call order unnecessarily.

## Failure quality

Assert stable contract details: status, response shape, error code/message fields that are intentionally public, and persisted outcome. Avoid asserting stack traces, raw database errors, exact validation-library internals, timestamps, generated IDs, or other unstable details unless they are part of the documented contract.
