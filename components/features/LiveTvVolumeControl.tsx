"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveTvVolumeControlProps {
  volume: number;
  muted: boolean;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
  className?: string;
}

function VolumeIcon({ volume, muted }: { volume: number; muted: boolean }) {
  if (muted || volume === 0) return <VolumeX size={18} />;
  if (volume < 0.45) return <Volume1 size={18} />;
  return <Volume2 size={18} />;
}

export function LiveTvVolumeControl({
  volume,
  muted,
  onToggleMute,
  onVolumeChange,
  className,
}: LiveTvVolumeControlProps) {
  const level = muted ? 0 : volume;
  const percent = Math.round(level * 100);

  return (
    <div
      className={cn(
        "hidden h-11 items-center gap-2.5 rounded-full border border-white/10 bg-black/50 px-3 backdrop-blur-md sm:flex sm:h-12 sm:gap-3 sm:px-3.5",
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Activar sonido" : "Silenciar"}
        className="shrink-0 text-white transition-colors hover:text-gold-400"
      >
        <VolumeIcon volume={volume} muted={muted} />
      </button>

      <div className="group/vol relative flex w-[88px] items-center lg:w-[112px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-amber-300 transition-[width] duration-100"
            style={{ width: `${percent}%` }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={level}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          className="live-tv-volume-input relative z-10 w-full cursor-pointer appearance-none bg-transparent"
          aria-label="Volumen"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        />
      </div>

      <span className="hidden w-8 text-right text-[11px] font-semibold tabular-nums text-zinc-400 lg:inline">
        {percent}%
      </span>
    </div>
  );
}
