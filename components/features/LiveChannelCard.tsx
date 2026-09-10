"use client";

import Image from "next/image";
import { Play, Tv } from "lucide-react";
import type { LiveChannel } from "@/lib/live-tv/types";

interface LiveChannelCardProps {
  channel: Pick<LiveChannel, "id" | "name" | "logo" | "countryCode" | "categories">;
  onSelect: (channelId: string) => void;
}

export function LiveChannelCard({ channel, onSelect }: LiveChannelCardProps) {
  const category = channel.categories[0];

  return (
    <button
      type="button"
      onClick={() => onSelect(channel.id)}
      className="group block w-full text-left"
      aria-label={`Reproducir ${channel.name}`}
    >
      <article>
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-overlay shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-gold-500/25 group-hover:shadow-[0_16px_40px_rgba(212,160,23,0.12)]">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 via-black to-zinc-950 p-6">
            {channel.logo ? (
              <Image
                src={channel.logo}
                alt={channel.name}
                fill
                unoptimized
                className="object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 280px"
              />
            ) : (
              <Tv size={32} className="text-zinc-600" strokeWidth={1.5} />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-70" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />

          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="rounded-full bg-gold-500 p-3.5 text-black shadow-lg transition-transform group-hover:scale-110">
              <Play size={20} fill="currentColor" />
            </span>
          </div>

          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-600/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            En vivo
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <h3 className="mt-3 truncate text-sm font-semibold tracking-wide text-white transition-colors group-hover:text-gold-400">
          {channel.name}
        </h3>
        <div className="mt-2 flex gap-2">
          {category && (
            <span className="truncate rounded-full border border-white/5 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-zinc-400">
              {category}
            </span>
          )}
          <span className="rounded-full border border-white/5 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-zinc-500">
            {channel.countryCode}
          </span>
        </div>
      </article>
    </button>
  );
}
