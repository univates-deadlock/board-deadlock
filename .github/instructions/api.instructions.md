---
applyTo: "api/**"
---

Read `.github/skills/building-typescript-rest-apis/SKILL.md` and relevant references
for API changes and reviews.

- Validate external input with existing Zod schemas and return consistent status
  codes and error bodies. Keep HTTP concerns in controllers and business rules
  and persistence in services.
- Authorize using verified `res.locals.user`, never client-provided identity or
  role. Only ADMIN manages users; ADMIN and PLANNING manage clients.
- User deletion deactivates and revokes sessions; client deletion is logical.
  Preserve self-administration and last-active-admin protections.
- Inspect native Better Auth handlers when reviewing security changes. Preserve
  blocked public signup/profile mutation paths and the local `admin:create` flow.
- Protect sensitive fields, use existing password hashing and preserve transaction
  and concurrency guarantees. Never reset a database to fix setup.
- Follow the repository's Parcial 1 verification scope; do not add automated test
  infrastructure or require a nonexistent suite as a review condition.
