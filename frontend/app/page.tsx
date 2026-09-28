"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

/**
 * Área interna — ponto de entrada após o login.
 *
 * Nesta entrega o shell operacional ainda não existe: as telas de orçamentos e
 * de pendências dependem de endpoints que a API ainda não expõe. O que esta
 * página cumpre agora é o restante do critério de autenticação da Parcial 1:
 * manter a sessão, proteger a área interna e permitir logout.
 *
 * Proteção em duas camadas: aqui o redirecionamento evita mostrar a casca sem
 * sessão; a autorização de verdade continua no backend, que responde 401/403
 * em cada requisição — esconder na interface não é controle de acesso.
 */

type SessionUser = {
  name?: string;
  email?: string;
  role?: string;
};

/** Rótulos legíveis dos perfis definidos no enum UserRole da API. */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  PLANNING: "Orçamento / Planejamento",
  TECHNICIAN: "Técnico",
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
    setIsSigningOut(true);
    await authClient.signOut();
    /* replace evita voltar à área interna pelo botão "voltar" do navegador. */
    router.replace("/login");
  }

  /* Estado de carregamento: evita exibir o esqueleto da área interna antes de
     saber se há sessão válida. */
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
          Cabeçalho da área interna
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
          Conteúdo — o shell operacional entra aqui nas próximas entregas
          ==================================================================== */}
      <section className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-12 md:px-10">
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
