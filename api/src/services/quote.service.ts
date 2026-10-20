import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type {
  CreateQuoteInput,
  CreateQuoteItemInput,
  ListQuotesQuery,
  QuoteStatusValue,
  UpdateQuoteInput,
  UpdateQuoteItemInput,
} from "../schemas/quote.schema.js";
import { AppError } from "../utils/AppError.js";
import { calcItemSubtotal, calcQuoteTotals, toDecimal } from "./quote.calc.js";

// 1) ============= Selects =============
export const quoteItemSelect = {
  id: true,
  quoteId: true,
  type: true,
  description: true,
  quantity: true,
  unitPrice: true,
  discount: true,
  subtotal: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.QuoteItemSelect;

const quoteBaseSelect = {
  id: true,
  clientId: true,
  status: true,
  subtotal: true,
  discount: true,
  total: true,
  notes: true,
  createdBy: true,
  sentAt: true,
  decidedAt: true,
  decisionNotes: true,
  decisionEvidenceUrl: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, name: true, type: true } },
} satisfies Prisma.QuoteSelect;

export const quoteListSelect = {
  ...quoteBaseSelect,
  _count: { select: { items: true } },
} satisfies Prisma.QuoteSelect;

export const quoteDetailSelect = {
  ...quoteBaseSelect,
  items: { select: quoteItemSelect, orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
} satisfies Prisma.QuoteSelect;

// 2) ============= Helpers internos =============
// "Open" quote = can be edited (decision not yet recorded)
const isOpen = (status: QuoteStatusValue) => status === "DRAFT" || status === "SENT";

const buildItemData = (input: CreateQuoteItemInput) => {
  const quantity = toDecimal(input.quantity);
  const unitPrice = toDecimal(input.unitPrice);
  const discount = toDecimal(input.discount ?? 0);

  return {
    type: input.type,
    description: input.description,
    quantity,
    unitPrice,
    discount,
    subtotal: calcItemSubtotal({ quantity, unitPrice, discount }),
  };
};

// Fetches the quote and ensures it exists and can still be modified
const getOpenQuoteOrThrow = async (tx: Prisma.TransactionClient, id: string) => {
  const quote = await tx.quote.findUnique({
    where: { id },
    select: { id: true, status: true, discount: true },
  });

  if (!quote) {
    throw new AppError("Orçamento não encontrado", 404);
  }

  if (!isOpen(quote.status)) {
    throw new AppError("Orçamento com decisão registrada não pode ser alterado", 409);
  }

  return quote;
};

// Recalculates subtotal/total from the items. Always call inside a transaction.
const recalculateQuote = async (
  tx: Prisma.TransactionClient,
  quoteId: string,
  currentDiscount: Prisma.Decimal,
  newDiscount?: number
) => {
  const items = await tx.quoteItem.findMany({
    where: { quoteId },
    select: { subtotal: true },
  });

  const totals = calcQuoteTotals(
    items.map((item) => item.subtotal),
    newDiscount === undefined ? currentDiscount : toDecimal(newDiscount)
  );

  await tx.quote.update({
    where: { id: quoteId },
    data: { subtotal: totals.subtotal, discount: totals.discount, total: totals.total },
  });
};

const findQuoteDetail = async (tx: Prisma.TransactionClient, id: string) =>
  tx.quote.findUniqueOrThrow({ where: { id }, select: quoteDetailSelect });

// 3) ============= List quotes (filtros opcionais) =============
export const getAllQuotes = async (filters: ListQuotesQuery) =>
  prisma.quote.findMany({
    where: {
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.status && { status: filters.status }),
    },
    select: quoteListSelect,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });

// 4) ============= Search quote by ID (com itens) =============
export const getQuoteById = async (id: string) => {
  const quote = await prisma.quote.findUnique({ where: { id }, select: quoteDetailSelect });

  if (!quote) {
    throw new AppError("Orçamento não encontrado", 404);
  }

  return quote;
};

