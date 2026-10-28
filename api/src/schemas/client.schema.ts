import { z } from "zod";

export const clientTypeEnum = z.enum(["INDIVIDUAL", "COMPANY"]);
export type ClientTypeValue = z.infer<typeof clientTypeEnum>;

const VALID_BR_DDDS = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

const CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits)) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += Number(digits[i]) * (10 - i);
  }
  const check1 = ((sum1 * 10) % 11) % 10;
  if (check1 !== Number(digits[9])) return false;

  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += Number(digits[i]) * (11 - i);
  }
  const check2 = ((sum2 * 10) % 11) % 10;
  return check2 === Number(digits[10]);
}

export function isValidCnpj(digits: string): boolean {
  if (!/^\d{14}$/.test(digits)) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += Number(digits[i]) * CNPJ_WEIGHTS_1[i];
  }
  const rem1 = sum1 % 11;
  const check1 = rem1 < 2 ? 0 : 11 - rem1;
  if (check1 !== Number(digits[12])) return false;

  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += Number(digits[i]) * CNPJ_WEIGHTS_2[i];
  }
  const rem2 = sum2 % 11;
  const check2 = rem2 < 2 ? 0 : 11 - rem2;
  return check2 === Number(digits[13]);
}

export function isDocumentCompatibleWithType(
  document: string,
  type: ClientTypeValue
): boolean {
  return type === "COMPANY" ? isValidCnpj(document) : isValidCpf(document);
}

export function normalizeBrazilianPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (!/^[\d\s()+-]+$/.test(trimmed)) return null;

  let digits = trimmed.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  return digits;
}

export function isValidBrazilianPhone(digits: string): boolean {
  if (!/^\d{10,11}$/.test(digits)) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const ddd = digits.slice(0, 2);
  if (!VALID_BR_DDDS.has(ddd)) return false;

  const subscriber = digits.slice(2);
  if (/^0+$/.test(subscriber)) return false;

  if (subscriber.length === 9) {
    return subscriber[0] === "9" && subscriber[1] !== "0";
  }

  return /^[2-5]/.test(subscriber);
}

const documentField = z
  .string()
  .trim()
  .max(20, "Documento inválido")
  .transform((value, ctx) => {
    if (value === "") return null;
    if (!/^[\d.\-/\s]+$/.test(value)) {
      ctx.addIssue({ code: "custom", message: "Informe um CPF ou CNPJ válido" });
      return z.NEVER;
    }
    const digits = value.replace(/\D/g, "");
    if (!isValidCpf(digits) && !isValidCnpj(digits)) {
      ctx.addIssue({ code: "custom", message: "Informe um CPF ou CNPJ válido" });
      return z.NEVER;
    }
    return digits;
  })
  .nullable()
  .optional();

const optionalPhoneField = z
  .string()
  .trim()
  .max(20, "Telefone inválido")
  .transform((value, ctx) => {
    if (value === "") return null;
    const digits = normalizeBrazilianPhone(value);
    if (!digits || !isValidBrazilianPhone(digits)) {
      ctx.addIssue({ code: "custom", message: "Informe um telefone válido com DDD" });
      return z.NEVER;
    }
    return digits;
  })
  .nullable()
  .optional();

const whatsappField = z
  .string()
  .trim()
  .min(1, "Informe o WhatsApp")
  .max(20, "WhatsApp inválido")
  .transform((value, ctx) => {
    const digits = normalizeBrazilianPhone(value);
    if (!digits || !isValidBrazilianPhone(digits)) {
      ctx.addIssue({ code: "custom", message: "Informe um WhatsApp válido com DDD" });
      return z.NEVER;
    }
    return digits;
  });

const clientFields = {
  type: clientTypeEnum,
  name: z.string().trim().min(1, "Informe o nome").max(200),
  document: documentField,
  notes: z.string().trim().nullable().optional(),
  contactName: z.string().trim().max(200).nullable().optional(),
  phone: optionalPhoneField,
  whatsapp: whatsappField,
  location: z.string().trim().min(1, "Informe a localização").max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(100)
    .pipe(z.union([z.email("Email inválido"), z.literal("")]))
    .transform((email) => (email === "" ? null : email))
    .nullable()
    .optional(),
};

const validateDocumentByType = (
  data: { type?: ClientTypeValue; document?: string | null },
  ctx: z.RefinementCtx
) => {
  if (!data.type || !data.document) return;
  if (data.type === "INDIVIDUAL" && !isValidCpf(data.document)) {
    ctx.addIssue({
      code: "custom",
      path: ["document"],
      message: "Informe um CPF válido para cliente Pessoa Física",
    });
  } else if (data.type === "COMPANY" && !isValidCnpj(data.document)) {
    ctx.addIssue({
      code: "custom",
      path: ["document"],
      message: "Informe um CNPJ válido para cliente Pessoa Jurídica",
    });
  }
};

export const clientIdSchema = z.string().trim().uuid("Identificador do cliente inválido");

const baseClientSchema = z.strictObject(clientFields);

export const createClientSchema = baseClientSchema.superRefine(validateDocumentByType);

export const updateClientSchema = baseClientSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Informe pelo menos um campo para atualizar" }
  )
  .superRefine(validateDocumentByType);

export const createClientBodySchema = z.strictObject({ clientData: createClientSchema });
export const updateClientBodySchema = z.strictObject({ clientData: updateClientSchema });

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
