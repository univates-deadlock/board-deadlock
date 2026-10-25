import type { ReactNode } from "react";

/**
 * Page title of the internal screens: compact heading with a slot for the
 * primary action. Internal tools do not explain themselves; the section
 * name is enough for someone who uses the system daily.
 */
export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold tracking-tight text-tp-text-main">
        {title}
      </h1>
      {action}
    </div>
  );
}