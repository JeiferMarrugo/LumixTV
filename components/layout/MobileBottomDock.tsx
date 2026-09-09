"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Plus, User, X } from "lucide-react";
import type { NotchItemData } from "@/components/ui/adaptive-notch-navigation-bar";
import { cn } from "@/lib/utils";

interface MobileBottomDockProps {
  items: NotchItemData[];
  activeId: string;
  onNavigate?: (id: string) => void;
  profileSlot?: React.ReactNode;
}

function BottomNotch() {
  return (
    <svg
      viewBox="0 0 48 14"
      aria-hidden
      className="pointer-events-none absolute -top-[13px] left-1/2 h-3.5 w-12 -translate-x-1/2"
    >
      <path
        d="M0 14 V10 Q24 -2 48 10 V14 H0 Z"
        className="fill-zinc-950"
      />
      <path
        d="M18 10 Q24 2 30 10"
        className="fill-none stroke-white/20 stroke-[1.5]"
      />
    </svg>
  );
}

export function MobileBottomDock({
  items,
  activeId,
  onNavigate,
  profileSlot,
}: MobileBottomDockProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [activeId]);

  useEffect(() => {
    if (!expanded) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  const dockLeft = items.filter((item) => item.id === "home" || item.id === "movies");
  const dockRight = items.filter((item) => item.id === "live");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <AnimatePresence>
        {expanded && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Cerrar menú"
            className="pointer-events-auto absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none relative mx-auto flex max-w-md justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="pointer-events-auto absolute bottom-full mb-3 w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-[0_-8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            >
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Explorar
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map(({ id, label, icon: Icon, href, badge }) => {
                  const active = activeId === id;

                  return (
                    <Link
                      key={id}
                      href={href}
                      onClick={() => {
                        onNavigate?.(id);
                        setExpanded(false);
                      }}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                        active
                          ? "bg-gold-500 text-black shadow-sm shadow-gold-500/25"
                          : "bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]",
                      )}
                    >
                      <Icon size={18} strokeWidth={1.75} />
                      <span className="truncate">{label}</span>
                      {badge && (
                        <span className="ml-auto text-[9px] font-bold uppercase text-gold-400">
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-auto relative">
          <BottomNotch />

          {expanded && (
            <div
              aria-hidden
              className="absolute -top-1 left-1/2 h-8 w-16 -translate-x-1/2 rounded-full bg-white/10 blur-xl"
            />
          )}

          <div className="flex items-center gap-1 rounded-[1.75rem] border border-white/10 bg-zinc-950/95 px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            {dockLeft.map(({ id, label, icon: Icon, href }) => {
              const active = activeId === id;

              return (
                <Link
                  key={id}
                  href={href}
                  onClick={() => onNavigate?.(id)}
                  aria-label={label}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                    active
                      ? "bg-gold-500/15 text-gold-400"
                      : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200",
                  )}
                >
                  <Icon size={20} strokeWidth={1.75} />
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-label={expanded ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={expanded}
              className={cn(
                "relative mx-1 flex h-12 w-12 items-center justify-center rounded-full transition-all",
                expanded
                  ? "bg-zinc-800 text-zinc-200 ring-2 ring-white/20"
                  : "bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.25)]",
              )}
            >
              <motion.span
                animate={{ rotate: expanded ? 45 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                {expanded ? <X size={22} strokeWidth={2} /> : <Plus size={22} strokeWidth={2} />}
              </motion.span>
            </button>

            {dockRight.map(({ id, label, icon: Icon, href }) => {
              const active = activeId === id;

              return (
                <Link
                  key={id}
                  href={href}
                  onClick={() => onNavigate?.(id)}
                  aria-label={label}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                    active
                      ? "bg-gold-500/15 text-gold-400"
                      : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-200",
                  )}
                >
                  <Icon size={20} strokeWidth={1.75} />
                </Link>
              );
            })}

            {profileSlot && (
              <div className="flex h-11 w-11 items-center justify-center">{profileSlot}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
