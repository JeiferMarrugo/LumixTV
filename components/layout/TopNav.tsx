"use client";

import Link from "next/link";
import { Suspense, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Film, Home, Menu, Radio, Sparkles, Tv, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { SearchBar } from "@/components/features/SearchBar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/peliculas", label: "Películas", icon: Film },
  { href: "/series", label: "Series", icon: Tv },
  { href: "/anime", label: "Anime", icon: Sparkles },
  { href: "/live-tv", label: "TV en Vivo", icon: Radio },
] as const;

function SearchFallback() {
  return (
    <div className="h-10 w-full max-w-md animate-pulse rounded-full bg-surface-raised" />
  );
}

interface TopNavProps {
  isAuthenticated?: boolean;
}

export function TopNav({ isAuthenticated = false }: TopNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3 sm:gap-5">
          <Logo size="sm" align="left" />

          <nav
            ref={navRef}
            className="hidden flex-1 items-center justify-center lg:flex"
            aria-label="Principal"
          >
            <div className="relative flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] p-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      active ? "text-gold-400" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="topnav-pill"
                        className="absolute inset-0 rounded-full border border-gold-500/20 bg-gold-500/10 shadow-[0_0_20px_rgba(212,160,23,0.12)]"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    )}
                    <Icon size={15} className="relative shrink-0" />
                    <span className="relative">{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="hidden min-w-0 flex-1 lg:block">
            <Suspense fallback={<SearchFallback />}>
              <SearchBar />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <UserMenu serverAuthenticated={isAuthenticated} />

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-zinc-300 transition-colors hover:border-gold-500/30 hover:text-gold-400 lg:hidden"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <Suspense fallback={<SearchFallback />}>
            <SearchBar />
          </Suspense>
        </div>

        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-t border-white/[0.06] py-3 lg:hidden"
            aria-label="Menú móvil"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                      active
                        ? "border-gold-500/30 bg-gold-500/10 text-gold-400"
                        : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </div>
    </header>
  );
}
