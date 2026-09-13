import { unstable_cache } from "next/cache";
import {
  fetchRawChannels,
  fetchRawStreams,
  type RawChannel,
  type RawStream,
} from "@/lib/live-tv/catalog";
import type { LiveStreamSource } from "@/lib/live-tv/types";

const CACHE_TTL_MS = 60 * 60 * 1000;

interface IptvOrgIndex {
  streamsByChannelId: Record<string, LiveStreamSource[]>;
  channelsById: Record<string, RawChannel>;
  nameIndex: Record<string, string[]>;
}

type FallbackGlobal = typeof globalThis & {
  __iptvOrgIndex?: { data: IptvOrgIndex; expiresAt: number };
  __iptvOrgInflight?: Promise<IptvOrgIndex>;
};

const g = globalThis as FallbackGlobal;

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeStreamUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function mapRawStream(stream: RawStream): LiveStreamSource {
  return {
    url: stream.url.trim(),
    referrer: stream.referrer ?? null,
    userAgent: stream.user_agent ?? null,
    quality: stream.quality ?? stream.title ?? null,
    online: undefined,
    provider: "iptv-org",
  };
}

function buildIndex(rawStreams: RawStream[], rawChannels: RawChannel[]): IptvOrgIndex {
  const channelsById: Record<string, RawChannel> = {};
  for (const channel of rawChannels) {
    if (channel.id) channelsById[channel.id] = channel;
  }

  const streamsByChannelId: Record<string, LiveStreamSource[]> = {};
  for (const stream of rawStreams) {
    const channelId = stream.channel?.trim();
    const url = stream.url?.trim();
    if (!channelId || !url) continue;

    const mapped = mapRawStream(stream);
    const bucket = streamsByChannelId[channelId] ?? [];
    if (!bucket.some((item) => normalizeStreamUrl(item.url) === normalizeStreamUrl(mapped.url))) {
      bucket.push(mapped);
    }
    streamsByChannelId[channelId] = bucket;
  }

  const nameIndex: Record<string, string[]> = {};
  for (const channel of rawChannels) {
    const normalized = normalizeName(channel.name);
    if (!normalized) continue;
    const bucket = nameIndex[normalized] ?? [];
    if (!bucket.includes(channel.id)) bucket.push(channel.id);
    nameIndex[normalized] = bucket;
  }

  return { streamsByChannelId, channelsById, nameIndex };
}

const loadPersistedIndex = unstable_cache(
  async () => {
    const [rawStreams, rawChannels] = await Promise.all([
      fetchRawStreams(),
      fetchRawChannels(),
    ]);
    return buildIndex(rawStreams, rawChannels);
  },
  ["live-tv-iptv-org-index"],
  { revalidate: 3600 },
);

async function getIptvOrgIndex(): Promise<IptvOrgIndex> {
  const now = Date.now();
  if (g.__iptvOrgIndex && g.__iptvOrgIndex.expiresAt > now) {
    return g.__iptvOrgIndex.data;
  }

  if (!g.__iptvOrgInflight) {
    g.__iptvOrgInflight = loadPersistedIndex()
      .then((data) => {
        g.__iptvOrgIndex = { data, expiresAt: Date.now() + CACHE_TTL_MS };
        g.__iptvOrgInflight = undefined;
        return data;
      })
      .catch((err) => {
        g.__iptvOrgInflight = undefined;
        throw err;
      });
  }

  return g.__iptvOrgInflight;
}

export function mergeStreamSources(
  ...groups: LiveStreamSource[][]
): LiveStreamSource[] {
  const seen = new Set<string>();
  const merged: LiveStreamSource[] = [];

  for (const group of groups) {
    for (const stream of group) {
      const key = normalizeStreamUrl(stream.url);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(stream);
    }
  }

  return merged;
}

/**
 * Orden inteligente de fuentes:
 * - Nexus online primero, luego iptv-org
 * - Nexus offline se omiten si hay alternativas iptv-org (evita 404/timeouts)
 * - Si no hay iptv-org, se usan todas las Nexus disponibles
 */
function findRelatedChannelIds(
  index: IptvOrgIndex,
  channelId: string,
  hint?: IptvOrgLookupHint,
): string[] {
  const channel = index.channelsById[channelId];
  const country = hint?.countryCode || channel?.country;
  const normalizedHint = normalizeName(hint?.name || channel?.name || "");
  if (!country || !normalizedHint) return [];

  const tokens = normalizedHint.split(" ").filter((token) => token.length >= 4);
  if (tokens.length === 0) return [];

  const related: string[] = [];
  for (const [id, meta] of Object.entries(index.channelsById)) {
    if (id === channelId || meta.country !== country) continue;
    const normalizedName = normalizeName(meta.name);
    if (tokens.some((token) => normalizedName.includes(token))) {
      related.push(id);
    }
  }

  return related;
}

