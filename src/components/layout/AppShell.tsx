import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Painel" },
  { to: "/importacoes", label: "Importações" },
  { to: "/configuracoes/automacao", label: "Automação CEPEA" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-header text-header-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-header-foreground/10 text-sm font-bold">
              GO
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Cotações CEPEA Goiânia</p>
              <p className="text-[11px] leading-tight text-header-foreground/70">
                Painel gerencial privado
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-header-foreground/80 transition-colors hover:bg-header-foreground/10 hover:text-header-foreground",
                  pathname === item.to && "bg-header-foreground/15 text-header-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user?.email && <span className="text-xs text-header-foreground/70">{user.email}</span>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-header-foreground hover:bg-header-foreground/10 md:hidden"
            onClick={() => setMenuAberto((v) => !v)}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </button>
        </div>

        {menuAberto && (
          <div className="border-t border-header-foreground/10 px-4 pb-3 md:hidden">
            <nav className="flex flex-col gap-1 pt-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuAberto(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium text-header-foreground/80 hover:bg-header-foreground/10 hover:text-header-foreground",
                    pathname === item.to && "bg-header-foreground/15 text-header-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-2 flex items-center justify-between border-t border-header-foreground/10 pt-2">
              {user?.email && (
                <span className="truncate text-xs text-header-foreground/70">{user.email}</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-header-foreground hover:bg-header-foreground/10 hover:text-header-foreground"
              >
                <LogOut className="size-4" />
                Sair
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Cotações CEPEA Goiânia — dados do Compacto de Preços da Pecuária de Corte (região
        GO-Goiânia).
      </footer>
    </div>
  );
}
