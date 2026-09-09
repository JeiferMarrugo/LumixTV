import type { LiveChannelSource } from "@/lib/iptv/types";

export const LIVE_CHANNEL_SOURCE_ORDER: Record<LiveChannelSource, number> = {
  "iptv-org": 0,
  nexus: 1,
  extra: 2,
};

export const LIVE_CHANNEL_SOURCE_LABELS: Record<LiveChannelSource, string> = {
  "iptv-org": "IPTV-org",
  nexus: "Nexus",
  extra: "Servidor",
};

export function buildNexusChannelId(baseChannelId: string) {
  return `nexus:${baseChannelId}`;
}

export function buildExtraChannelId(url: string) {
  return `extra:${hashUrl(url)}`;
}

export function hashUrl(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function parseBaseChannelId(channelId: string) {
  if (channelId.startsWith("nexus:")) return channelId.slice("nexus:".length);
  if (channelId.startsWith("extra:")) return null;
  return channelId;
}
