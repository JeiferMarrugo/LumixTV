import type { IptvStream } from "@/lib/iptv/types";

export const NEXUS_BASE = "https://dearbulut.github.io/iptv/api/v1";
export const NEXUS_SITE = "https://dearbulut.github.io/iptv";
const NEXUS_ONLINE_CHANNELS_URL = `${NEXUS_BASE}/channels.online.json`;
const NEXUS_STREAMS_URL = `${NEXUS_BASE}/streams.json`;
const NEXUS_BEST_M3U_URL = "https://dearbulut.github.io/iptv/playlists/best.m3u";

/** URLs útiles para pruebas manuales (API estática, sin key). */
export const NEXUS_API_URLS = {
  openapi: `${NEXUS_SITE}/api/v1/openapi.json`,
  manifest: `${NEXUS_BASE}/index.json`,
  channelsOnline: NEXUS_ONLINE_CHANNELS_URL,
  channels: `${NEXUS_BASE}/channels.json`,
  streams: NEXUS_STREAMS_URL,
  health: `${NEXUS_BASE}/health.json`,
  search: `${NEXUS_BASE}/search.json`,
  channelById: (id: string) => `${NEXUS_BASE}/channels/${encodeURIComponent(id)}.json`,
  byCountry: (code: string) => `${NEXUS_BASE}/by-country/${encodeURIComponent(code)}.json`,
  byCategory: (key: string) => `${NEXUS_BASE}/by-category/${encodeURIComponent(key)}.json`,
  bestM3u: NEXUS_BEST_M3U_URL,
  playlistsIndex: `${NEXUS_SITE}/playlists/index.m3u`,
} as const;

export const NEXUS_DEFAULT_M3U_URLS = [NEXUS_BEST_M3U_URL] as const;

export interface NexusStreamHealth {
  status?: string;
  score?: number;
  uptime?: number;
  latency_ms?: number;
  media?: {
    variants?: number;
    width?: number | null;
    height?: number | null;
  };
}

export interface NexusStream extends IptvStream {
  rank?: number;
  sources?: string[];
  health?: NexusStreamHealth;
}

export interface NexusOnlineChannel {
  id: string;
  name?: string;
  country?: string;
  categories?: string[];
  logo?: string | null;
  is_nsfw?: boolean;
  score?: number;
  online?: boolean;
  streams?: NexusStream[];
}

async function fetchNexusJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    throw new Error(`Nexus API error: ${url}`);
  }

  return res.json() as Promise<T>;
}

/** Canales con streams online y ranking de salud (mejor que streams.json plano). */
export async function fetchNexusOnlineChannels(): Promise<NexusOnlineChannel[]> {
  return fetchNexusJson<NexusOnlineChannel[]>(NEXUS_ONLINE_CHANNELS_URL);
}

export interface NexusManifestCounts {
  channels?: number;
  playable_channels?: number;
  online_channels?: number;
  streams?: number;
  online_streams?: number;
}

export async function fetchNexusManifestCounts(): Promise<NexusManifestCounts> {
  const manifest = await fetchNexusJson<{ counts?: NexusManifestCounts }>(
    `${NEXUS_BASE}/index.json`,
  );
  return manifest.counts ?? {};
}

/** Fallback si channels.online.json falla. */
export async function fetchNexusStreams(): Promise<NexusStream[]> {
  return fetchNexusJson<NexusStream[]>(NEXUS_STREAMS_URL);
}

export function isNexusStreamOnline(stream: NexusStream) {
  return stream.health?.status === "online";
}

/** Solo streams que pasan criterios estrictos de reproducción en navegador. */
export function isStrictlyVerifiedStream(stream: NexusStream) {
  if (!isNexusStreamOnline(stream)) return false;

  const score = stream.health?.score ?? 0;
  const latency = stream.health?.latency_ms ?? 9999;
  const url = stream.url.toLowerCase();

  if (score < 95) return false;
  if (latency > 3500) return false;

  // Redirects Pluto suelen fallar en browser aunque el health check pase.
  if (url.includes("jmp2.uk") || url.includes("pluto.tv")) return false;

  return true;
}

export function indexNexusStreamsByChannel(streams: NexusStream[]) {
  const byChannel = new Map<string, NexusStream[]>();

  for (const stream of streams) {
    if (!stream.channel || !stream.url) continue;

    const list = byChannel.get(stream.channel) ?? [];
    list.push(stream);
    byChannel.set(stream.channel, list);
  }

  for (const [channelId, list] of byChannel) {
    list.sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));
    byChannel.set(channelId, list);
  }

  return byChannel;
}

export function indexOnlineStreamsFromChannels(channels: NexusOnlineChannel[]) {
  const byChannel = new Map<string, NexusStream[]>();

  for (const channel of channels) {
    if (!channel.id) continue;

    const onlineStreams = (channel.streams ?? [])
      .filter(isNexusStreamOnline)
      .sort((a, b) => {
        const rankDiff = (b.rank ?? 0) - (a.rank ?? 0);
        if (rankDiff !== 0) return rankDiff;
        return (b.health?.score ?? 0) - (a.health?.score ?? 0);
      });

    if (onlineStreams.length) {
      byChannel.set(channel.id, onlineStreams);
    }
  }

  return byChannel;
}

export function indexOnlineNexusStreams(streams: NexusStream[]) {
  const byChannel = indexNexusStreamsByChannel(streams);

  for (const [channelId, list] of byChannel) {
    const online = list.filter(isNexusStreamOnline);
    if (online.length) byChannel.set(channelId, online);
    else byChannel.delete(channelId);
  }

  return byChannel;
}

export async function loadNexusOnlineByChannel() {
  try {
    const channels = await fetchNexusOnlineChannels();
    return indexOnlineStreamsFromChannels(channels);
  } catch {
    const streams = await fetchNexusStreams().catch(() => [] as NexusStream[]);
    return indexOnlineNexusStreams(streams);
  }
}
