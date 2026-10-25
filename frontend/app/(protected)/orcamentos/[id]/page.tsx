import { QuoteDetailPageClient } from "@/components/orcamentos/QuoteDetailPageClient";

export default async function OrcamentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuoteDetailPageClient quoteId={id} />;
}