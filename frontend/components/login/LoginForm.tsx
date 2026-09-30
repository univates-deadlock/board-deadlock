"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/schemas";

const API_UNAVAILABLE_MESSAGE = "Não foi possível falar com o servidor.";
const POST_LOGIN_ROUTE = "/";

const emptySubscribe = () => () => {};
function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function resolveErrorMessage(status?: number): string {
  switch (status) {
    case 400:
    case 401:
      return "E-mail ou senha inválidos.";
    case 403:
      return "Acesso negado. Entre em contato com um administrador.";
    case 429:
      return "Muitas tentativas de acesso. Aguarde um momento e tente novamente.";
    default:
      return API_UNAVAILABLE_MESSAGE;
  }
}

export function LoginForm() {
  const router = useRouter();
  const isMounted = useIsHydrated();

  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined" && window.location.search) {
      return new URLSearchParams(window.location.search).get("email") ?? "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    let active = true;

    authClient.getSession().then(({ data }) => {
      if (active && data?.session) {
        router.replace(POST_LOGIN_ROUTE);
        router.refresh();
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const currentEmail = (formData.get("email") as string) || email;
    const currentPassword = (formData.get("password") as string) || password;

    const validation = loginSchema.safeParse({
      email: currentEmail,
      password: currentPassword,
    });

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      setEmailError(errors.email?.[0] ?? "");
      setPasswordError(errors.password?.[0] ?? "");
      setErrorMessage("");
      emailRef.current?.focus();
      return;
    }

    setEmailError("");
    setPasswordError("");
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const { error } = await authClient.signIn.email({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (error) {
        setErrorMessage(resolveErrorMessage(error.status));
        setIsSubmitting(false);
        emailRef.current?.focus();
        return;
      }
    } catch {
      setErrorMessage(API_UNAVAILABLE_MESSAGE);
      setIsSubmitting(false);
      emailRef.current?.focus();
      return;
    }

    router.replace(POST_LOGIN_ROUTE);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-tp-text-main">Acesse sua conta</h1>

      <form
        action="javascript:void(0);"
        method="POST"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}

        <Field
          id="email"
          ref={emailRef}
          label="E-mail"
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          maxLength={254}
          required
          value={email}
          disabled={isSubmitting}
          error={emailError || undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            if (emailError) setEmailError("");
          }}
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
          error={passwordError || undefined}
          onChange={(event) => {
            setPassword(event.target.value);
            if (passwordError) setPasswordError("");
          }}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isSubmitting || !isMounted}
          loadingLabel={!isMounted ? "Carregando…" : "Entrando…"}
        >
          Entrar
        </Button>
      </form>
    </div>
  );
}