function collectStreamsForChannelIds(
  index: IptvOrgIndex,
  channelIds: string[],
  labelSuffix?: string,
): LiveStreamSource[] {
  const streams: LiveStreamSource[] = [];

  for (const id of channelIds) {
    const meta = index.channelsById[id];
    const bucket = index.streamsByChannelId[id] ?? [];
    for (const stream of bucket) {
      streams.push({
        ...stream,
        quality: labelSuffix
          ? stream.quality
            ? `${stream.quality} · ${labelSuffix}`
            : labelSuffix
          : stream.quality,
      });
    }
  }

  return mergeStreamSources(streams);
}

export function orderLiveStreamSources(
  nexusStreams: LiveStreamSource[],
  iptvOrgStreams: LiveStreamSource[],
  options?: {
    relatedStreams?: LiveStreamSource[];
    customStreams?: LiveStreamSource[];
  },
): LiveStreamSource[] {
  const customStreams = options?.customStreams ?? [];
  const relatedStreams = options?.relatedStreams ?? [];
  const iptvAlternatives = mergeStreamSources(iptvOrgStreams, relatedStreams);
  const nexusOnline = nexusStreams.filter((stream) => stream.online === true);
  const nexusOffline = nexusStreams.filter((stream) => stream.online !== true);

  let ordered: LiveStreamSource[];

  if (iptvAlternatives.length > 0) {
    ordered =
      nexusOnline.length > 0
        ? mergeStreamSources(nexusOnline, iptvAlternatives)
        : mergeStreamSources(iptvAlternatives);
  } else {
    ordered = mergeStreamSources(nexusStreams.length > 0 ? nexusStreams : nexusOffline);
  }

  return mergeStreamSources(customStreams, ordered);
}

export interface IptvOrgLookupHint {
  name?: string;
  countryCode?: string;
}

export interface IptvOrgChannelStreams {
  direct: LiveStreamSource[];
  related: LiveStreamSource[];
}

async function resolveDirectChannelIds(
  index: IptvOrgIndex,
  channelId: string,
  hint?: IptvOrgLookupHint,
): Promise<string[]> {
  if (index.streamsByChannelId[channelId]?.length) {
    return [channelId];
  }

  if (!hint?.name) return [];

  const normalizedHint = normalizeName(hint.name);
  if (!normalizedHint) return [];

  const candidateIds = new Set<string>();

  for (const [name, ids] of Object.entries(index.nameIndex)) {
    if (name === normalizedHint || name.includes(normalizedHint) || normalizedHint.includes(name)) {
      for (const id of ids) candidateIds.add(id);
    }
  }

  const tokens = normalizedHint.split(" ").filter((token) => token.length >= 4);
  if (tokens.length > 0) {
    for (const [name, ids] of Object.entries(index.nameIndex)) {
      if (tokens.some((token) => name.includes(token))) {
        for (const id of ids) candidateIds.add(id);
      }
    }
  }

  return [...candidateIds].filter((id) => {
    const channel = index.channelsById[id];
    if (hint.countryCode && channel?.country && channel.country !== hint.countryCode) {
      return false;
    }
    return (index.streamsByChannelId[id] ?? []).length > 0;
  });
}

export async function getIptvOrgStreamsForChannel(
  channelId: string,
  hint?: IptvOrgLookupHint,
): Promise<IptvOrgChannelStreams> {
  try {
    const index = await getIptvOrgIndex();
    const directIds = await resolveDirectChannelIds(index, channelId, hint);
    const direct = collectStreamsForChannelIds(index, directIds);

    const relatedIds = findRelatedChannelIds(index, channelId, hint).filter(
      (id) => !directIds.includes(id),
    );
    const related: LiveStreamSource[] = [];
    for (const id of relatedIds) {
      const label = index.channelsById[id]?.name ?? "Alternativa";
      related.push(...collectStreamsForChannelIds(index, [id], label));
    }

    return {
      direct: mergeStreamSources(direct),
      related: mergeStreamSources(related),
    };
  } catch (error) {
    console.warn("[LUMIXTV En Vivo] No se pudo cargar fallback iptv-org:", error);
    return { direct: [], related: [] };
  }
}

export function parseCustomFallbackStreams(channelId: string): LiveStreamSource[] {
  const raw = process.env.LIVE_TV_FALLBACK_STREAMS_JSON?.trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Record<
      string,
      Array<string | { url: string; quality?: string | null; referrer?: string | null; userAgent?: string | null }>
    >;
    const entries = parsed[channelId] ?? [];
    const streams: LiveStreamSource[] = [];

    for (const entry of entries) {
      if (typeof entry === "string") {
        const url = entry.trim();
        if (!url) continue;
        streams.push({
          url,
          quality: "Personalizada",
          provider: "iptv-org",
        });
        continue;
      }

      const url = entry?.url?.trim();
      if (!url) continue;
      streams.push({
        url,
        quality: entry.quality ?? "Personalizada",
        referrer: entry.referrer ?? null,
        userAgent: entry.userAgent ?? null,
        provider: "iptv-org",
      });
    }

    return streams;
  } catch (error) {
    console.warn("[LUMIXTV En Vivo] LIVE_TV_FALLBACK_STREAMS_JSON inválido:", error);
    return [];
  }
}

export async function getIptvOrgChannelMeta(channelId: string) {
  try {
    const index = await getIptvOrgIndex();
    return index.channelsById[channelId] ?? null;
  } catch {
    return null;
  }
}
