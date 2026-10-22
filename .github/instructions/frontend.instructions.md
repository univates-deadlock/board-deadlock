---
applyTo: "frontend/**"
---

Read `.github/skills/developing-nextjs-app-router-interfaces/SKILL.md` and relevant
references for Next.js changes and reviews.

- Reuse existing components, tokens, layouts, schemas and API/auth clients.
- Prefer Server Components; add client boundaries for actual browser behavior.
- Keep public `NEXT_PUBLIC_API_URL` separate from server-only `API_INTERNAL_URL`.
  Never place authentication secrets in browser bundles.
- Preserve credentialed browser requests and SSR cookie forwarding. Hidden UI
  controls never replace authorization in the API.
- Handle loading, empty, validation, error and submitting states where relevant.
  Preserve labels, keyboard access, focus management and responsive layouts.
- Follow the repository's Parcial 1 verification scope and report browser-check
  limitations instead of claiming static checks establish interactive behavior.
