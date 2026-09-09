"use client";

import { cn } from "@/lib/utils";

interface LiveTvResultsBarProps {
  showing: number;
  total: number;
  hint?: string;
  className?: string;
}

export function LiveTvResultsBar({ showing, total, hint, className }: LiveTvResultsBarProps) {
  const progress = total > 0 ? Math.min(100, (showing / total) * 100) : 0;

  return (
    <div
      className={cn(
        "mb-5 overflow-hidden rounded-xl border border-border-subtle bg-surface-raised/60 px-4 py-3 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-400">
          Mostrando{" "}
          <span className="font-semibold text-white">{showing.toLocaleString("es")}</span> de{" "}
          <span className="font-semibold text-gold-400">{total.toLocaleString("es")}</span> canales
        </p>
        {hint && <p className="text-xs text-zinc-600">{hint}</p>}
      </div>
      {total > showing && (
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
