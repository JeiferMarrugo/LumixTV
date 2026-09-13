"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CONNECT_TIMEOUT_SEC = 18;
const RING_RADIUS = 40;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface LiveTvConnectionOverlayProps {
  mode: "connecting" | "buffering";
  seconds: number;
  quality?: string | null;
  sourceIndex: number;
  totalSources: number;
}

export function LiveTvConnectionOverlay({
  mode,
  seconds,
  quality,
  sourceIndex,
  totalSources,
}: LiveTvConnectionOverlayProps) {
  if (mode === "buffering") {
    return (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/50 px-6 backdrop-blur-[1px]">
        <Loader2 size={32} className="animate-spin text-gold-400" />
        <p className="text-sm font-medium text-zinc-300">Buffering...</p>
      </div>
    );
  }

  const clampedSeconds = Math.min(Math.max(seconds, 0), CONNECT_TIMEOUT_SEC);
  const progress = clampedSeconds / CONNECT_TIMEOUT_SEC;
  const remaining = Math.max(CONNECT_TIMEOUT_SEC - clampedSeconds, 0);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
  const hasAlternates = totalSources > 1 && sourceIndex < totalSources - 1;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-black/70 px-6 backdrop-blur-[2px]">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-2 animate-ping rounded-full bg-gold-500/10" />

        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 96 96"
          aria-hidden
        >
          <defs>
            <linearGradient id="live-connect-ring" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b8860b" />
              <stop offset="100%" stopColor="#f5d061" />
            </linearGradient>
          </defs>
          <circle
            cx="48"
            cy="48"
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="5"
          />
          <circle
            cx="48"
            cy="48"
            r={RING_RADIUS}
            fill="none"
            stroke="url(#live-connect-ring)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        <div className="relative flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums leading-none text-gold-300">
            {remaining}
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            seg
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-white">Conectando al canal...</p>
        <p className="mt-1.5 text-xs text-zinc-400">
          Fuente {sourceIndex + 1} de {totalSources}
          {quality ? ` · ${quality}` : ""}
        </p>
        {hasAlternates && remaining <= 15 && remaining > 0 && (
          <p
            className={cn(
              "mt-2 text-[11px] font-medium text-amber-300/90",
              remaining <= 5 && "animate-pulse",
            )}
          >
            Probando otra señal en {remaining}s...
          </p>
        )}
      </div>
    </div>
  );
}

export { CONNECT_TIMEOUT_SEC };
