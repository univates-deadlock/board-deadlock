import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  /** Estado de envio em curso; controla o texto exibido e o bloqueio do clique. */
  isLoading?: boolean;
  /** Rótulo anunciado/exibido durante o envio; substitui o conteúdo visual. */
  loadingLabel?: string;
};

/* Botão de apoio (ação secundária): fundo neutro com borda, sem competir com a ação principal.
   `border-tp-border` é reposto porque .btn-tp zera a borda na base. */
const SECONDARY_CLASSES =
  "border border-tp-border bg-white text-tp-text-main hover:bg-tp-neutral-50";

/* Botão discreto: sem fundo, para ações terciárias dentro de blocos */
const GHOST_CLASSES = "bg-transparent text-tp-text-body hover:text-tp-text-main";

/**
 * Botão do sistema, com as mesmas regras visuais do `.btn` da landing.
 * A variante `primary` reaproveita .btn-tp--primary definido no globals.css.
 *
 * O estado de carregamento é controlado por `isLoading` — e não pela presença
 * de `loadingLabel`, que é apenas o texto. Amarrar o bloqueio ao rótulo deixaria
 * o botão desabilitado para sempre, já que o rótulo existe desde o primeiro render.
 */
export function Button({
  children,
  variant = "primary",
  isLoading = false,
  loadingLabel,
  disabled,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  const variantClasses =
    variant === "primary"
      ? "btn-tp btn-tp--primary"
      : variant === "secondary"
        ? `btn-tp ${SECONDARY_CLASSES}`
        : `btn-tp ${GHOST_CLASSES}`;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      /* aria-busy comunica o estado ocupado a tecnologias assistivas */
      aria-busy={isLoading || undefined}
      className={`${variantClasses} ${className}`}
      {...rest}
    >
      {isLoading ? (loadingLabel ?? children) : children}
    </button>
  );
}
