"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/icons";
import { formatBRL, formatDateTime, formatQuantity } from "@/lib/money";
import {
  QUOTE_ITEM_TYPE_META,
  QUOTE_STATUS_META,
  getQuote,
  type Quote,
} from "@/lib/quotes";

/**
 * Quote detail screen: what GET /api/quotes/:id returns.
 *
 * The API delivers no state transitions yet — nothing can send a quote,
 * record its decision or store evidence, and editing (notes, general
 * discount, items) lives in the quote forms. So this screen is read-only
 * for now; the send/decision actions return together with the endpoints.
 */

export function QuoteDetailPageClient({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getQuote(quoteId);
        if (!active) return;
        if (!data) {
          setError("Orçamento não encontrado.");
        } else {
          setQuote(data);
        }
        setIsLoading(false);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Não foi possível carregar o orçamento.");
          setIsLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [quoteId]);

  if (isLoading) {
    return <p className="text-tp-text-muted">Carregando orçamento…</p>;
  }

  if (error || !quote) {
    return (
      <div>
        <button
          type="button"
          onClick={() => router.push("/orcamentos")}
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-tp-text-body hover:text-tp-text-main"
        >
          <Icon name="back" size={16} />
          Voltar para orçamentos
        </button>
        <Alert tone="error">{error || "Orçamento não encontrado."}</Alert>
      </div>
    );
  }

  const meta = QUOTE_STATUS_META[quote.status];

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push("/orcamentos")}
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-tp-text-body hover:text-tp-text-main"
        >
          <Icon name="back" size={16} />
          Orçamentos
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <h1
            className="text-xl font-semibold tracking-tight text-tp-text-main"
            title={quote.id}
          >
            {quote.id.slice(0, 8).toUpperCase()}
          </h1>
          <Badge tone={meta.badgeTone}>{meta.label}</Badge>
        </div>
        <p className="mt-1 text-sm text-tp-text-muted">{quote.clientName}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-tp-text-main">Itens</h2>
            {quote.items.length === 0 ? (
              <p className="text-sm text-tp-text-muted">Nenhum item.</p>
            ) : (
              <div className="tp-table-wrap">
                <table className="tp-table" aria-label="Itens do orçamento">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th className="text-right">Qtd.</th>
                      <th className="text-right">Valor unit.</th>
                      <th className="text-right">Desconto</th>
                      <th className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item) => (
                      <tr key={item.id}>
                        <td>{QUOTE_ITEM_TYPE_META[item.type].label}</td>
                        <td>{item.description}</td>
                        <td className="text-right">{formatQuantity(item.quantity)}</td>
                        <td className="text-right">{formatBRL(item.unitPriceCents)}</td>
                        <td className="text-right">
                          {item.discountCents ? `-${formatBRL(item.discountCents)}` : "-"}
                        </td>
                        <td className="text-right font-semibold text-tp-text-main">
                          {formatBRL(item.subtotalCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {quote.notes ? (
            <Card className="p-6">
              <h2 className="mb-3 text-lg font-semibold text-tp-text-main">Observações</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-tp-text-body">
                {quote.notes}
              </p>
            </Card>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-tp-text-main">Resumo</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-tp-text-body">Subtotal</dt>
                <dd className="font-semibold text-tp-text-main">
                  {formatBRL(quote.subtotalCents)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-tp-text-body">Descontos</dt>
                <dd className="font-semibold text-tp-danger">
                  -{formatBRL(quote.discountCents)}
                </dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-tp-border-light pt-3 text-base">
                <dt className="font-bold text-tp-text-main">Total</dt>
                <dd className="font-bold text-tp-green-600">{formatBRL(quote.totalCents)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-tp-text-main">Histórico</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-tp-text-muted">Criado em</dt>
                <dd className="font-medium text-tp-text-main">
                  {formatDateTime(quote.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-tp-text-muted">Enviado em</dt>
                <dd className="font-medium text-tp-text-main">{formatDateTime(quote.sentAt)}</dd>
              </div>
              {quote.status === "DRAFT" ? (
                <div>
                  <dt className="text-tp-text-muted">Situação</dt>
                  <dd className="font-medium text-tp-text-main">Rascunho em elaboração.</dd>
                </div>
              ) : null}
              {quote.decidedAt ? (
                <>
                  <div>
                    <dt className="text-tp-text-muted">Decidido em</dt>
                    <dd className="font-medium text-tp-text-main">
                      {formatDateTime(quote.decidedAt)}
                    </dd>
                  </div>
                  {quote.decisionNotes ? (
                    <div>
                      <dt className="text-tp-text-muted">Observação da decisão</dt>
                      <dd className="font-medium text-tp-text-main">{quote.decisionNotes}</dd>
                    </div>
                  ) : null}
                  {quote.decisionEvidenceUrl ? (
                    <div>
                      <dt className="text-tp-text-muted">Evidência</dt>
                      <dd className="inline-flex items-center gap-1.5 font-medium text-tp-blue-900">
                        <Icon name="paperclip" size={14} />
                        {quote.decisionEvidenceUrl}
                      </dd>
                    </div>
                  ) : null}
                </>
              ) : null}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}