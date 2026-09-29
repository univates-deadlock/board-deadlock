/**
 * Frontend validation schemas, mirroring the API schemas.
 *
 * Validation gives users immediate feedback without a network request.
 * The server remains authoritative: the API validates all inputs again
 * using the schemas in `api/src/schemas/`.
 *
 * Zod is used instead of a standalone regex because the API uses `z.email()`,
 * which checks email rules such as dot placement, alphabetic TLDs, and length
 * limits. A permissive regex could accept addresses the API rejects, leaving
 * users waiting for a request before discovering the error.
 */
import { z } from "zod";

/**
 * Email field.
 *
 * Uses the same chain as `api/src/schemas/user.schema.ts`:
 * `trim().toLowerCase()` normalizes before validation, `max(254)` enforces the
 * RFC length limit, and `z.email()` checks the format. Messages are in Portuguese
 * for display in the interface; the API supplies its own errors when needed.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-mail muito longo.")
  .pipe(z.email("Informe um e-mail válido."));

/** Login form. */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha."),
});

/** Schema-derived type keeps the form aligned with validation. */
export type LoginInput = z.infer<typeof loginSchema>;
