"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

/**
 * Internal area — entry point after sign-in.
 *
 * The operational shell is not available in this delivery: quote and pending
 * task screens depend on endpoints the API does not expose yet. This page
 * completes the remaining authentication requirements for Milestone 1:
 * maintaining the session, protecting the internal area, and allowing sign-out.
 *
 * The server page verifies the session before rendering this client component.
 * This client check keeps the displayed user and browser-side session in sync.
 */

type SessionUser = {
  name?: string;
  email?: string;
  role?: string;
};

/** Readable labels for the roles defined in the API UserRole enum. */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  PLANNING: "Orçamento / Planejamento",
  TECHNICIAN: "Técnico",
};

export function HomePageClient() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    let active = true;

    authClient.getSession().then(({ data }) => {
      if (!active) return;

      if (!data?.session) {
        router.replace("/login");
        return;
      }

      setUser(data.user as SessionUser);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    setSignOutError("");
    setIsSigningOut(true);

    try {
      const { error } = await authClient.signOut();
      if (error) {
        setSignOutError("Não foi possível sair. Você ainda está conectado. Tente novamente.");
        setIsSigningOut(false);
        return;
      }

      /* replace prevents returning to the internal area with the browser Back button. */
      router.replace("/login");
    } catch {
      setSignOutError("Não foi possível sair. Você ainda está conectado. Tente novamente.");
      setIsSigningOut(false);
    }
  }

  /* Loading state: wait for a valid session before displaying
     the internal area shell. */
  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-tp-neutral-50">
        <p role="status" className="text-tp-text-muted">
          Verificando sessão…
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-tp-neutral-50">
      {/* ====================================================================
          Internal area header
          ==================================================================== */}
      <header className="border-b border-tp-border-light bg-white">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-5 py-4 md:px-10">
          <Image
            src="/techpro-logo.png"
            alt="TechPro"
            width={140}
            height={47}
            priority
            className="h-auto w-[140px] object-contain"
          />

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-tp-text-main">{user?.name}</p>
              <p className="text-xs text-tp-text-muted">
                {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={handleSignOut}
              isLoading={isSigningOut}
              loadingLabel="Saindo…"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          Content — the operational shell will be added in later deliveries
          ==================================================================== */}
      <section className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-12 md:px-10">
        {signOutError ? (
          <div className="mb-6 max-w-2xl">
            <Alert tone="error">{signOutError}</Alert>
          </div>
        ) : null}
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.15em] text-tp-primary">
          Sistema Interno
        </p>
        <h1 className="mb-3 text-3xl font-bold text-tp-text-main">
          Olá, {user?.name?.split(" ")[0] ?? "bem-vindo"}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-tp-text-body">
          A autenticação está ativa. As telas de orçamentos e de pendências operacionais
          entram nas próximas entregas, quando a API expuser os endpoints correspondentes.
        </p>
      </section>
    </main>
  );
}
