# Agent instructions

## Project

TechPro is an internal web app for managing the client → quote → service/visit workflow. Read `docs/documento-requisitos.md` for product scope and business rules, `README.md` for local setup, and `api/README.md` plus `docs/api-usuarios.md` for the implemented API contract.

The API implements `GET /api/health`, email/password authentication and cookie sessions with Better Auth, and ADMIN-only user management at `/api/users`. User deletion is logical deactivation and revokes sessions. A local `admin:create` script provisions the first administrator. The Prisma schema includes business models and versioned migrations; model presence does not establish that other CRUD endpoints exist. The frontend is still the default Next.js page with an authentication client; the institutional page, login screens, and second CRUD are separate tasks.

## Repository

- `frontend/`: Next.js App Router, React, TypeScript, Tailwind CSS.
- `api/`: Express, TypeScript, Zod, Prisma, PostgreSQL.
- `docs/`: client context and product requirements.
- `.github/workflows/ci.yml`: CI checks.

Use Node.js 24 and npm. The API and frontend have separate lockfiles. From the repository root, install dependencies with `npm run install:all`, run the stack with `docker compose up --build`, and run all checks with `npm run check`. After Prisma schema changes, run `npm run db:validate --prefix api` and `npm run db:generate --prefix api` with `DATABASE_URL` configured.

Install dependencies in the consuming package (`--prefix api` or `--prefix frontend`), not in the repository root or `api/frontend/`. Configure `api/.env` from the example and provide `BETTER_AUTH_SECRET` with at least 32 characters. Apply existing migrations with `npm run db:migrate --prefix api`; never reset a database or rewrite applied migrations to fix setup. See `api/README.md` for administrator provisioning and Docker/host commands.

The API request flow follows routes → authentication/authorization middleware → controllers and Zod schemas → services → Prisma. Keep HTTP concerns in controllers and business rules/persistence in services. Reuse the verified identity context in `res.locals.user`; never authorize from client-provided identity or role. Inspect native Better Auth endpoints as well as application routes when changing user/security policies.

## Working rules

- Check the relevant requirements and nearby code before editing. Keep changes focused and update docs when behavior or setup changes.
- Validate API inputs and enforce authentication and role permissions on the server. Do not log secrets or sensitive data.
- Keep the frontend accessible and responsive; use Client Components only where client-side behavior is needed.
- For Parcial 1, automated tests are explicitly outside the requested delivery scope. `npm run check` and CI run lint, TypeScript, and builds; the API test command exists but no automated suite is present. Verify affected behavior in an isolated environment with fictitious data, including permissions and errors, and report what was run and any limitations. For later work where automated tests are in scope, add meaningful behavior tests and run the applicable suite. Preserve required CI gates unless their change is authorized.
- Do not edit generated output (`api/generated/`, `api/dist/`, `frontend/.next/`) or dependencies. Preserve unrelated and untracked user files.
- The existing stock and official work-order system remains separate. Do not add integrations or out-of-MVP features unless requested.

## Project skills

- Read `.agents/skills/building-typescript-rest-apis/SKILL.md` when creating, changing, or reviewing API endpoints, validation, authentication, Prisma persistence, or API tests.
- Read `.agents/skills/developing-nextjs-app-router-interfaces/SKILL.md` when creating, changing, or reviewing Next.js pages, React components, forms, API integration, or interface accessibility.

Use each skill's linked references when relevant, especially Express assembly, library authentication, Prisma migrations, verification scope, and cookie-session integration. The matching `.claude/skills/` copies serve Claude Code; keep both installations synchronized when updating skills.
