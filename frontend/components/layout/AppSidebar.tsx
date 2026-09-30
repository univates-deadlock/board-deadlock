"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

type NavItem = {
  label: string;
  href: string;
  /** Roles allowed to see this item; omitted means everyone. */
  roles?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Clientes", href: "/clientes" },
  { label: "Orçamentos", href: "/orcamentos" },
  { label: "Serviços", href: "/servicos" },
  { label: "Garantias", href: "/garantias" },
  { label: "Revisões", href: "/revisoes" },
  { label: "Usuários", href: "/usuarios", roles: ["ADMIN"] },
];

type SessionUser = {
  name?: string;
  email?: string;
  role?: string;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  PLANNING: "Orçamento / Planejamento",
  TECHNICIAN: "Técnico",
};

export function AppSidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;
    authClient
      .getSession()
      .then(({ data }) => {
        if (active && data?.user) setUser(data.user as SessionUser);
      })
      .catch(() => {
        /* Session unavailable — the sidebar shows without user info. */
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role)),
  );

  return (
    <>
      {/* Mobile overlay — visible only when the sidebar is open on small screens. */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-tp-navy-900 text-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand area */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <span className="text-lg font-bold tracking-tight">TechPro</span>
          <span className="text-xs font-medium text-tp-green-400">
            Sistema Interno
          </span>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto py-4"
          aria-label="Navegação principal"
        >
          <ul className="flex flex-col gap-1 px-3">
            {visibleItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`block rounded-tp-sm px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-tp-green-500 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info at the bottom */}
        {user ? (
          <div className="border-t border-white/10 px-5 py-4">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-white/50">
              {ROLE_LABELS[user.role ?? ""] ?? user.role}
            </p>
          </div>
        ) : null}
      </aside>
    </>
  );
}