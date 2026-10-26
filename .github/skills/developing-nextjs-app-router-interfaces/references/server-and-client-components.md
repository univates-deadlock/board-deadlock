# Server and Client Components

Use the project's existing rendering architecture first. The goal is not to maximize either Server or Client Components; it is to place each responsibility on the side that actually needs it.

## Default reasoning

A component can remain a Server Component when it renders from props/server data and does not need client-only state, effects, browser APIs, event handlers, or a client-runtime-only dependency. Keeping such components on the server reduces unnecessary client JavaScript and keeps server-only concerns out of the browser bundle.

A Client Component is appropriate when the component needs capabilities such as:

- `useState`, `useReducer`, or client-side lifecycle/effect behavior;
- event handlers such as click, change, drag, or keyboard interaction;
- browser APIs such as `window`, `document`, storage, media queries, or observers;
- libraries that explicitly require a browser/client runtime;
- interactive state that must persist and update in the browser.

Do not add `"use client"` merely because the file renders JSX or imports another component.

## Boundaries and composition

`"use client"` creates a client boundary for that module and the client-side graph beneath it. Prefer a small interactive child inside a larger server-rendered tree when that keeps the responsibility clear.

Pass serializable data across Server-to-Client boundaries according to the project's patterns. Keep server-only credentials, filesystem/database access, and privileged code outside the client graph.

Composition is often better than widening a client boundary. A server-rendered page can prepare data and render a focused Client Component for the interactive part while leaving surrounding layout and content on the server.

## Avoid accidental client subtrees

Before marking a high-level layout, page shell, or large feature tree as client-side, identify the exact requirement forcing the boundary. If only one control needs browser state, isolate that control when practical.

Do not split components unnaturally solely to minimize every byte of client JavaScript. Preserve understandable component ownership and follow established project conventions.

## Hydration

Hydration problems usually indicate that server-rendered markup and the initial client render disagree. Common causes include:

- reading browser-only state during the initial render without an established guard;
- rendering non-deterministic values such as random values or current timestamps differently on server and client;
- locale/timezone differences that change initial output;
- invalid HTML nesting;
- client libraries mutating markup before hydration;
- conditional branches based on `window`/`document` during initial render.

Fix the source of the mismatch rather than silencing hydration warnings by default. Use hydration-suppression mechanisms only for intentional, understood differences that cannot reasonably be rendered consistently.

## Review questions

Before finalizing a boundary, ask:

1. What exact client-only capability requires this component to be client-side?
2. Can that capability live in a smaller child without making the design harder to understand?
3. Is any server-only data or secret crossing into the client bundle?
4. Does the initial client render match the server output?
5. Does the boundary follow the consuming project's established rendering strategy?
