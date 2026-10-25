"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import { formatBRL } from "@/lib/money";
import {
  QUOTE_STATUS_META,
  createQuote,
  getQuote,
  listQuoteClients,
  listQuotes,
  syncQuoteItems,
  updateQuote,
  type Quote,
  type QuoteClientOption,
  type QuoteItemPayload,
  type QuoteListItem,
  type QuoteStatus,
} from "@/lib/quotes";

/**
 * Quote list screen: list, search, create and edit quotes.
 *
 * Data access goes through lib/quotes.ts, which adapts the API's serialized
 * Decimals (strings) to integer cents at the boundary. The edit flow
 * synchronizes items one by one — the quote PATCH endpoint only accepts
 * notes and the general discount (see lib/quotes.syncQuoteItems).
 */

type QuoteStatusFilter = QuoteStatus | "ALL";

const STATUS_FILTERS: { value: QuoteStatusFilter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "SENT", label: "Enviada" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "REJECTED", label: "Rejeitado" },
  { value: "EXPIRED", label: "Expirado" },
];

/* Quote item as the form holds it: text fields, converted on submit. */
type QuoteItemFormData = {
  type: "PRODUCT" | "SERVICE" | "OTHER";
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
};

type QuoteFormData = {
  clientId: string;
  notes: string;
  discount: string;
  items: QuoteItemFormData[];
};

const EMPTY_ITEM: QuoteItemFormData = {
  type: "SERVICE",
  description: "",
  quantity: "1",
  unitPrice: "0",
  discount: "0",
};

const EMPTY_FORM: QuoteFormData = {
  clientId: "",
  notes: "",
  discount: "0",
  items: [{ ...EMPTY_ITEM }],
};

/** Parses typed text into a number in reais (API unit); null when invalid. */
function parseMoney(text: string): number | null {
  const cleaned = (text ?? "").replace(/[^\d,.]/g, "");
  if (!cleaned) return null;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const lastSep = Math.max(lastComma, lastDot);
  let whole = cleaned;
  let decimals = "";
  if (lastSep !== -1) {
    whole = cleaned.slice(0, lastSep).replace(/[.,]/g, "");
    decimals = cleaned.slice(lastSep + 1).replace(/\D/g, "");
  }
  const value = Number.parseInt(whole || "0", 10) + Number.parseInt((decimals + "00").slice(0, 2), 10) / 100;
  return Number.isFinite(value) ? value : null;
}

