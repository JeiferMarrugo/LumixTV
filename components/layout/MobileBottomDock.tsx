"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { NotchItemData } from "@/components/ui/adaptive-notch-navigation-bar";
import { cn } from "@/lib/utils";

interface MobileBottomDockProps {
  items: NotchItemData[];
  activeId: string;
  onNavigate?: (id: string) => void;
}

const SHORT_LABELS: Record<string, string> = {
  home: "Inicio",
  movies: "Pelis",
  series: "Series",
  anime: "Anime",
  live: "Vivo",
};

export function MobileBottomDock({ items, activeId, onNavigate }: MobileBottomDockProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200/80 bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-white/[0.06] dark:bg-zinc-950/95 dark:shadow-none lg:hidden"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto grid max-w-lg grid-cols-5 px-1">
        {items.map(({ id, label, icon: Icon, href, badge }) => {
          const active = activeId === id;
          const tabLabel = SHORT_LABELS[id] ?? label;

          return (
            <Link
              key={id}
              href={href}
              onClick={() => onNavigate?.(id)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 px-0.5 py-2 transition-colors",
                active ? "text-gold-700 dark:text-gold-400" : "text-zinc-500 active:text-zinc-700 dark:active:text-zinc-300",
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-tab-indicator"
                  className="absolute inset-x-1.5 inset-y-1 rounded-xl bg-gold-500/12 ring-1 ring-gold-500/25 dark:ring-gold-500/20"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}

              <span className="relative flex items-center justify-center">
                <Icon size={21} strokeWidth={active ? 2.25 : 1.85} />
                {badge && !active && (
                  <span
                    aria-hidden
                    className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950"
                  />
                )}
              </span>

              <span
                className={cn(
                  "relative max-w-full truncate text-[10px] leading-none tracking-wide",
                  active ? "font-semibold text-gold-700 dark:text-gold-400" : "font-medium text-zinc-500",
                )}
              >
                {tabLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
