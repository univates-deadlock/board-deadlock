import type { ReactNode } from "react";

/** White surface with the soft shadow used by the cards of the public site. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-tp-lg border border-tp-border-light bg-white shadow-tp-card ${className}`}
    >
      {children}
    </div>
  );
}