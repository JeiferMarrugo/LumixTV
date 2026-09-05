"use client";

import { Play, Tv } from "lucide-react";
import type { LiveChannel } from "@/lib/iptv/types";

interface LiveChannelCardProps {
  channel: LiveChannel;
  onPlay: (channel: LiveChannel) => void;
}

export function LiveChannelCard({ channel, onPlay }: LiveChannelCardProps) {
  const category = channel.categories[0]?.replace(/^\w/, (c) => c.toUpperCase()) ?? "General";

  return (
    <button
      type="button"
      onClick={() => onPlay(channel)}
      className="group w-full cursor-pointer text-left"
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-overlay shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-gold-500/25 group-hover:shadow-[0_16px_40px_rgba(212,160,23,0.12)]">
        {channel.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={channel.logo}
            alt={channel.name}
            className="absolute inset-0 h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Tv size={40} className="text-zinc-700" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-600/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          En vivo
        </div>

        {channel.quality && (
          <div className="absolute right-2.5 top-2.5 rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 backdrop-blur-md">
            {channel.quality}
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-black opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100">
          <Play size={18} fill="currentColor" />
        </div>
      </div>

      <h3 className="mt-3 truncate text-sm font-semibold tracking-wide text-white transition-colors group-hover:text-gold-400">
        {channel.name}
      </h3>
      <div className="mt-2 flex gap-2">
        <span className="rounded-full border border-white/5 bg-white/[0.04] px-2.5 py-0.5 text-[11px] capitalize text-zinc-400">
          {category}
        </span>
        <span className="rounded-full border border-white/5 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-zinc-500">
          {channel.country}
        </span>
      </div>
    </button>
  );
}
