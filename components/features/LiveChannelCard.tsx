"use client";

import { BadgeCheck, Play } from "lucide-react";
import type { LiveChannel } from "@/lib/iptv/types";
import { ChannelLogoFrame } from "@/components/ui/ChannelLogoFrame";
import { cn } from "@/lib/utils";

function formatCategory(value: string) {
  return value.replace(/^\w/, (char) => char.toUpperCase());
}

interface LiveChannelCardProps {
  channel: LiveChannel;
  onPlay: (channel: LiveChannel) => void;
  compact?: boolean;
}

export function LiveChannelCard({ channel, onPlay, compact = false }: LiveChannelCardProps) {
  const category = formatCategory(channel.categories[0] ?? "general");
  const isOnline = channel.streamOnline !== false;

  return (
    <button
      type="button"
      onClick={() => onPlay(channel)}
      className="group w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <div
        className={cn(
          "relative aspect-video overflow-hidden rounded-2xl",
          "border border-white/[0.08] bg-[#0a0a0c]",
          "shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
          "transition-all duration-300 ease-out",
          "group-hover:-translate-y-0.5 group-hover:border-gold-500/25",
          "group-hover:shadow-[0_12px_36px_rgba(0,0,0,0.45),0_0_0_1px_rgba(212,160,23,0.12)]",
        )}
      >
        <ChannelLogoFrame logo={channel.logo} alt={channel.name} compact={compact} />

        <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 via-black/35 to-transparent px-2.5 pb-6 pt-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              {isOnline ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-red-600/95 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-sm">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-zinc-500/40 bg-zinc-700/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-200">
                  Sin señal
                </span>
              )}
              {channel.verified && (
                <span
                  className="inline-flex items-center gap-0.5 rounded-md border border-emerald-500/30 bg-emerald-600/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white"
                  title="Verificado"
                >
                  <BadgeCheck size={9} />
                  OK
                </span>
              )}
            </div>

            {channel.quality && (
              <span className="shrink-0 rounded-md border border-gold-500/30 bg-black/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-gold-400 backdrop-blur-sm">
                {channel.quality}
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center",
            "bg-black/0 transition-all duration-300",
            "group-hover:bg-black/45 group-hover:backdrop-blur-[1px]",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-gold-500 text-black",
              "ring-4 ring-gold-500/20",
              "shadow-[0_8px_28px_rgba(0,0,0,0.5)]",
              "scale-[0.82] opacity-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]",
              "group-hover:scale-100 group-hover:opacity-100",
              compact ? "h-10 w-10" : "h-12 w-12",
            )}
          >
            <Play size={compact ? 16 : 20} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
      </div>

      <div className="mt-2.5 space-y-1 px-0.5">
        <h3
          className={cn(
            "truncate font-semibold text-white transition-colors duration-200 group-hover:text-gold-400",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {channel.name}
        </h3>
        <p className="truncate text-[11px] text-zinc-500">
          {[category, channel.country].filter(Boolean).join(" · ")}
        </p>
      </div>
    </button>
  );
}
