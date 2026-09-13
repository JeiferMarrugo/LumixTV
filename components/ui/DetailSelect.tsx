"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DetailSelectOption {
  value: string;
  label: string;
  /** Prefijo corto, p. ej. "E1" */
  badge?: string;
}

interface DetailSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DetailSelectOption[];
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  menuMinWidth?: number;
}

export function DetailSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  loading = false,
  className,
  menuMinWidth = 260,
}: DetailSelectProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setMenuStyle({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, menuMinWidth),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, menuMinWidth]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;

      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;

      setOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [open, menuId]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const menu =
    open && menuStyle && typeof document !== "undefined"
      ? createPortal(
          <div
            id={menuId}
            role="listbox"
            className={cn(
              "fixed z-[200] overflow-hidden rounded-2xl",
              "border border-border bg-popover",
              "shadow-[0_16px_40px_rgba(0,0,0,0.12)]",
              "dark:border-white/[0.08] dark:bg-gradient-to-br dark:from-zinc-900/98 dark:via-zinc-950/99 dark:to-black",
              "dark:shadow-[0_24px_60px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.05)]",
              "backdrop-blur-xl",
            )}
            style={{
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
            }}
          >
            <div className="border-b border-border px-4 py-2.5 dark:border-white/[0.06]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </p>
            </div>
            <ul className="max-h-64 overflow-y-auto py-1.5 [scrollbar-color:rgba(212,160,23,0.35)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gold-500/30 [&::-webkit-scrollbar-track]:bg-transparent">
              {options.map((option) => {
                const isSelected = option.value === value;
                const badge = option.badge ?? option.label.split(" — ")[0]?.slice(0, 6);

                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "mx-1.5 flex w-[calc(100%-0.75rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                        isSelected
                          ? "bg-gold-500/15 font-medium text-gold-700 ring-1 ring-gold-500/25 dark:text-gold-300"
                          : "text-foreground hover:bg-muted dark:text-zinc-300 dark:hover:bg-white/[0.05] dark:hover:text-white",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 min-w-[2rem] shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
                          isSelected
                            ? "bg-gold-500 text-black"
                            : "bg-muted text-muted-foreground dark:bg-white/[0.06] dark:text-zinc-400",
                        )}
                      >
                        {badge}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn("min-w-[9rem] flex-1 sm:flex-none", className)}>
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || loading}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-xl border px-3.5 text-sm transition-all duration-200",
          "border-border bg-muted/60 text-foreground",
          "hover:border-gold-500/30 hover:bg-muted",
          "dark:border-white/[0.08] dark:bg-black/35 dark:text-white dark:hover:border-gold-500/25 dark:hover:bg-black/45",
          open && "border-gold-500/35 shadow-[0_0_0_3px_rgba(212,160,23,0.08)]",
          (disabled || loading) && "cursor-not-allowed opacity-50",
        )}
      >
        <span className="truncate">
          {loading ? "Cargando..." : (selected?.label ?? "Seleccionar")}
        </span>
        {loading ? (
          <Loader2 size={15} className="shrink-0 animate-spin text-gold-400" />
        ) : (
          <ChevronDown
            size={15}
            className={cn("shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180 text-gold-600 dark:text-gold-400")}
          />
        )}
      </button>
      {menu}
    </div>
  );
}
