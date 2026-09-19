# Agent instructions

## Project

TechPro is an internal web app for managing the client → quote → service/visit workflow. Read `docs/documento-requisitos.md` for product scope and business rules, and `README.md` for local setup. The requirements describe the intended product, not the current implementation: the API currently has only `GET /health`, the Prisma schema has no business models, and the frontend is still the default Next.js page.

## Repository

- `frontend/`: Next.js App Router, React, TypeScript, Tailwind CSS.
- `api/`: Express, TypeScript, Zod, Prisma, PostgreSQL.
- `docs/`: client context and product requirements.
- `.github/workflows/ci.yml`: CI checks.

Use Node.js 24 and npm. The API and frontend have separate lockfiles. From the repository root, install dependencies with `npm run install:all`, run the stack with `docker compose up --build`, and run all checks with `npm run check`. After Prisma schema changes, run `npm run db:validate --prefix api` and `npm run db:generate --prefix api` with `DATABASE_URL` configured.

## Working rules

- Check the relevant requirements and nearby code before editing. Keep changes focused and update docs when behavior or setup changes.
- Validate API inputs and enforce authentication and role permissions on the server. Do not log secrets or sensitive data.
- Keep the frontend accessible and responsive; use Client Components only where client-side behavior is needed.
- Add meaningful tests for new behavior. Run the checks relevant to the change and report anything you could not run.
- Do not edit generated output (`api/generated/`, `api/dist/`, `frontend/.next/`) or dependencies. Preserve unrelated and untracked user files.
- The existing stock and official work-order system remains separate. Do not add integrations or out-of-MVP features unless requested.

## Project skills

- Read `.agents/skills/building-typescript-rest-apis/SKILL.md` when creating, changing, or reviewing API endpoints, validation, authentication, Prisma persistence, or API tests.
- Read `.agents/skills/developing-nextjs-app-router-interfaces/SKILL.md` when creating, changing, or reviewing Next.js pages, React components, forms, API integration, or interface accessibility.
