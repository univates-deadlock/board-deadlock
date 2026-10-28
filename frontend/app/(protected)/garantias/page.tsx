import { DevPage } from "@/components/layout/DevPage";
import { requireRoleSession } from "@/lib/auth-server";

export default async function GarantiasPage() {
  await requireRoleSession(["ADMIN", "PLANNING"]);
  return (
    <DevPage
      title="Garantias"
      description="Registrar garantias de serviço e de fabricante, distinguindo vigências e controlando vencimentos."
    />
  );
}