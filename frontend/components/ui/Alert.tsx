import type { ReactNode } from "react";

type AlertTone = "error" | "warning" | "success";

type AlertProps = {
  tone: AlertTone;
  children: ReactNode;
};

/* Cada tom tem superfície e texto próprios; a cor acompanha um rótulo textual,
   para que o significado não dependa só da cor. */
const TONE_CLASSES: Record<AlertTone, string> = {
  error: "bg-[var(--tp-danger-surface)] text-tp-danger border-tp-danger",
  warning: "bg-[var(--tp-warning-surface)] text-tp-warning border-tp-warning",
  success: "bg-[var(--tp-success-surface)] text-tp-green-600 border-tp-green-500",
};

/**
 * Mensagem de retorno de operação (falha de credencial, erro de servidor, sucesso).
 *
 * Usa `role="alert"` para que tecnologias assistivas anunciem a mensagem assim
 * que ela aparecer, sem depender de o usuário perceber a mudança visual.
 */
export function Alert({ tone, children }: AlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-tp-sm border-l-4 px-3.5 py-3 text-sm ${TONE_CLASSES[tone]}`}
    >
      {children}
    </div>
  );
}
