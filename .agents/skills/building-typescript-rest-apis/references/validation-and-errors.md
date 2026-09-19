# Validation and error handling

Validate at trust boundaries and keep expected client errors distinct from unexpected server failures. Match the consuming project's response envelope and status-code conventions before inventing a new format.

## Runtime validation

TypeScript types disappear at runtime. Values from HTTP requests, environment variables, queues, files, webhooks, and third-party APIs remain untrusted until validated.

When Zod is already used, define schemas close to the boundary or in the repository's established schema location. Reuse schemas where the same contract is genuinely shared; do not create one giant schema module for unrelated endpoints.

Validate the portions that matter independently when useful:

- `params`: identifiers and route variables;
- `query`: filters, pagination, sorting, flags, dates;
- `body`: writable fields and nested structures;
- configuration/environment: required values and allowed formats at startup or configuration load time.

Be deliberate about coercion. Query and path values usually arrive as strings. Convert numbers, booleans, and dates only when the API contract says that conversion is valid, and reject ambiguous values rather than guessing.

If the validation library can infer TypeScript types from schemas, prefer inference when it avoids maintaining the same contract twice. Separate domain types are still appropriate when validated transport input is transformed into a different internal concept.

## Useful validation responses

A client should be able to identify what it can fix. Prefer stable, structured validation errors if the project already has an error envelope, for example a machine-readable code plus field/path details. Avoid leaking raw library internals when they would couple clients unnecessarily to Zod or another validator.

Do not turn malformed input into an internal server error. Conversely, do not label unexpected programming/database failures as validation failures merely to return a `4xx` status.

## Status mapping

Follow existing project semantics first. Common mappings are:

| Situation | Typical status |
| --- | --- |
| Malformed or invalid request input | `400 Bad Request` (or the project's established `422` convention) |
| Missing/invalid authentication | `401 Unauthorized` |
| Authenticated but not allowed | `403 Forbidden` |
| Resource does not exist | `404 Not Found` |
| Uniqueness/state/business conflict | `409 Conflict` |
| Unexpected server failure | `500 Internal Server Error` |

Use a conflict response when the request is structurally valid but cannot be applied because of current persisted state, uniqueness, versioning, or a comparable invariant. Do not use `409` as a catch-all for arbitrary validation errors.

## Expected vs unexpected errors

Expected errors should be represented in a way the existing HTTP error layer can map predictably. Examples include not-found, conflict, authorization failure, or a known business-rule violation.

Unexpected errors should retain diagnostic context for logs while returning a safe client response. Log enough context to investigate the operation, but redact credentials, tokens, passwords, and sensitive payload fields.

A catch block should have a purpose: translate a known error, add meaningful context, perform cleanup, or intentionally recover. Avoid `catch` blocks that swallow errors or convert every failure into the same generic response.

## Database errors

Map only database errors whose meaning is known and stable for the operation. For example, a unique constraint can represent a client-visible conflict, while a connection failure remains an internal error. Do not expose database error text, constraint internals, SQL, or stack traces directly to clients.
