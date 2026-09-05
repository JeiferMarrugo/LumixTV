"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, Shield, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { isSuperAdmin } from "@/lib/roles";

export function UserMenu({ serverAuthenticated = false }: { serverAuthenticated?: boolean }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isAuthenticated = Boolean(session?.user) || serverAuthenticated;

  if (isPending && !serverAuthenticated) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-full bg-surface-overlay" />
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="flex h-9 items-center gap-2 rounded-full border border-gold-500/30 bg-surface-overlay px-4 text-sm font-medium text-gold-500 transition-colors hover:border-gold-500/60"
      >
        <User size={16} />
        Entrar
      </Link>
    );
  }

  if (!session?.user) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-full bg-surface-overlay" />
    );
  }

  const user = session.user as typeof session.user & { role?: string | null };
  const displayName = user.name?.split(" ")[0] ?? "Usuario";
  const isVerified = user.emailVerified;
  const superAdmin = isSuperAdmin(user.role);

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    setSigningOut(false);
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-full border border-gold-500/30 bg-surface-overlay pl-1.5 pr-3 text-sm transition-colors hover:border-gold-500/60"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-500/20 text-xs font-bold text-gold-500">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[100px] truncate font-medium text-white">
          {displayName}
        </span>
        {!isVerified && (
          <span className="h-2 w-2 rounded-full bg-amber-500" title="Correo sin verificar" />
        )}
        <ChevronDown
          size={14}
          className={`text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          />
          <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border-subtle bg-surface-raised shadow-xl">
            <div className="border-b border-border-subtle px-4 py-3">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
              {superAdmin && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-500">
                  <Shield size={10} />
                  Super admin
                </span>
              )}
              {!isVerified && (
                <Link
                  href="/verificar-correo"
                  className="mt-2 inline-block text-xs text-amber-400 hover:text-amber-300"
                  onClick={() => setOpen(false)}
                >
                  Verificar correo →
                </Link>
              )}
            </div>

            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-zinc-400 transition-colors hover:bg-surface-overlay hover:text-white"
            >
              <Settings size={16} />
              Editar perfil
            </Link>

            {superAdmin && (
              <Link
                href="/admin/usuarios"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-zinc-400 transition-colors hover:bg-surface-overlay hover:text-gold-500"
              >
                <Shield size={16} />
                Gestionar usuarios
              </Link>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2 border-t border-border-subtle px-4 py-3 text-sm text-zinc-400 transition-colors hover:bg-surface-overlay hover:text-red-400"
            >
              <LogOut size={16} />
              {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
