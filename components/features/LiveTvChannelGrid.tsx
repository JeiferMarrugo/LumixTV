"use client";

import { LiveChannelCard } from "@/components/features/LiveChannelCard";
import type { LiveChannel } from "@/lib/iptv/types";
import { cn } from "@/lib/utils";

interface LiveTvChannelGridProps {
  channels: LiveChannel[];
  onPlay: (channel: LiveChannel) => void;
  className?: string;
}

export function LiveTvChannelGrid({ channels, onPlay, className }: LiveTvChannelGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7",
        className,
      )}
    >
      {channels.map((channel) => (
        <LiveChannelCard key={channel.id} channel={channel} onPlay={onPlay} />
      ))}
    </div>
  );
}
