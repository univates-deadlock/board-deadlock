import { z } from "zod";

const userFields = {
  name: z.string().trim().min(1, "Informe o nome").max(200),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Email inválido")),
  role: z.enum(["ADMIN", "PLANNING", "TECHNICIAN"]),
};

export const userIdSchema = z.string().trim().min(1, "Informe o identificador").max(128);

export const createUserSchema = z.strictObject({
  ...userFields,
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(128),
});

export const updateUserSchema = z.strictObject(userFields).partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Informe pelo menos um campo para atualizar" },
);

export const createUserBodySchema = z.strictObject({ userData: createUserSchema });
export const updateUserBodySchema = z.strictObject({ userData: updateUserSchema });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
