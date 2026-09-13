"use client";

import Image from "next/image";
import { Play, Tv } from "lucide-react";
import type { LiveChannel } from "@/lib/live-tv/types";
import { cn } from "@/lib/utils";

/** Sombra para logos sobre fondos claros y oscuros */
const LOGO_FILTER =
  "drop-shadow(0 1px 3px rgba(0,0,0,0.2)) drop-shadow(0 4px 14px rgba(0,0,0,0.12))";

interface LiveChannelCardProps {
  channel: Pick<LiveChannel, "id" | "name" | "logo" | "countryCode" | "categories">;
  onSelect: (channelId: string) => void;
  compact?: boolean;
}

function formatLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function LiveChannelCard({ channel, onSelect, compact = false }: LiveChannelCardProps) {
  const category = channel.categories[0];

  return (
    <button
      type="button"
      onClick={() => onSelect(channel.id)}
      className="group block w-full text-left"
      aria-label={`Reproducir ${channel.name}`}
    >
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white",
          "shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300",
          "group-hover:-translate-y-1 group-hover:border-gold-500/35",
          "group-hover:shadow-[0_16px_40px_rgba(212,160,23,0.14),0_4px_16px_rgba(0,0,0,0.06)]",
          "dark:border-white/[0.08] dark:bg-zinc-900/90",
          "dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
          "dark:group-hover:shadow-[0_16px_40px_rgba(212,160,23,0.12)]",
          compact && "rounded-xl",
        )}
      >
        {/* Zona del logo */}
        <div
          className={cn(
            "relative overflow-hidden",
            "bg-gradient-to-br from-zinc-100 via-white to-zinc-50",
            "dark:from-zinc-900 dark:via-zinc-950 dark:to-black",
            compact ? "aspect-[4/3]" : "aspect-[16/11] sm:aspect-[16/10]",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(212,160,23,0.12) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(212,160,23,0.08) 0%, transparent 40%)",
            }}
          />

          {/* Escenario del logo */}
          <div
            className={cn(
              "absolute inset-x-3 top-3 bottom-2 flex items-center justify-center sm:inset-x-4 sm:top-4 sm:bottom-3",
              compact && "inset-x-2 top-2 bottom-1.5",
            )}
          >
            <div
              className={cn(
                "relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl",
                "border border-zinc-200/70 bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_20px_rgba(0,0,0,0.06)]",
                "dark:border-white/10 dark:bg-zinc-800/60 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.35)]",
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,160,23,0.06)_0%,transparent_70%)]"
              />

              {channel.logo ? (
                <Image
                  src={channel.logo}
                  alt=""
                  width={160}
                  height={90}
                  unoptimized
                  className={cn(
                    "relative z-10 object-contain transition-transform duration-500 ease-out group-hover:scale-[1.04]",
                    compact ? "max-h-[68%] max-w-[82%]" : "max-h-[70%] max-w-[86%]",
                  )}
                  style={{ filter: LOGO_FILTER }}
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 180px"
                />
              ) : (
                <Tv
                  size={compact ? 26 : 34}
                  className="relative z-10 text-zinc-400 dark:text-zinc-500"
                  strokeWidth={1.5}
                  aria-hidden
                />
              )}
            </div>
          </div>

          {/* Overlay play */}
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100 group-active:bg-black/30">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-500 text-black shadow-[0_4px_20px_rgba(212,160,23,0.45)] transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12">
              <Play size={compact ? 18 : 20} fill="currentColor" className="ml-0.5" />
            </span>
          </div>

          {/* Badge en vivo */}
          <div className="absolute left-2.5 top-2.5 z-30 flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_2px_10px_rgba(220,38,38,0.35)] sm:left-3 sm:top-3">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            En vivo
          </div>
        </div>

        {/* Info */}
        <div
          className={cn(
            "border-t border-zinc-100 px-3.5 py-3 dark:border-white/[0.06]",
            compact && "px-2.5 py-2.5",
          )}
        >
          <h3
            className={cn(
              "truncate font-semibold leading-snug text-zinc-900 transition-colors",
              "group-hover:text-gold-700 dark:text-zinc-50 dark:group-hover:text-gold-400",
              compact ? "text-xs" : "text-sm sm:text-[15px]",
            )}
          >
            {channel.name}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {category && (
              <span
                className={cn(
                  "max-w-full truncate rounded-md px-2 py-0.5 text-[10px] font-medium sm:text-[11px]",
                  "bg-gold-500/10 text-gold-800 ring-1 ring-gold-500/20",
                  "dark:bg-gold-500/12 dark:text-gold-300 dark:ring-gold-500/25",
                )}
              >
                {formatLabel(category)}
              </span>
            )}
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide sm:text-[11px]",
                "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80",
                "dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/[0.08]",
              )}
            >
              {channel.countryCode}
            </span>
          </div>
        </div>

        {/* Acento inferior al hover */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-0 transition-all duration-300 group-hover:scale-x-100 group-hover:opacity-100" />
      </article>
    </button>
  );
}
