import type { ReactNode, SVGProps } from "react";

/**
 * Decorative stroke icons shared by the internal screens. Keep the set
 * minimal: add an icon here only when a screen actually uses it, and pair
 * every icon with visible text or an aria-label on the parent.
 */
export type IconName = "back" | "search" | "paperclip";

const PATHS: Record<IconName, ReactNode> = {
  back: (
    <>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  paperclip: (
    <path d="M21.4 11.05 12.2 20.2a5 5 0 0 1-7.1-7.1l9.2-9.2a3.5 3.5 0 0 1 4.9 4.9l-9.2 9.2a1.5 1.5 0 0 1-2.1-2.1l8.5-8.5" />
  ),
};

export function Icon({
  name,
  size = 20,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}