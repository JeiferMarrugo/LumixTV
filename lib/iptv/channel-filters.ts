import type { LiveChannel } from "@/lib/iptv/types";

const QUALITY_RANK: Record<string, number> = {
  "4K": 5,
  "2160p": 5,
  "1440p": 4,
  "1080p": 4,
  "720p": 3,
  "576p": 2,
  "480p": 2,
  "360p": 1,
};

export type LiveStreamFilter = "working" | "all";

export function isHdChannel(channel: LiveChannel) {
  if (!channel.quality) return false;
  return (QUALITY_RANK[channel.quality] ?? 0) >= 3;
}

export function isWorkingChannel(channel: LiveChannel) {
  return channel.streamOnline !== false;
}

export function filterByStreamStatus(channels: LiveChannel[], mode: LiveStreamFilter) {
  if (mode === "all") return channels;
  return channels.filter(isWorkingChannel);
}

export function filterByHd(channels: LiveChannel[], hdOnly: boolean) {
  if (!hdOnly) return channels;
  return channels.filter(isHdChannel);
}
