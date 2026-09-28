"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { authClient } from "@/lib/auth-client";

/**
 * Tela de login do sistema interno (issue #30, RF01/UC01).
 *
 * Client Component por necessidade real: mantém o estado do formulário, trata
 * o evento de envio e usa o redirecionamento do router após o sucesso.
 *
 * O fluxo de autenticação reutiliza o `authClient` já configurado no projeto
 * (Better Auth com credentials: "include"), em vez de montar um fetch próprio.
 * O Better Auth é headless: entrega a lógica (signIn/getSession/signOut), não
 * a interface — que é o objeto desta issue.
 */

/** Mensagem única para credencial inválida: não revela se o e-mail existe. */
const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha inválidos.";

/** Mensagem para falha fora do controle do usuário (API fora do ar, erro 5xx). */
const SERVER_ERROR_MESSAGE =
  "Não foi possível entrar agora. Verifique sua conexão e tente novamente.";

/** Destino após o login bem-sucedido. */
const POST_LOGIN_ROUTE = "/";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Referência para devolver o foco ao primeiro ponto de falha. */
  const emailRef = useRef<HTMLInputElement>(null);

  /* Sessão já válida não deve ver a tela de login novamente. */
  useEffect(() => {
    let active = true;

    authClient.getSession().then(({ data }) => {
      if (active && data?.session) router.replace(POST_LOGIN_ROUTE);
    });

    /* Evita atualizar estado depois do desmonte do componente. */
    return () => {
      active = false;
    };
  }, [router]);

  /**
   * Decide a mensagem conforme o resultado do Better Auth.
   * A distinção importa: credencial errada pede correção do usuário,
   * enquanto 5xx/rede pede nova tentativa mais tarde.
   */
  function resolveErrorMessage(status?: number, fallback?: string): string {
    if (status === 401) return INVALID_CREDENTIALS_MESSAGE;
    if (status === 403) return fallback ?? "Usuário inativo. Procure um administrador.";
    if (status && status >= 500) return SERVER_ERROR_MESSAGE;
    return fallback || SERVER_ERROR_MESSAGE;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    /* Guarda contra envio duplicado: o botão também fica desabilitado,
       mas o Enter no formulário precisa da mesma proteção. */
    if (isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(resolveErrorMessage(error.status, error.message));
      setIsSubmitting(false);
      /* Devolve o foco ao primeiro campo para quem navega por teclado. */
      emailRef.current?.focus();
      return;
    }

    /* Sessão criada: navega para o sistema e atualiza os Server Components. */
    router.replace(POST_LOGIN_ROUTE);
    router.refresh();
  }

  return (
    <main className="grid flex-1 lg:grid-cols-2">
      {/* ====================================================================
          Painel institucional — oculto no mobile para priorizar o formulário.
          Empilha foto de fundo, véu em gradiente e o texto, nesta ordem:
          a foto dá contexto e o véu garante o contraste do texto branco.
          ==================================================================== */}
      <section
        aria-hidden="true"
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12 text-white"
        style={{ background: "var(--tp-login-gradient)" }}
      >
        {/* Foto de uma central de monitoramento real como textura de fundo */}
        <Image
          src="/central-monitoramento.png"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-25"
        />

        {/* Véu em gradiente sobre a foto: mantém a legibilidade do texto branco
            e preserva a atmosfera navy da marca */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "var(--tp-login-gradient)", opacity: 0.82 }}
        />

        <div className="relative">
          <Image
            src="/techpro-logo.png"
            alt=""
            width={170}
            height={57}
            priority
            /* O logo oficial é navy: sobre o fundo escuro ficaria ilegível.
               A placa branca preserva o asset sem alterar a marca. */
            className="h-auto w-[170px] rounded-tp-md bg-white px-4 py-3 object-contain"
          />
        </div>

        <div className="relative max-w-sm">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.15em] text-tp-green-400">
            Sistema Interno
          </p>
          <h1 className="mb-4 text-4xl font-bold leading-tight">
            Gestão de clientes, orçamentos e serviços
          </h1>
          <p className="text-base leading-relaxed text-white/80">
            Centralize o histórico comercial e operacional da TechPro em um
            único lugar, com acesso controlado por perfil.
          </p>
        </div>
      </section>

      {/* ====================================================================
          Formulário de acesso
          ==================================================================== */}
      <section className="flex items-center justify-center bg-tp-neutral-50 px-5 py-12 md:px-10">
        <div className="w-full max-w-md">
          {/* Cabeçalho do formulário — no mobile assume a identidade que o painel
              lateral traz no desktop */}
          <div className="mb-8 flex flex-col gap-4 lg:hidden">
            <Image
              src="/techpro-logo.png"
              alt="TechPro"
              width={160}
              height={54}
              priority
              className="h-auto w-[160px] object-contain"
            />
          </div>

          <h1 className="mb-6 text-2xl font-bold text-tp-text-main">Acesse sua conta</h1>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Falha de credencial/servidor aparece antes dos campos e é anunciada */}
            {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

            <Field
              id="email"
              ref={emailRef}
              label="E-mail"
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              required
              value={email}
              disabled={isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Field
              id="password"
              label="Senha"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              disabled={isSubmitting}
              onChange={(event) => setPassword(event.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              loadingLabel="Entrando…"
              disabled={!email || !password}
            >
              Entrar
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
