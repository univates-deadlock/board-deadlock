# TechPro Copilot instructions

Follow `AGENTS.md` and the closest existing implementation. Read
`docs/documento-requisitos.md` for business scope, `README.md` for setup and
`api/README.md` for the implemented API. Check that referenced documents exist;
do not infer implemented endpoints from Prisma models or planned requirements.

## Architecture and scope

- `api/`: Express 5, TypeScript, Zod, Prisma, PostgreSQL and Better Auth.
- `frontend/`: Next.js App Router, React, TypeScript and Tailwind CSS.
- Use Node.js 24 and npm, with separate package lockfiles. Install dependencies
  in the consuming package, never in the root or the unrelated `api/frontend/`.
- Preserve the route → middleware → controller/schema → service → Prisma flow.
- Keep the existing stock/work-order system separate. Avoid unrequested features,
  frameworks, dependencies and unrelated refactors.
- Never edit dependencies, generated Prisma output, `api/dist/` or `frontend/.next/`.

## Skills

Read the matching skill and relevant linked references before changing or
reviewing its area:

- API routes, validation, authentication, permissions and persistence:
  `.github/skills/building-typescript-rest-apis/SKILL.md`.
- Next.js pages, React components, forms, API integration and accessibility:
  `.github/skills/developing-nextjs-app-router-interfaces/SKILL.md`.

These are copies of the repository skills in `.agents/skills/` and
`.claude/skills/`. Keep all three installations, including references, synchronized
when updating a skill.

## Review priorities

Review the PR's changes for concrete defects and regressions. Prioritize broken
behavior, server-side authorization, credential exposure, validation, data
integrity, cookie-session integration, accessibility and responsive behavior.
Check native Better Auth endpoints as well as application-owned routes when a
security policy changes. Explain the triggering case and impact of each finding.
Do not report subjective style preferences, request unrelated refactors, or flag
pre-existing issues unless the change worsens or depends on them.

## Verification

For Parcial 1, automated tests are outside the delivery scope. Do not request a
test suite solely because a test command or runner exists. Preserve CI's lint,
TypeScript and build gates (`npm run check`). Verify affected behavior in an
isolated environment with fictitious data when possible and report limitations.
For Prisma schema changes, validate and generate using the API scripts; apply
versioned migrations without resetting a database or rewriting applied migrations.
Never expose secrets in code, logs, review comments or command output.
