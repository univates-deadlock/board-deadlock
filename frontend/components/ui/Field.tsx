import type { InputHTMLAttributes, Ref } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  /** Mensagem de erro associada ao campo; quando presente, marca o campo como inválido. */
  error?: string;
  /** Texto auxiliar exibido abaixo do campo quando não há erro. */
  hint?: string;
  /** Permite à tela devolver o foco a este campo após uma falha de envio. */
  ref?: Ref<HTMLInputElement>;
};

/**
 * Campo de formulário com label visível, texto auxiliar e erro acessível.
 *
 * O erro é ligado ao input por `aria-describedby` (o texto real do erro) e o
 * estado inválido é exposto por `aria-invalid`, para que a leitura não dependa
 * apenas da cor da borda.
 */
export function Field({
  id,
  label,
  error,
  hint,
  className = "",
  ref,
  ...rest
}: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-tp-text-main">
        {label}
      </label>

      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-tp-sm border bg-white px-3 py-2.5 text-base text-tp-text-main transition-colors placeholder:text-tp-text-muted focus:outline-none disabled:bg-tp-neutral-100 ${
          error
            ? "border-tp-danger focus:border-tp-danger"
            : "border-tp-border focus:border-tp-primary"
        } ${className}`}
        {...rest}
      />

      {error ? (
        <p id={errorId} className="text-sm text-tp-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-tp-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