export function OrcamentosPageQuote() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [clients, setClients] = useState<QuoteClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<Quote["items"]>([]);
  const [formData, setFormData] = useState<QuoteFormData>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>("ALL");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const [quotesData, clientsData] = await Promise.all([
          listQuotes(),
          listQuoteClients().catch(() => [] as QuoteClientOption[]),
        ]);
        if (!active) return;
        setQuotes(quotesData);
        setClients(clientsData);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Erro ao conectar com o servidor.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function reload() {
    setReloadKey((k) => k + 1);
  }

  function openCreateForm() {
    setEditingId(null);
    setEditingItems([]);
    setFormData(EMPTY_FORM);
    setFieldErrors({});
    setShowForm(true);
  }

  /** Opens the edit modal with the quote's current values (detail with items). */
  async function openEditForm(quote: QuoteListItem) {
    setFieldErrors({});
    setShowForm(true);
    setFormData({
      clientId: quote.clientId,
      notes: quote.notes ?? "",
      discount: String(quote.discountCents / 100),
      items: [{ ...EMPTY_ITEM }],
    });
    try {
      /* The list row has no items — fetch the detail before editing. */
      const detail = await getQuote(quote.id);
      if (!detail) {
        setFieldErrors({ form: "Orçamento não encontrado." });
        return;
      }
      setEditingId(detail.id);
      setEditingItems(detail.items);
      setFormData({
        clientId: detail.clientId,
        notes: detail.notes ?? "",
        discount: String(detail.discountCents / 100),
        items: detail.items.length
          ? detail.items.map((item) => ({
              type: item.type,
              description: item.description,
              quantity: String(item.quantity),
              unitPrice: String(item.unitPriceCents / 100),
              discount: String(item.discountCents / 100),
            }))
          : [{ ...EMPTY_ITEM }],
      });
    } catch (err) {
      setFieldErrors({
        form: err instanceof Error ? err.message : "Não foi possível carregar o orçamento.",
      });
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setEditingItems([]);
    setFormData(EMPTY_FORM);
    setFieldErrors({});
  }

  function addItem() {
    setFormData((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));
  }

  function removeItem(index: number) {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : prev.items,
    }));
  }

  function updateItem(index: number, field: keyof QuoteItemFormData, value: string) {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...prev, items: nextItems };
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    /* Local validation before touching the API. */
    const errors: Record<string, string> = {};
    if (!formData.clientId) errors["clientId"] = "Selecione um cliente.";
    const items: QuoteItemPayload[] = [];
    formData.items.forEach((item, index) => {
      const quantity = Number(item.quantity.replace(",", "."));
      const unitPrice = parseMoney(item.unitPrice);
      const discount = parseMoney(item.discount) ?? 0;
      if (!item.description.trim()) errors[`items.${index}.description`] = "Informe a descrição.";
      if (!Number.isFinite(quantity) || quantity <= 0)
        errors[`items.${index}.quantity`] = "Quantidade deve ser maior que zero.";
      if (unitPrice === null || unitPrice < 0)
        errors[`items.${index}.unitPrice`] = "Informe um valor válido.";
      if (discount < 0) errors[`items.${index}.discount`] = "Desconto inválido.";
      items.push({
        type: item.type,
        description: item.description.trim(),
        quantity,
        unitPrice: unitPrice ?? 0,
        discount,
      });
    });
    const generalDiscount = parseMoney(formData.discount) ?? 0;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const isEdit = editingId !== null;

    try {
      if (isEdit && editingId) {
        /* Edit: PATCH notes/discount, then sync the items one by one. */
        await updateQuote(editingId, {
          notes: formData.notes.trim() ? formData.notes.trim() : null,
          discount: generalDiscount,
        });
        await syncQuoteItems(
          editingId,
          items,
          editingItems.map((item) => ({ ...item })),
        );
        setSuccessMessage("Orçamento atualizado.");
      } else {
        await createQuote({
          clientId: formData.clientId,
          notes: formData.notes.trim() ? formData.notes.trim() : null,
          discount: generalDiscount > 0 ? generalDiscount : undefined,
          items,
        });
        setSuccessMessage("Orçamento criado.");
      }
      closeForm();
      reload();
    } catch (err) {
      setFieldErrors({
        form: err instanceof Error ? err.message : "Não foi possível salvar o orçamento.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const term = searchTerm.trim().toLowerCase();
  const filtered = quotes.filter((quote) => {
    if (statusFilter !== "ALL" && quote.status !== statusFilter) return false;
    if (!term) return true;
    return (
      quote.clientName.toLowerCase().includes(term) ||
      quote.id.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-medium uppercase tracking-[0.15em] text-tp-primary">
            Comercial
          </p>
          <h1 className="text-2xl font-bold text-tp-text-main">Orçamentos</h1>
        </div>
        <Button variant="primary" onClick={() => (showForm ? closeForm() : openCreateForm())}>
          {showForm ? "Cancelar" : "Novo orçamento"}
        </Button>
      </div>

      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4">
          <Alert tone="success">{successMessage}</Alert>
        </div>
      ) : null}

      <Modal
        open={showForm}
        title={editingId ? "Editar orçamento" : "Novo orçamento"}
        onClose={closeForm}
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {fieldErrors["form"] ? <Alert tone="error">{fieldErrors["form"]}</Alert> : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="quote-client" className="text-sm font-semibold text-tp-text-main">
              Cliente
            </label>
            <select
              id="quote-client"
              value={formData.clientId}
              disabled={isSubmitting || editingId !== null}
              onChange={(e) => setFormData((p) => ({ ...p, clientId: e.target.value }))}
              className="w-full rounded-tp-sm border border-tp-border bg-white px-3 py-2.5 text-base text-tp-text-main focus:outline-none focus:border-tp-primary disabled:bg-tp-neutral-100"
            >
              <option value="">Selecione um cliente...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {fieldErrors["clientId"] ? (
              <span className="text-xs text-tp-danger">{fieldErrors["clientId"]}</span>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-b border-tp-border-light py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-tp-text-main">Itens do Orçamento</h3>
              <Button type="button" variant="ghost" onClick={addItem}>
                + Adicionar item
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded border border-tp-border-light p-3 bg-tp-neutral-50"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={item.type}
                    disabled={isSubmitting}
                    onChange={(e) =>
                      updateItem(index, "type", e.target.value as QuoteItemFormData["type"])
                    }
                    className="rounded border border-tp-border px-2 py-1 text-sm bg-white"
                  >
                    <option value="SERVICE">Serviço</option>
                    <option value="PRODUCT">Produto</option>
                    <option value="OTHER">Outro</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Descrição do item..."
                    value={item.description}
                    disabled={isSubmitting}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    className="flex-1 rounded border border-tp-border px-2 py-1 text-sm bg-white"
                  />
                  {formData.items.length > 1 ? (
                    <Button type="button" variant="ghost" onClick={() => removeItem(index)}>
                      Remover
                    </Button>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field
                    id={`qty-${index}`}
                    label="Qtd"
                    value={item.quantity}
                    disabled={isSubmitting}
                    error={fieldErrors[`items.${index}.quantity`]}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                  <Field
                    id={`price-${index}`}
                    label="Preço Un."
                    value={item.unitPrice}
                    disabled={isSubmitting}
                    error={fieldErrors[`items.${index}.unitPrice`]}
                    onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                  />
                  <Field
                    id={`disc-${index}`}
                    label="Desc. Item"
                    value={item.discount}
                    disabled={isSubmitting}
                    error={fieldErrors[`items.${index}.discount`]}
                    onChange={(e) => updateItem(index, "discount", e.target.value)}
                  />
                </div>
                {fieldErrors[`items.${index}.description`] ? (
                  <span className="text-xs text-tp-danger">
                    {fieldErrors[`items.${index}.description`]}
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <Field
            id="quote-discount"
            label="Desconto geral (R$)"
            value={formData.discount}
            disabled={isSubmitting}
            onChange={(e) => setFormData((p) => ({ ...p, discount: e.target.value }))}
          />

          <Field
            id="quote-notes"
            label="Observações / Notas"
            value={formData.notes}
            disabled={isSubmitting}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
          />

          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {editingId ? "Salvar alterações" : "Criar orçamento"}
          </Button>
        </form>
      </Modal>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full max-w-xs">
          <label htmlFor="quote-search" className="sr-only">
            Buscar
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tp-text-muted">
              <Icon name="search" size={16} />
            </span>
            <input
              id="quote-search"
              type="search"
              placeholder="Buscar por código ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-tp-sm border border-tp-border bg-white py-2 pl-9 pr-3 text-sm text-tp-text-main placeholder:text-tp-text-muted focus:outline-none focus:border-tp-primary"
            />
          </div>
        </div>

        <fieldset className="flex flex-wrap items-center gap-1.5">
          <legend className="sr-only">Filtrar por status</legend>
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(filter.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? "border-tp-border bg-tp-neutral-100 text-tp-text-main"
                    : "border-transparent bg-transparent text-tp-text-muted hover:bg-tp-neutral-50 hover:text-tp-text-body"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </fieldset>
      </div>

      {isLoading ? (
        <p className="text-tp-text-muted">Carregando orçamentos...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-tp-md border border-dashed border-tp-border bg-white px-5 py-8 text-center text-sm text-tp-text-muted">
          Nenhum orçamento encontrado.
        </div>
      ) : (
        <div className="tp-table-wrap">
          <table className="tp-table" aria-label="Orçamentos">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th className="text-right">Valor Total</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((quote) => (
                <tr key={quote.id} className="hover:bg-tp-neutral-50">
                  <td className="font-medium text-tp-text-main" title={quote.id}>
                    {quote.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="text-tp-text-body">
                    <button
                      type="button"
                      onClick={() => router.push(`/orcamentos/${quote.id}`)}
                      className="font-medium text-tp-text-main hover:underline"
                    >
                      {quote.clientName || "Cliente não informado"}
                    </button>
                  </td>
                  <td className="text-right font-medium text-tp-text-main">
                    {formatBRL(quote.totalCents)}
                  </td>
                  <td>
                    <Badge tone={QUOTE_STATUS_META[quote.status].badgeTone}>
                      {QUOTE_STATUS_META[quote.status].label}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => router.push(`/orcamentos/${quote.id}`)}
                      >
                        Visualizar
                      </Button>
                      {quote.status === "DRAFT" || quote.status === "SENT" ? (
                        <Button variant="ghost" onClick={() => openEditForm(quote)}>
                          Editar
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}