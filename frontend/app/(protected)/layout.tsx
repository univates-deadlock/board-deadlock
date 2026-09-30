import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { requireActiveSession } from "@/lib/auth-server";

/**
 * Layout for all authenticated pages.
 *
 * The server verifies the session before rendering anything; unauthenticated
 * visitors are redirected to /login by `requireActiveSession`.
 */
export default async function ProtectedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireActiveSession();

  return <AppShell>{children}</AppShell>;
}