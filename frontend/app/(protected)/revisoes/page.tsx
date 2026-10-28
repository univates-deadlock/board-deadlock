import { DevPage } from "@/components/layout/DevPage";
import { requireRoleSession } from "@/lib/auth-server";

export default async function RevisoesPage() {
  await requireRoleSession(["ADMIN", "PLANNING"]);
  return (
    <DevPage
      title="Revisões"
      description="Programar revisões futuras com status e alertas de revisões próximas ou atrasadas."
    />
  );
}