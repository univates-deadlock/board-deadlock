# Prisma, PostgreSQL, and transactions

Use the repository's current Prisma client lifecycle, model conventions, migration workflow, and database helpers. Optimize for correctness and clarity before adding abstraction.

## Package setup and migrations

Before copying setup code, inspect the installed Prisma version, schema and configuration location, generator provider/output, generated client imports, database adapter, and ESM/module resolution. Use official documentation for that version when necessary; examples from another generator or major version may not match this application.

Install dependencies in the package that consumes them and update its corresponding lockfile, or follow the existing workspace's shared lockfile rules. A separate API and frontend need not share dependency ownership. Do not edit installed dependencies or generated client files manually.

Distinguish the operations in the repository's workflow:

- schema validation checks schema/configuration validity;
- client generation refreshes generated code;
- migration creation records a database change for review;
- migration application changes the target database.

Validation/generation alone do not apply a schema change. Use the owning package's scripts and version-appropriate commands; do not run reset or development migration commands against production. Preserve already-applied migrations, review generated SQL for data loss and cascade effects, and confirm the target environment before applying migrations. Report which operations actually ran.

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

Use a transaction when a business operation requires multiple reads/writes to commit atomically. Examples include moving value between records or checking and updating state under a consistency requirement.

A nested write already provides atomicity for supported related writes, such as creating a parent with dependent records. Use an interactive transaction when reads and subsequent decisions/writes need to share a transaction, or the operation cannot be expressed as an appropriate nested/batch write. Do not add a transaction wrapper merely for symmetry. Confirm any isolation/locking requirement separately; atomic writes alone do not resolve every concurrency invariant.

Avoid transactions around a single ordinary write when no additional consistency guarantee is needed. Transactions add locking/contention and should stay short.

Do not put slow external calls such as email, object storage, third-party APIs, or long computation inside a database transaction. Keep password hashing and other expensive computation outside when possible without weakening the operation's invariant. Commit database state first when safe, then coordinate external side effects using the project's established mechanism.

## Concurrency

A check-then-write sequence can race. When concurrent mutation matters, rely on appropriate uniqueness/foreign-key constraints, conditional updates, version fields, locking/isolation choices, or another established strategy rather than assuming requests execute sequentially.

If the chosen approach can produce transient serialization/deadlock errors, handle retries only where the project and operation can safely retry.

Verify how conflicts reach the application error layer and whether a retry could duplicate external effects. Do not impose automatic retries, `Serializable`, or SQL locks on every operation.

## Indexes

Consider indexes when endpoints introduce frequent filtering, joins, ordering, or lookup patterns that are not already supported. Confirm the columns and ordering against real query patterns. Every index has write/storage cost, so avoid speculative indexes added without a workload reason.

## Raw SQL

Prefer Prisma's query APIs when they express the operation clearly. Raw SQL is justified for database features, performance-critical queries, complex reporting, or operations Prisma cannot express reasonably.

When raw SQL is necessary:

- parameterize all untrusted values;
- avoid string concatenation/interpolation that changes SQL structure from client input;
- keep the query reviewable and tested;
- document why the normal Prisma client was insufficient when that reason is not obvious.
