# Claude Code instructions

Follow [AGENTS.md](AGENTS.md) for project context, commands, architecture, verification scope, and working rules. Read `README.md` for setup and `api/README.md` plus `docs/api-usuarios.md` for the implemented authentication and user API. Use `docs/documento-requisitos.md` for intended product requirements; inspect code before assuming a feature exists from its Prisma model.

Current delivery: Better Auth email/password login and cookie sessions, ADMIN-only user CRUD with logical deletion, and initial administrator provisioning. The frontend still has the default Next.js page and an auth client. Do not expand this task to the institutional site or other CRUDs without a request.

Use the matching project skill before working in these areas:

- `.claude/skills/building-typescript-rest-apis/SKILL.md` for API, validation, authentication, Prisma, and API tests.
- `.claude/skills/developing-nextjs-app-router-interfaces/SKILL.md` for Next.js pages, React components, forms, API integration, and accessibility.

Read relevant linked references rather than imposing a new architecture: Express request flow, verified identity context, native authentication routes, Prisma/migration setup, verification scope, and browser/SSR cookie integration. Preserve the existing route/controller/schema/service organization and reuse `res.locals.user` for verified caller identity.

Use Node.js 24 and npm in the package that owns each change. API and frontend have separate manifests and lockfiles. Follow the explicit Parcial 1 scope: no automated test suite is required for this delivery; run applicable lint, types, builds, and safe functional checks, and disclose unverified behavior. Never commit `.env`, credentials, cookies, generated output, or unrelated local installation artifacts.

The `.claude/skills/` and `.agents/skills/` installations should remain synchronized. User instructions and the current task scope take precedence over generic skill defaults.
