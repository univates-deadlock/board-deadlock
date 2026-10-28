import { OrcamentosPageQuote } from "@/components/orcamentos/OrcamentosPageQuote";
import { requireRoleSession } from "@/lib/auth-server";

export default async function OrcamentosPage() {
  await requireRoleSession(["ADMIN", "PLANNING"]);
  return <OrcamentosPageQuote />;
}