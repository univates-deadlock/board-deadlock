"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth-client";

/**
 * Top bar of the authenticated area.
 *
 * Contains the mobile menu toggle (sidebar slides in on small screens)
 * and the sign-out action.
 */
export function AppHeader({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  async function handleSignOut() {
    if (isSigningOut) return;
    setSignOutError("");
    setIsSigningOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error("Sign-out failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setSignOutError("Não foi possível sair. Você ainda está conectado. Tente novamente.");
      setIsSigningOut(false);
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-tp-border-light bg-white px-5 py-3 lg:px-8">
      {/* Mobile menu button — hidden on desktop where the sidebar is always visible. */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-tp-sm p-2 text-tp-text-body hover:bg-tp-neutral-50 lg:hidden"
        aria-label="Abrir menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="hidden lg:block" />

      {signOutError ? <Alert tone="error">{signOutError}</Alert> : null}

      <Button
        variant="secondary"
        onClick={handleSignOut}
        isLoading={isSigningOut}
        loadingLabel="Saindo…"
      >
        Sair
      </Button>
    </header>
  );
}