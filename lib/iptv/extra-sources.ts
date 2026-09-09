import {
  buildExtraChannelId,
  hashUrl,
} from "@/lib/iptv/channel-sources";
import { fetchM3uEntries, type M3uEntry } from "@/lib/iptv/m3u";
import { NEXUS_DEFAULT_M3U_URLS } from "@/lib/iptv/nexus";
import type { EnrichedIptvStream, IptvChannel } from "@/lib/iptv/types";

export interface ExtraChannelEntry {
  id: string;
  displayName: string;
  matchedChannelId: string | null;
  country: string;
  categories: string[];
  logo?: string;
  altNames?: string[];
  playlistLabel: string;
  stream: EnrichedIptvStream;
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

function getExtraM3uUrls() {
  const defaults = [...NEXUS_DEFAULT_M3U_URLS];
  const raw = process.env.LIVE_EXTRA_M3U_URLS?.trim();
  if (!raw) return defaults;

  const custom = raw
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  return [...new Set([...defaults, ...custom])];
}

function playlistLabelFromUrl(url: string) {
  try {
    const { hostname, pathname } = new URL(url);
    const file = pathname.split("/").filter(Boolean).pop();
    return file ? `${hostname}/${file}` : hostname.replace(/^www\./, "");
  } catch {
    return "Servidor";
  }
}

function inferCategories(group?: string) {
  if (!group) return ["general"];
  const value = group.toLowerCase();
  if (/sport|fútbol|futbol|football|deporte/.test(value)) return ["sports"];
  if (/news|noticia/.test(value)) return ["news"];
  if (/movie|pelic|cinema|cine/.test(value)) return ["movies"];
  if (/music|música|musica/.test(value)) return ["music"];
  if (/kid|niño|infantil|cartoon/.test(value)) return ["kids"];
  if (/doc/.test(value)) return ["documentary"];
  return ["general"];
}

function matchEntryToChannel(entry: M3uEntry, channelsById: Map<string, IptvChannel>) {
  if (entry.channelId) {
    const direct = channelsById.get(entry.channelId);
    if (direct) return direct;
  }

  const entryKey = normalizeKey(entry.name);
  if (!entryKey) return null;

  for (const channel of channelsById.values()) {
    const candidates = [channel.id, channel.name, ...(channel.alt_names ?? [])];
    for (const candidate of candidates) {
      if (normalizeKey(candidate) === entryKey) return channel;
    }
  }

  return null;
}

export async function loadExtraChannelEntries(
  channels: IptvChannel[],
  pickLogo: (channelId: string) => string | undefined,
): Promise<ExtraChannelEntry[]> {
  const urls = getExtraM3uUrls();
  if (!urls.length) return [];

  const channelsById = new Map(channels.map((channel) => [channel.id, channel]));
  const results = await Promise.allSettled(urls.map((url) => fetchM3uEntries(url)));
  const entries: ExtraChannelEntry[] = [];
  const seenUrls = new Set<string>();

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (result.status !== "fulfilled") continue;

    const playlistUrl = urls[index] ?? "";
    const playlistLabel = playlistLabelFromUrl(playlistUrl);

    for (const entry of result.value) {
      if (!entry.url) continue;

      const urlKey = entry.url.trim();
      const urlHash = hashUrl(urlKey);
      if (seenUrls.has(urlHash)) continue;
      seenUrls.add(urlHash);

      const matched = matchEntryToChannel(entry, channelsById);
      const stream: EnrichedIptvStream = {
        channel: matched?.id ?? null,
        title: entry.name,
        url: urlKey,
        verified: false,
        source: "extra",
        sourceDetail: playlistLabel,
      };

      entries.push({
        id: buildExtraChannelId(urlKey),
        displayName: matched?.name ?? entry.name,
        matchedChannelId: matched?.id ?? null,
        country: matched?.country ?? "INT",
        categories: matched?.categories?.length
          ? matched.categories
          : inferCategories(entry.group),
        logo: matched ? pickLogo(matched.id) : undefined,
        altNames: matched?.alt_names,
        playlistLabel,
        stream,
      });
    }
  }

  return entries;
}

export function hasExtraM3uSources() {
  return getExtraM3uUrls().length > 0;
}
