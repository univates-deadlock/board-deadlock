# Prisma, PostgreSQL, and transactions

Use the repository's current Prisma client lifecycle, model conventions, migration workflow, and database helpers. Optimize for correctness and clarity before adding abstraction.

## Query design

Keep each query's intent visible. Use `select` or `include` deliberately so the endpoint loads the relations and fields it actually needs. This is especially important for large relations and sensitive fields.

Watch for N+1 patterns such as loading a list and then querying the same relation once per row. Prefer a relation include/select, a suitable aggregate, or a batched query when it keeps the operation understandable.

Do not split one simple query into several service/repository methods only for architectural symmetry. Conversely, if the project already centralizes data access, extend that pattern rather than bypassing it.

## Nullability and relations

Prisma optionality and database `NULL` semantics matter. Distinguish:

- field omitted from an update;
- field explicitly set to `null`;
- relation absent;
- empty string or other sentinel values.

Review relation requirements and cascade behavior before schema changes or deletes. A cascade can be appropriate, dangerous, or surprising depending on ownership of related data.

## Constraints

Use database constraints for invariants the database can enforce reliably, such as uniqueness, required relations, foreign keys, and valid structural relationships. Application checks can improve error messages, but they do not replace constraints when concurrent requests can race.

Translate known constraint violations into the project's expected API errors. Do not expose Prisma error codes or raw database messages as the public contract unless the project explicitly standardized them.

## Transactions

Use a transaction when a business operation requires multiple reads/writes to commit atomically. Examples include moving value between records, creating a parent plus dependent state that must not exist partially, or checking and updating state under a consistency requirement.

Avoid transactions around a single ordinary write when no additional consistency guarantee is needed. Transactions add locking/contention and should stay short.

Do not put slow external calls such as email, object storage, third-party APIs, or long computation inside a database transaction. Commit database state first when safe, then coordinate external side effects using the project's established mechanism.

## Concurrency

A check-then-write sequence can race. When concurrent mutation matters, rely on appropriate uniqueness/foreign-key constraints, conditional updates, version fields, locking/isolation choices, or another established strategy rather than assuming requests execute sequentially.

If the chosen approach can produce transient serialization/deadlock errors, handle retries only where the project and operation can safely retry.

## Indexes

Consider indexes when endpoints introduce frequent filtering, joins, ordering, or lookup patterns that are not already supported. Confirm the columns and ordering against real query patterns. Every index has write/storage cost, so avoid speculative indexes added without a workload reason.

## Raw SQL

Prefer Prisma's query APIs when they express the operation clearly. Raw SQL is justified for database features, performance-critical queries, complex reporting, or operations Prisma cannot express reasonably.

When raw SQL is necessary:

- parameterize all untrusted values;
- avoid string concatenation/interpolation that changes SQL structure from client input;
- keep the query reviewable and tested;
- document why the normal Prisma client was insufficient when that reason is not obvious.
