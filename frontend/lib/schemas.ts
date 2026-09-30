/**
 * Frontend validation schemas, mirroring the API schemas.
 *
 * Validation gives users immediate feedback without a network request.
 * The server remains authoritative: the API validates all inputs again
 * using the schemas in `api/src/schemas/` (see RNF02).
 *
 * Zod is used instead of standalone regexes because the API also uses
 * `z.email()`, which checks rules such as dot placement, alphabetic TLDs,
 * and length limits. A permissive regex could accept addresses the API
 * rejects, leaving users waiting for a request before discovering the error.
 */
import { z } from "zod";

/**
 * Email field.
 *
 * Uses the same chain as `api/src/schemas/user.schema.ts`:
 * `trim().toLowerCase()` normalizes before validation, `max(254)` enforces the
 * RFC length limit, and `z.email()` checks the format.
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

/* ==========================================================================
   Users — mirrors api/src/schemas/user.schema.ts
   ========================================================================== */

/** User creation form. */
export const userSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(200, "Máximo de 200 caracteres."),
  email: emailSchema,
  role: z.string().refine((v) => v === "ADMIN" || v === "PLANNING" || v === "TECHNICIAN", {
    message: "Selecione um perfil.",
  }),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(128, "Máximo de 128 caracteres."),
});

export type UserInput = z.infer<typeof userSchema>;

/** User edit form (no password — update is partial). */
export const userEditSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome.")
    .max(200, "Máximo de 200 caracteres."),
  email: emailSchema,
  role: z.string().refine((v) => v === "ADMIN" || v === "PLANNING" || v === "TECHNICIAN", {
    message: "Selecione um perfil.",
  }),
});

export type UserEditInput = z.infer<typeof userEditSchema>;

/* ==========================================================================
   Clients — mirrors api/src/schemas/client.schema.ts
   ========================================================================== */

export const clientTypeSchema = z.enum(["INDIVIDUAL", "COMPANY"]);

/**
 * Brazilian document: CPF (11 digits) for individuals, CNPJ (14) for companies.
 *
 * The field is stored as digits once the mask is stripped, so the length is
 * what decides validity. An empty document is allowed (the API marks it
 * optional), but a partially typed one is not.
 */
export const documentSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d+$/.test(value), {
    message: "Informe apenas números.",
  })
  .refine((value) => value === "" || value.length === 11 || value.length === 14, {
    message: "O documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.",
  });

/** Phone or WhatsApp: 8 to 20 digits once the mask is stripped. */
export const phoneSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d+$/.test(value), {
    message: "Informe apenas números.",
  })
  .refine((value) => value === "" || (value.length >= 8 && value.length <= 20), {
    message: "Informe um telefone válido com DDD.",
  });

/**
 * Client form.
 *
 * Field limits match `api/src/schemas/client.schema.ts` so the UI never
 * submits something the API would reject for length.
 */
export const clientSchema = z.object({
  type: clientTypeSchema,
  name: z.string().trim().min(1, "Informe o nome do cliente.").max(200, "Máximo de 200 caracteres."),
  document: documentSchema,
  contactName: z.string().trim().max(200, "Máximo de 200 caracteres."),
  phone: phoneSchema,
  whatsapp: phoneSchema.refine((value) => value !== "", {
    message: "Informe o WhatsApp.",
  }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(100, "Máximo de 100 caracteres.")
    .pipe(z.union([z.email("Informe um e-mail válido."), z.literal("")]))
    .transform((email) => (email === "" ? null : email))
    .nullable()
    .optional(),
  location: z.string().trim().min(1, "Informe o local de atendimento.").max(100, "Máximo de 100 caracteres."),
  notes: z.string().trim(),
});

export type ClientInput = z.infer<typeof clientSchema>;