// 5) ============= Create quote (with itens) =============
export const createQuote = async (data: CreateQuoteInput, userId: string) => {
  const client = await prisma.client.findUnique({
    where: { id: data.clientId },
    select: { id: true, active: true },
  });

  if (!client) {
    throw new AppError("Cliente não encontrado", 404);
  }

  if (!client.active) {
    throw new AppError("Não é possível criar orçamento para um cliente inativo", 409);
  }

  const items = (data.items ?? []).map(buildItemData);
  const totals = calcQuoteTotals(
    items.map((item) => item.subtotal),
    toDecimal(data.discount ?? 0)
  );

  // Nested create: the quote and its items are saved together (all or nothing)
  return prisma.quote.create({
    data: {
      clientId: data.clientId,
      createdBy: userId,
      status: "DRAFT",
      notes: data.notes ?? null,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      items: { create: items },
    },
    select: quoteDetailSelect,
  });
};

// 6) ============= Update quote (notes / desconto geral) =============
export const updateQuote = async (id: string, data: UpdateQuoteInput) =>
  prisma.$transaction(async (tx) => {
    const quote = await getOpenQuoteOrThrow(tx, id);

    if (data.notes !== undefined) {
      await tx.quote.update({ where: { id }, data: { notes: data.notes } });
    }

    if (data.discount !== undefined) {
      await recalculateQuote(tx, id, quote.discount, data.discount);
    }

    return findQuoteDetail(tx, id);
  });

// 7) ============= Delete quote =============
export const deleteQuote = async (id: string) => {
  const quote = await prisma.quote.findUnique({ where: { id }, select: { id: true, status: true } });

  if (!quote) {
    throw new AppError("Orçamento não encontrado", 404);
  }

  if (quote.status !== "DRAFT") {
    throw new AppError("Apenas orçamentos em rascunho podem ser excluídos", 409);
  }

  // Items are deleted together with the quote 
  await prisma.quote.delete({ where: { id } });
};

// 8) ============= Add item =============
export const addQuoteItem = async (quoteId: string, data: CreateQuoteItemInput) =>
  prisma.$transaction(async (tx) => {
    const quote = await getOpenQuoteOrThrow(tx, quoteId);

    await tx.quoteItem.create({ data: { quoteId, ...buildItemData(data) } });
    await recalculateQuote(tx, quoteId, quote.discount);

    return findQuoteDetail(tx, quoteId);
  });

// 9) ============= Update item =============
export const updateQuoteItem = async (
  quoteId: string,
  itemId: string,
  data: UpdateQuoteItemInput
) =>
  prisma.$transaction(async (tx) => {
    const quote = await getOpenQuoteOrThrow(tx, quoteId);

    const current = await tx.quoteItem.findFirst({
      where: { id: itemId, quoteId },
      select: quoteItemSelect,
    });

    if (!current) {
      throw new AppError("Item não encontrado neste orçamento", 404);
    }

    // PATCH parcial: o que não veio mantém o valor atual
    const merged = buildItemData({
      type: data.type ?? current.type,
      description: data.description ?? current.description,
      quantity: data.quantity ?? current.quantity.toNumber(),
      unitPrice: data.unitPrice ?? current.unitPrice.toNumber(),
      discount: data.discount ?? current.discount.toNumber(),
    });

    await tx.quoteItem.update({ where: { id: itemId }, data: merged });
    await recalculateQuote(tx, quoteId, quote.discount);

    return findQuoteDetail(tx, quoteId);
  });

// 10) ============= Delete item =============
export const deleteQuoteItem = async (quoteId: string, itemId: string) =>
  prisma.$transaction(async (tx) => {
    const quote = await getOpenQuoteOrThrow(tx, quoteId);

    const item = await tx.quoteItem.findFirst({
      where: { id: itemId, quoteId },
      select: { id: true },
    });

    if (!item) {
      throw new AppError("Item não encontrado neste orçamento", 404);
    }

// quote that was already sent must keep at least 1 item
    if (quote.status === "SENT") {
      const totalItems = await tx.quoteItem.count({ where: { quoteId } });
      if (totalItems <= 1) {
        throw new AppError("Um orçamento enviado precisa ter pelo menos um item", 409);
      }
    }

    await tx.quoteItem.delete({ where: { id: itemId } });
    await recalculateQuote(tx, quoteId, quote.discount);

    return findQuoteDetail(tx, quoteId);
  });