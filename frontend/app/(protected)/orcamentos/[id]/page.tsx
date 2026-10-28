import { QuoteDetailPageClient } from "@/components/orcamentos/QuoteDetailPageClient";
import { requireRoleSession } from "@/lib/auth-server";

export default async function OrcamentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRoleSession(["ADMIN", "PLANNING"]);
  const { id } = await params;
  return <QuoteDetailPageClient quoteId={id} />;
}