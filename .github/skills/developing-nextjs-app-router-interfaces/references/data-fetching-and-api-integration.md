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

For separate applications, inspect their package manifests, lockfiles/workspace setup, and configuration boundaries. A browser needs a publicly reachable API URL; SSR or a container may use a different internal URL. Keep internal addresses and privileged configuration server-only. Reuse the existing API/auth client rather than importing the backend's authentication configuration into frontend code or adding another fetching library.

## Cookie sessions with a separate API

Apply this section only when the project uses cookie sessions; preserve token or other authentication integrations when present.

For browser requests to a different origin, configure the existing client to send credentials: `credentials: "include"` for fetch, or `withCredentials: true` for Axios. These options do not override cookie restrictions or replace CSRF protection. Prefer the existing authentication client's supported session, login, and logout methods over a parallel hand-written flow.

An adaptable browser fragment using an already-configured public API base URL:

```ts
const response = await fetch(new URL("/api/session", publicApiBaseUrl), {
  credentials: "include",
});
```

Use the project's actual endpoint, response handling, and URL composition. The leading slash in this fragment resolves from the origin root; preserve any required API base-path prefix in the existing client.

Check the deployment as a whole:

- browser/frontend and API hosts, origins, protocol, and backend trusted origins;
- credentialed CORS with an explicit permitted origin and credentials support;
- cookie host/domain, path, `SameSite`, `Secure`, `HttpOnly`, and expiry;
- the established origin/CSRF mechanism for mutations;
- login, expiry, logout/revocation, `401` for unusable authentication, and `403` for denied access according to the API contract.

Different origins are not necessarily different sites. Diagnose the actual cookie and origin policy rather than loosening it or disabling CSRF/CORS to make a request pass. Credentials cannot make a cookie available to a host outside its scope.

## SSR and incoming credentials

A server-side fetch does not automatically forward the browser's incoming cookies; `credentials: "include"` alone is insufficient. Inspect the project's supported server auth helper, incoming-cookie access, or trusted proxy/BFF mechanism. Use version-appropriate Next.js APIs when needed. A cookie scoped only to the API host may never arrive at the frontend server, so verify availability before attempting to forward it.

Forward only the credentials intended for the configured, trusted backend through the established mechanism. Do not send the entire incoming cookie header to arbitrary/request-supplied URLs or allow redirects to leak credentials. Keep user-specific session data isolated from shared caches. Server-side login/logout flows must also propagate intended cookie changes to the browser using the project's supported response mechanism; receiving backend `Set-Cookie` alone does not update the browser.

See [Next.js cookie access](https://nextjs.org/docs/app/api-reference/functions/cookies),
[fetch credentials](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials),
and [Axios request configuration](https://axios-http.com/docs/req_config) for the
APIs in the installed versions.

## Contracts and validation

Type request/response contracts when practical, preferably from an existing shared type/schema source when the project has one. Do not pretend static TypeScript types validate untrusted runtime data.

For additional session fields that the default auth client does not type, use its supported inference/extension mechanism or validate the returned shape at the existing boundary. Do not use a cast as proof that a role or other custom field exists. Expose only permitted session data to client components; the server remains authoritative for authorization.

Handle custom API envelopes and documented native auth-library errors according to their existing contracts. Adapt them at the existing consumer boundary when useful rather than forcing a backend normalization layer.

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
- If cookie sessions apply, do browser credentials, cookie policy, and trusted SSR forwarding match the actual deployment?
- Are expiry, logout, `401`/`403`, and additional session fields handled according to the existing contract?
- Could any secret or privileged configuration reach the browser?
