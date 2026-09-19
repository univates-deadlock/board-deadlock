# Data fetching and API integration

Choose fetching based on the screen's rendering and interaction needs, then align it with the project's existing architecture. Do not introduce a fetching library merely because it is familiar.

## Server-side fetching

Server-side fetching is often appropriate when data is needed for the initial render, can be obtained securely on the server, and does not require browser-driven refresh behavior. It can also keep credentials and internal service access out of the client bundle.

When several independent requests are needed, avoid serial waterfalls that have no data dependency. Start independent work together when the project's implementation style permits it.

## Client-side fetching

Client-side fetching is appropriate when requests are driven by browser interaction or client state, such as user-selected filters, polling already established by the application, incremental interaction, or a client-only data source.

Do not default to `useEffect` plus local state for every request. First inspect whether the project already has a client data layer, route-level server fetching, a mutation pattern, or a reusable hook that addresses the need.

## Loading and errors

Choose loading UI at the boundary where the user actually waits. Depending on the project, that may be a route loading state, Suspense boundary, local component state, or an existing data library's status model.

Errors should produce useful UI rather than only console output. Distinguish recoverable request errors from authorization failures and missing data when the product behavior differs. Add retry behavior only when retrying is meaningful and consistent with the project.

## Caching and revalidation

Caching is a correctness decision as well as a performance decision. Before changing cache or revalidation behavior, determine:

- how fresh the data must be;
- whether the request is user-specific;
- whether mutations must invalidate or refresh it;
- what the consuming project already does for equivalent data.

Do not add caching, disable it globally, or choose a revalidation interval without understanding these constraints.

## Avoid duplicate requests

Search for existing server loaders, API clients, hooks, context, and route-level data before introducing another request. Avoid fetching the same resource independently in parent and child components when one owner can provide the required data without creating worse coupling.

## API clients and service configuration

When the project centralizes HTTP behavior, reuse that boundary for base URLs, headers, credentials, serialization, error normalization, and request policies. Do not scatter hard-coded service URLs through components.

Use environment variables according to the project's conventions. Treat any value exposed to browser code as public. Never place database credentials, API secrets, private tokens, or privileged internal configuration in variables intentionally shipped to the client.

## Contracts and validation

Type request/response contracts when practical, preferably from an existing shared type/schema source when the project has one. Do not pretend static TypeScript types validate untrusted runtime data.

Frontend validation exists for usability and fast feedback. The backend remains responsible for authorization, trust boundaries, and authoritative validation.

## UI state versus server data

Keep remote authoritative data distinct from temporary UI state such as open panels, draft input, optimistic affordances, or selected tabs. Do not copy server data into local state without a reason; duplicated sources of truth create synchronization bugs.

## Review questions

- Is the request running on the correct side for its security and interaction needs?
- Are loading, error, empty, and authorization states represented where relevant?
- Could independent requests run without an unnecessary waterfall?
- Is the request duplicated elsewhere?
- Are cache/revalidation semantics intentional?
- Are service URLs centralized where the project expects them?
- Could any secret or privileged configuration reach the browser?
