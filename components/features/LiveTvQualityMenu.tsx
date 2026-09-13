"use client";

import type { ReactNode } from "react";
import { Check, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LiveQualitySource {
  quality?: string | null;
  online?: boolean;
}

interface LiveTvQualityMenuProps {
  sources: LiveQualitySource[];
  activeIndex: number;
  open: boolean;
  onToggle: () => void;
  onSelect: (index: number) => void;
}

function formatSourceLabel(sources: LiveQualitySource[], index: number) {
  const source = sources[index];
  const base = source.quality?.trim() || `Fuente ${index + 1}`;

  const sameQualityCount = sources.filter(
    (item, i) => i < index && (item.quality?.trim() || `Fuente ${i + 1}`) === base,
  ).length;

  if (sameQualityCount > 0) {
    return `${base} · ${sameQualityCount + 1}`;
  }

  return base;
}

function ControlButton({
  onClick,
  label,
  active,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={active}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border bg-black/50 backdrop-blur-md transition-all sm:h-12 sm:w-12",
        active
          ? "border-gold-500/50 text-gold-400"
          : "border-white/10 text-white hover:scale-105 hover:border-gold-500/40 hover:bg-black/70 hover:text-gold-400",
      )}
    >
      {children}
    </button>
  );
}

export function LiveTvQualityMenu({
  sources,
  activeIndex,
  open,
  onToggle,
  onSelect,
}: LiveTvQualityMenuProps) {
  if (sources.length <= 1) return null;

  return (
    <div className="relative">
      <ControlButton onClick={onToggle} label="Calidad de reproducción" active={open}>
        <Settings2 size={18} />
      </ControlButton>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú de calidad"
            className="fixed inset-0 z-40 cursor-default"
            onClick={onToggle}
          />
          <div className="absolute bottom-full right-0 z-50 mb-3 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gold-500/20 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/5 px-4 py-3">
              <p className="text-sm font-semibold text-white">Calidad</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {sources.length} fuentes disponibles
              </p>
            </div>

            <ul className="max-h-56 overflow-y-auto p-2 [scrollbar-color:rgba(212,160,23,0.35)_transparent] [scrollbar-width:thin]">
              {sources.map((source, index) => {
                const selected = index === activeIndex;
                const label = formatSourceLabel(sources, index);

                return (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => onSelect(index)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "bg-gold-500/12 text-gold-300"
                          : "text-zinc-300 hover:bg-white/[0.05] hover:text-white",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{label}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
                          {source.online ? "Señal online" : "Señal alternativa"}
                        </p>
                      </div>
                      {selected && <Check size={16} className="shrink-0 text-gold-400" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
