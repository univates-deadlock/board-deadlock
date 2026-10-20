import { z } from "zod";

export const quoteStatusEnum = z.enum(["DRAFT", "SENT", "APPROVED", "REJECTED", "EXPIRED"]);
export const quoteItemTypeEnum = z.enum(["PRODUCT", "SERVICE", "OTHER"]);

export type QuoteStatusValue = z.infer<typeof quoteStatusEnum>;

// ============= Number helpers =============
const hasMaxTwoDecimals = (value: number) =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

const money = (label: string) =>
  z
    .number({ error: `${label} inválido` })
    .min(0, `${label} não pode ser negativo`)
    .max(9_999_999_999.99, `${label} acima do limite permitido`)
    .refine(hasMaxTwoDecimals, `${label} deve ter no máximo 2 casas decimais`);

const quantity = z
  .number({ error: "Quantidade inválida" })
  .gt(0, "A quantidade deve ser maior que zero")
  .max(99_999_999.99, "Quantidade acima do limite permitido")
  .refine(hasMaxTwoDecimals, "Quantidade deve ter no máximo 2 casas decimais");

// ============= Itens =============
const quoteItemFields = {
  type: quoteItemTypeEnum,
  description: z.string().trim().min(1, "Informe a descrição do item"),
  quantity,
  unitPrice: money("Valor unitário"),
  discount: money("Desconto do item").optional(), // em R$; se omitido, vale 0
};

export const createQuoteItemSchema = z.strictObject(quoteItemFields);

export const updateQuoteItemSchema = z
  .strictObject(quoteItemFields)
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Informe pelo menos um campo para atualizar" }
  );

// ============= Quote =============
export const quoteIdSchema = z.string().trim().uuid("Identificador do orçamento inválido");
export const quoteItemIdSchema = z.string().trim().uuid("Identificador do item inválido");

export const createQuoteSchema = z.strictObject({
  clientId: z.string().trim().uuid("Identificador do cliente inválido"),
  notes: z.string().trim().nullable().optional(),
  discount: money("Desconto geral").optional(), // desconto geral em R$; se omitido, vale 0
  items: z.array(createQuoteItemSchema).max(100, "Máximo de 100 itens por orçamento").optional(),
});

export const updateQuoteSchema = z
  .strictObject({
    notes: z.string().trim().nullable().optional(),
    discount: money("Desconto geral").optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Informe pelo menos um campo para atualizar" }
  );

export const listQuotesQuerySchema = z.object({
  clientId: z.string().trim().uuid("Identificador do cliente inválido").optional(),
  status: quoteStatusEnum.optional(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type CreateQuoteItemInput = z.infer<typeof createQuoteItemSchema>;
export type UpdateQuoteItemInput = z.infer<typeof updateQuoteItemSchema>;
export type ListQuotesQuery = z.infer<typeof listQuotesQuerySchema>;