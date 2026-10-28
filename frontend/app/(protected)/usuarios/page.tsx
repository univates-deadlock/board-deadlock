import { UsuariosPageClient } from "@/components/usuarios/UsuariosPageClient";
import { requireRoleSession } from "@/lib/auth-server";

export default async function UsuariosPage() {
  await requireRoleSession(["ADMIN"]);
  return <UsuariosPageClient />;
}