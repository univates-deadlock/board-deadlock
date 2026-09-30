import { z } from "zod";

export const clientTypeEnum = z.enum(["INDIVIDUAL", "COMPANY"]);

const clientFields = {
  type: clientTypeEnum,
  name: z.string().trim().min(1, "Informe o nome").max(200),
  document: z.string().trim().max(20).nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  contactName: z.string().trim().max(200).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  whatsapp: z.string().trim().min(8, "Informe o WhatsApp").max(20),
  location: z.string().trim().min(1, "Informe a localização").max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(100)
    .pipe(z.union([z.email("Email inválido"), z.literal("")]))
    .transform((email) => email === "" ? null : email)
    .nullable()
    .optional(),
};

export const clientIdSchema = z.string().trim().uuid("Identificador do cliente inválido");

export const createClientSchema = z.strictObject(clientFields);

export const updateClientSchema = z
  .strictObject(clientFields)
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Informe pelo menos um campo para atualizar" }
  );

export const createClientBodySchema = z.strictObject({ clientData: createClientSchema });
export const updateClientBodySchema = z.strictObject({ clientData: updateClientSchema });

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
