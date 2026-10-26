---
name: developing-nextjs-app-router-interfaces
description: Use when creating, modifying, reviewing, or refactoring Next.js App Router interfaces or React components inside a Next.js application, especially pages and layouts, Server/Client Component boundaries, data-driven UI, forms, API integration, responsive behavior, or accessibility.
---

# Developing Next.js App Router Interfaces

## Core principle

Preserve the project's existing frontend architecture and conventions before introducing new abstractions.

Understand the current components, tokens, styling, rendering, data fetching, state, forms, breakpoints, and UI-state conventions before deciding how to implement.

## Before changing code

1. Read `AGENTS.md`, `CLAUDE.md`, or equivalent instructions.
2. Locate the frontend package, scripts, lockfile/workspace setup, and environment configuration; inspect the App Router structure, layouts, nearby pages, reusable components, design tokens, global styles, breakpoints, forms, API/auth clients, and fetching/state patterns.
3. Check existing loading, empty, error, unauthorized, and success states.
4. Find the closest existing pattern and reuse or extend it before creating a parallel convention.

## Server vs Client Components

- Prefer Server Components when client-only behavior is unnecessary.
- Add `"use client"` only for real client needs: hooks such as `useState`, `useEffect`, or `useReducer`, event handlers, browser APIs, or client-runtime-only libraries.
- Keep client boundaries focused when practical instead of converting large subtrees by habit.
- Follow intentional project-specific rendering patterns rather than treating these as absolute rules.

Read `references/server-and-client-components.md` for boundaries, composition, hydration, and common mistakes.

## Component design

- Reuse compatible existing components.
- Prefer composition and clear responsibilities over highly generic abstractions.
- Extract repeated or stable patterns; keep one-off composition local.
- Keep props understandable and avoid giant components with unrelated responsibilities.
- Address prop drilling only when it becomes a real problem; do not add global state management without need.

## App Router

Use `page.tsx`, `layout.tsx`, nested layouts, route groups, dynamic routes, metadata, `loading.tsx`, `error.tsx`, and `not-found.tsx` when they fit the route and existing conventions. Do not add App Router features mechanically or reorganize routes without a reason.

## Data fetching

Use the established project approach. Fetch on the server when appropriate for initial rendering; fetch on the client when browser interaction/state requires it. Do not use `useEffect` as the default for every request. Handle loading/errors, avoid duplicate requests and unnecessary waterfalls, and make caching/revalidation choices consciously.

Read `references/data-fetching-and-api-integration.md`.

## API integration

Reuse centralized HTTP/API configuration and the existing authentication client when present. Distinguish browser-reachable public API URLs from server-only internal URLs. Never import backend authentication configuration or secrets into a client bundle. Type contracts when practical, handle failures according to their existing format, and remember that frontend validation does not replace backend validation.

For a separate API using cookie sessions, inspect browser credential settings, cookie/origin policy, and the project's SSR credential forwarding mechanism; server requests do not automatically inherit incoming session cookies. Preserve other authentication approaches when used. See `references/data-fetching-and-api-integration.md` for details.

## Forms

Use semantic controls and labels. Represent validation, submitting, error, and success states explicitly; prevent accidental double submission; preserve keyboard operation and entered data after recoverable errors; manage focus after errors when appropriate; and keep feedback understandable.

Read `references/forms-and-ui-states.md`.

## UI states

For data-dependent screens, consider the states that actually apply: initial, loading, success, empty, validation error, server error, unauthorized/forbidden, disabled, submitting, and success feedback. Do not implement only the happy path.

## Responsive design

Preserve the project's responsive strategy and tokens. Validate mobile and desktop behavior, fluid layout, long content, touch targets, navigation, forms, tables, and horizontal overflow at the viewports relevant to the consuming project.

Read `references/responsive-interface-design.md`.

## Accessibility

Use native semantics before ARIA. Keep headings, labels, keyboard navigation, and visible focus correct; use buttons for actions and links for navigation; add ARIA only when native semantics are insufficient; handle accessible names and focus for dialogs, menus, forms, images, and icons; respect `prefers-reduced-motion` when motion exists.

Read `references/accessibility.md`.

## Styling

Follow the styling strategy already in use, whether Tailwind, CSS Modules, plain CSS, or another approach. Prefer existing tokens to arbitrary values, avoid unnecessary inline styles and duplication, and do not introduce or replace a styling system during an ordinary feature.

## Performance

Avoid unnecessary Client Components, artificial re-renders, oversized client dependencies, and careless imports. Use appropriate image handling. Do not add memoization or other optimizations without a demonstrated need.

## Testing and verification

Use the owning package's existing tools and the user's explicit scope. Run applicable lint, typecheck, and build commands. If an automated suite applies, run it; a manifest test script or installed runner alone does not establish that test files exist. If the user excludes automated tests, perform applicable static checks and safe behavior verification, and report that no automated suite was run. Preserve existing CI gates and do not add test infrastructure solely for this skill.

Validate in a browser when feasible: relevant viewports, keyboard interaction, loading/error/empty and session states, console output, hydration warnings/errors, and reduced-motion behavior when applicable. Use isolated environments and fictitious data/credentials. Report executed commands, results, and browser or environment limitations; static checks do not establish that interaction works.

## Quality gate

Before considering the frontend complete, verify:

- existing architecture and conventions remain coherent;
- the Server/Client boundary is intentional;
- compatible existing components were reused;
- relevant UI states are covered;
- accessibility, keyboard, and responsive behavior work;
- no service URL or secret is inappropriately hard-coded;
- applicable lint, typecheck, build, and automated checks pass according to the verification scope above, or their limitations are reported;
- browser behavior and relevant warning, error, or hydration issues are checked when feasible, with any unverified behavior disclosed.

## Scope boundary

Use this skill for React/Next.js work using the App Router. For framework-free HTML, CSS, and vanilla JavaScript interfaces, use `developing-vanilla-web-interfaces`. Shared principles may overlap, but React rendering, Server/Client boundaries, and App Router behavior belong here.

## References

- `references/server-and-client-components.md` — boundaries, composition, hydration, and client-runtime requirements.
- `references/data-fetching-and-api-integration.md` — fetching, API/auth clients, public/internal URLs, cookie sessions and SSR forwarding, caching, contracts, and errors.
- `references/forms-and-ui-states.md` — form behavior, validation, submission, errors, empty states, success, and focus.
- `references/accessibility.md` — semantics, keyboard, focus, forms, dialogs, menus, ARIA, and motion.
- `references/responsive-interface-design.md` — fluid layouts, navigation, forms, tables, overflow, long content, and touch behavior.
