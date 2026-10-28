import { ClientesPageClient } from "@/components/clientes/ClientesPageClient";
import { requireRoleSession } from "@/lib/auth-server";

export default async function ClientesPage() {
  await requireRoleSession(["ADMIN", "PLANNING"]);
  return <ClientesPageClient />;
}