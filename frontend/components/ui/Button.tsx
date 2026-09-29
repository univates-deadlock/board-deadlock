import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  /** Submission state; controls the displayed text and prevents clicks. */
  isLoading?: boolean;
  /** Label displayed and announced during submission; replaces the visual content. */
  loadingLabel?: string;
};

/* Secondary action: a neutral background and border avoid competing with the primary action.
   `border-tp-border` is restored because .btn-tp resets the base border. */
const SECONDARY_CLASSES =
  "border border-tp-border bg-white text-tp-text-main hover:bg-tp-neutral-50";

/* Ghost button: no background, for tertiary actions within content blocks. */
const GHOST_CLASSES = "bg-transparent text-tp-text-body hover:text-tp-text-main";

/**
 * Application button using the same visual rules as the landing page's `.btn`.
 * The `primary` variant reuses .btn-tp--primary from globals.css.
 *
 * `isLoading` controls the loading state; `loadingLabel` only supplies the text.
 * Tying the disabled state to the label would permanently disable the button,
 * because the label is present from the first render.
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
      /* aria-busy communicates the busy state to assistive technologies. */
      aria-busy={isLoading || undefined}
      className={`${variantClasses} ${className}`}
      {...rest}
    >
      {isLoading ? (loadingLabel ?? children) : children}
    </button>
  );
}
