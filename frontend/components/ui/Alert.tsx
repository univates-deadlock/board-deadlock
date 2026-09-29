import type { ReactNode } from "react";

type AlertTone = "error" | "warning" | "success";

type AlertProps = {
  tone: AlertTone;
  children: ReactNode;
};

/* Each tone has its own surface and text colors, accompanied by a text label
   so that meaning does not depend on color alone. */
const TONE_CLASSES: Record<AlertTone, string> = {
  error: "bg-[var(--tp-danger-surface)] text-tp-danger border-tp-danger",
  warning: "bg-[var(--tp-warning-surface)] text-tp-warning border-tp-warning",
  success: "bg-[var(--tp-success-surface)] text-tp-green-600 border-tp-green-500",
};

/**
 * Operation feedback (invalid credentials, server errors, or success).
 *
 * Uses `role="alert"` so assistive technologies announce the message as soon
 * as it appears, without relying on the user noticing a visual change.
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
