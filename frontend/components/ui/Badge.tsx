import type { ReactNode } from "react";

type BadgeTone = "success" | "danger" | "info" | "warning" | "neutral";

/**
 * Status label in the compact tool style: a colored dot followed by plain
 * text. The color is decorative only — the text always states the meaning,
 * so the dot is aria-hidden.
 */
const DOTS: Record<BadgeTone, string> = {
  success: "bg-tp-green-500",
  danger: "bg-tp-danger",
  info: "bg-tp-blue-500",
  warning: "bg-tp-warning",
  neutral: "bg-tp-neutral-500",
};

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-tp-text-body">
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[tone]}`}
      />
      {children}
    </span>
  );
}