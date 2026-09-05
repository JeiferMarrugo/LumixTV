"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Film,
  Tv,
  Sparkles,
  Radio,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/peliculas", label: "Películas", icon: Film },
  { href: "/series", label: "Series", icon: Tv },
  { href: "/anime", label: "Anime", icon: Sparkles },
  { href: "/live-tv", label: "TV en Vivo", icon: Radio },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border-subtle bg-surface">
      <div className="relative flex justify-center border-b border-border-subtle px-5 py-8">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        <Logo size="md" align="center" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gold-500/15 text-gold-500"
                  : "text-zinc-400 hover:bg-surface-overlay hover:text-white"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-gold-500" : "text-zinc-500"}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
