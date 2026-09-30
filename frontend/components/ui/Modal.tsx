import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Overlay modal for forms (create/edit). The backdrop is dismissible by
 * clicking outside or pressing Escape; the content scrolls if it overflows.
 */
export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-tp-md border border-tp-border bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-tp-text-main">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-tp-sm p-1.5 text-tp-text-muted hover:bg-tp-neutral-50 hover:text-tp-text-main"
            aria-label="Fechar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}