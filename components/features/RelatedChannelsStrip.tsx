"use client";

import type { LiveChannel } from "@/lib/iptv/types";
import { ChannelLogoFrame } from "@/components/ui/ChannelLogoFrame";
import { cn } from "@/lib/utils";

interface RelatedChannelsStripProps {
  family: string;
  channels: LiveChannel[];
  activeChannelId: string;
  onSelect: (channel: LiveChannel) => void;
  className?: string;
}

export function RelatedChannelsStrip({
  family,
  channels,
  activeChannelId,
  onSelect,
  className,
}: RelatedChannelsStripProps) {
  if (channels.length === 0) return null;

  return (
    <div className={cn("border-t border-white/10 bg-black/85 px-4 py-4 backdrop-blur-md sm:px-6", className)}>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
        Más canales {family}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {channels.map((item) => {
          const active = item.id === activeChannelId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={cn(
                "group flex w-[132px] shrink-0 flex-col overflow-hidden rounded-xl border text-left transition-all",
                active
                  ? "border-gold-500/50 bg-gold-500/10 ring-1 ring-gold-500/30"
                  : "border-white/10 bg-white/[0.04] hover:border-gold-500/30 hover:bg-white/[0.07]",
              )}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
                <ChannelLogoFrame logo={item.logo} alt={item.name} compact />
                {item.verified && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-emerald-600/90 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                    ✓
                  </span>
                )}
                {item.quality && (
                  <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-200">
                    {item.quality}
                  </span>
                )}
              </div>
              <div className="px-2.5 py-2">
                <p className={cn("truncate text-xs font-semibold", active ? "text-gold-400" : "text-white")}>
                  {item.name}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-zinc-500">{item.country}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
