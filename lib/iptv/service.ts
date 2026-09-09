import {
  channelsSameFamily,
  getChannelFamilyKey,
  sortRelatedChannels,
} from "@/lib/iptv/channel-family";
import {
  isAllCountries,
  LIVE_CHANNELS_MAX_PAGE_SIZE,
  LIVE_CHANNELS_PAGE_SIZE,
  LIVE_CHANNELS_PAGE_SIZE_ALL,
  LIVE_STREAM_CANDIDATE_LIMIT,
  normalizeCountryCode,
} from "@/lib/iptv/constants";
import {
  LIVE_CHANNEL_SOURCE_LABELS,
  LIVE_CHANNEL_SOURCE_ORDER,
  parseBaseChannelId,
} from "@/lib/iptv/channel-sources";
import { loadExtraChannelEntries, type ExtraChannelEntry } from "@/lib/iptv/extra-sources";
import { enrichPlaybackForUrl, probeStreamUpstream } from "@/lib/iptv/hls-proxy";
import { isSportsChannel } from "@/lib/iptv/football-channels";
import {
  filterByHd,
  filterByStreamStatus,
  isHdChannel,
  isWorkingChannel,
  type LiveStreamFilter,
} from "@/lib/iptv/channel-filters";
import {
  fetchNexusManifestCounts,
  fetchNexusOnlineChannels,
  fetchNexusStreams,
  indexNexusStreamsByChannel,
  isStrictlyVerifiedStream,
  type NexusOnlineChannel,
  type NexusStream,
} from "@/lib/iptv/nexus";
import type {
  EnrichedIptvStream,
  IptvBlockEntry,
  IptvCategory,
  IptvChannel,
  IptvLogo,
  IptvStream,
  LiveChannel,
  LiveChannelSource,
  LiveStreamPlayback,
  LiveStreamSourceGroup,
} from "@/lib/iptv/types";

const LIVE_CATALOG_BASE = "https://iptv-org.github.io/api";

const QUALITY_RANK: Record<string, number> = {
  "4K": 5,
  "2160p": 5,
  "1080p": 4,
  "720p": 3,
  "576p": 2,
  "480p": 2,
  "360p": 1,
};

async function fetchIptv<T>(path: string): Promise<T> {
  const res = await fetch(`${LIVE_CATALOG_BASE}/${path}`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    throw new Error(`Live catalog API error: ${path}`);
  }

  return res.json() as Promise<T>;
}

function streamQualityRank(stream: EnrichedIptvStream) {
  const fromLabel = QUALITY_RANK[stream.quality ?? ""];
  if (fromLabel) return fromLabel;

  const height = stream.health?.media?.height;
  if (height) {
    if (height >= 2160) return 5;
    if (height >= 1080) return 4;
    if (height >= 720) return 3;
    if (height >= 576) return 2;
    return 1;
  }

  const bitrate = stream.health?.media?.bitrate;
  if (bitrate) {
    if (bitrate >= 4_000_000) return 4;
    if (bitrate >= 2_000_000) return 3;
    if (bitrate >= 1_000_000) return 2;
    return 1;
  }

  return 0;
}

function sortStreams(streams: EnrichedIptvStream[]) {
  return [...streams].sort((a, b) => {
    const score = (stream: EnrichedIptvStream) => {
      if (stream.verified) {
        return -(stream.health?.score ?? 0);
      }

      const label = stream.label?.toLowerCase() ?? "";
      if (label.includes("geo") || label.includes("block") || label.includes("offline")) return 10;
      return 0;
    };

    const aScore = score(a);
    const bScore = score(b);
    if (aScore !== bScore) return aScore - bScore;

    // Misma prioridad de salud → probar primero la resolución más baja para arrancar rápido.
    return streamQualityRank(a) - streamQualityRank(b);
  });
}

function nexusStreamLabel(stream: NexusStream) {
  const quality = stream.quality ?? stream.title ?? "Stream";
  if (stream.health?.status === "offline") return `${quality} · sin señal`;
  if (stream.health?.status === "online") return `${quality} · en línea`;
  return quality;
}

function toEnrichedNexusStream(stream: NexusStream): EnrichedIptvStream {
  const verified = isStrictlyVerifiedStream(stream);

  return {
    channel: stream.channel,
    feed: stream.feed,
    title: stream.title,
    url: stream.url,
    referrer: stream.referrer,
    user_agent: stream.user_agent,
    quality: stream.quality,
    label: nexusStreamLabel(stream),
    verified,
    health: stream.health,
    rank: stream.rank,
    source: "nexus",
  };
}

function toOrgStream(stream: IptvStream): EnrichedIptvStream {
  return {
    ...stream,
    label: stream.quality ?? stream.title ?? undefined,
    verified: false,
    source: "iptv-org",
  };
}

type SourceStreamGroup = {
  source: LiveChannelSource;
  streams: EnrichedIptvStream[];
};

/** Dedupe solo dentro de cada fuente; la misma URL puede aparecer en IPTV-org, Nexus y M3U. */
function mergeStreamsFromGroups(...groups: SourceStreamGroup[]) {
  const merged: EnrichedIptvStream[] = [];

  const ordered = [...groups].sort(
    (a, b) => LIVE_CHANNEL_SOURCE_ORDER[a.source] - LIVE_CHANNEL_SOURCE_ORDER[b.source],
  );

  for (const { source, streams } of ordered) {
    const seenInGroup = new Set<string>();
    const groupStreams: EnrichedIptvStream[] = [];

    for (const stream of streams) {
      const key = stream.url.trim();
      if (!key || seenInGroup.has(key)) continue;
      seenInGroup.add(key);
      groupStreams.push({ ...stream, source: stream.source ?? source });
    }

    merged.push(...sortStreams(groupStreams));
  }

  return merged;
}

function enrichStreamsWithNexusHealth(
  streams: EnrichedIptvStream[],
  nexusByUrl: Map<string, EnrichedIptvStream>,
) {
  return streams.map((stream) => {
    const nexus = nexusByUrl.get(stream.url.trim());
    if (!nexus?.health) return stream;

    return {
      ...stream,
      health: stream.health ?? nexus.health,
      rank: stream.rank ?? nexus.rank,
      verified: stream.verified || nexus.verified,
    };
  });
}

function buildLiveChannelEntry(options: {
  id: string;
  name: string;
  altNames?: string[];
  country: string;
  categories: string[];
  logo?: string;
  streams: EnrichedIptvStream[];
}): LiveChannel | null {
  const sorted = sortStreams(options.streams);
  const best = sorted[0];
  if (!best) return null;

  const verified = sorted.some((stream) => stream.verified === true);
  const streamOnline = sorted.some((stream) => {
    if (stream.health?.status) return stream.health.status === "online";
    return true;
  });

  return {
    id: options.id,
    source: "iptv-org",
    baseChannelId: options.id,
    name: options.name,
    altNames: options.altNames,
    country: options.country,
    categories: options.categories,
    logo: options.logo,
    quality: best.quality ?? undefined,
    streamTitle: best.title,
    verified,
    available: true,
    streamOnline,
  };
}

function toPlayback(channelId: string, stream: EnrichedIptvStream): LiveStreamPlayback {
  return enrichPlaybackForUrl(
    {
      channelId,
      title: stream.title,
      url: stream.url,
      referrer: stream.referrer ?? undefined,
      userAgent: stream.user_agent ?? undefined,
      quality: stream.quality ?? undefined,
      label: stream.label ?? undefined,
      verified: stream.verified,
      source: stream.source ?? "iptv-org",
      sourceDetail: stream.sourceDetail,
    },
    stream.url,
  );
}

function streamOptionLabel(playback: LiveStreamPlayback, slot: number) {
  return playback.quality ?? playback.label ?? playback.title ?? `Server ${slot + 1}`;
}

function groupLabelForSource(
  source: LiveChannelSource,
  streams: LiveStreamPlayback[],
): string {
  if (source === "extra") {
    const details = [...new Set(streams.map((stream) => stream.sourceDetail).filter(Boolean))];
    if (details.length === 1) return details[0]!;
  }

  return LIVE_CHANNEL_SOURCE_LABELS[source];
}

export function buildStreamSourceGroups(
  candidates: LiveStreamPlayback[],
): LiveStreamSourceGroup[] {
  const buckets = new Map<
    LiveChannelSource,
    { globalIndex: number; playback: LiveStreamPlayback }[]
  >();

  candidates.forEach((candidate, globalIndex) => {
    const source = candidate.source ?? "iptv-org";
    const list = buckets.get(source) ?? [];
    list.push({ globalIndex, playback: candidate });
    buckets.set(source, list);
  });

  return (Object.keys(LIVE_CHANNEL_SOURCE_ORDER) as LiveChannelSource[])
    .filter((source) => buckets.has(source))
    .map((source) => {
      const entries = buckets.get(source)!;
      const playbacks = entries.map((entry) => entry.playback);

      return {
        source,
        label: groupLabelForSource(source, playbacks),
        streams: entries.map(({ globalIndex, playback }, slot) => ({
          index: globalIndex,
          quality: playback.quality ?? undefined,
          label: streamOptionLabel(playback, slot),
        })),
      };
    });
}

function pickLogo(logos: IptvLogo[]) {
  const usable = logos.filter(
    (logo) =>
      logo.in_use &&
      logo.url &&
      (!logo.format || ["PNG", "JPEG", "JPG", "WEBP", "SVG"].includes(logo.format.toUpperCase())),
  );

  const raster = usable.find((logo) =>
    ["PNG", "JPEG", "JPG", "WEBP"].includes(logo.format?.toUpperCase() ?? ""),
  );

  return (raster ?? usable[0])?.url;
}

let cachedCatalog: Promise<{
  channels: LiveChannel[];
  streamsByChannel: Map<string, EnrichedIptvStream>;
  allStreamsByChannel: Map<string, EnrichedIptvStream[]>;
  categories: IptvCategory[];
  verifiedCount: number;
  workingCount: number;
  hdCount: number;
  nexusStats: Awaited<ReturnType<typeof fetchNexusManifestCounts>>;
}> | null = null;

async function loadCatalog() {
  if (!cachedCatalog) {
    cachedCatalog = (async () => {
      const [channels, streams, logos, blocklist, categories, nexusOnlineChannels, nexusAllStreams, nexusStats] =
        await Promise.all([
          fetchIptv<IptvChannel[]>("channels.json"),
          fetchIptv<IptvStream[]>("streams.json"),
          fetchIptv<IptvLogo[]>("logos.json"),
          fetchIptv<IptvBlockEntry[]>("blocklist.json"),
          fetchIptv<IptvCategory[]>("categories.json"),
          fetchNexusOnlineChannels().catch(() => [] as NexusOnlineChannel[]),
          fetchNexusStreams().catch(() => [] as NexusStream[]),
          fetchNexusManifestCounts().catch(() => ({})),
        ]);

      const blocked = new Set(blocklist.map((entry) => entry.channel));
      const channelsById = new Map(channels.map((channel) => [channel.id, channel]));
      const nexusMetaById = new Map(nexusOnlineChannels.map((channel) => [channel.id, channel]));
      const nexusStreamsByChannel = indexNexusStreamsByChannel(nexusAllStreams);

      const logosByChannel = new Map<string, IptvLogo[]>();
      for (const logo of logos) {
        const list = logosByChannel.get(logo.channel) ?? [];
        list.push(logo);
        logosByChannel.set(logo.channel, list);
      }

      const pickLogoForChannel = (channelId: string) =>
        pickLogo(logosByChannel.get(channelId) ?? []);

      const orgStreamsByChannel = new Map<string, IptvStream[]>();
      for (const stream of streams) {
        if (!stream.channel || !stream.url) continue;
        const list = orgStreamsByChannel.get(stream.channel) ?? [];
        list.push(stream);
        orgStreamsByChannel.set(stream.channel, list);
      }

      const extraEntries = await loadExtraChannelEntries(channels, pickLogoForChannel).catch(
        (): ExtraChannelEntry[] => [],
      );

      const extraByMatchedId = new Map<string, EnrichedIptvStream[]>();
      const extraUnmatched: ExtraChannelEntry[] = [];

      for (const entry of extraEntries) {
        if (entry.matchedChannelId) {
          const list = extraByMatchedId.get(entry.matchedChannelId) ?? [];
          list.push(entry.stream);
          extraByMatchedId.set(entry.matchedChannelId, list);
        } else {
          extraUnmatched.push(entry);
        }
      }

      const liveChannels: LiveChannel[] = [];
      const rankedStreamsByChannel = new Map<string, EnrichedIptvStream[]>();
      const registeredIds = new Set<string>();

      const registerUnified = (options: {
        id: string;
        name: string;
        altNames?: string[];
        country: string;
        categories: string[];
        logo?: string;
        streams: EnrichedIptvStream[];
      }) => {
        const entry = buildLiveChannelEntry({ ...options, streams: options.streams });
        if (!entry) return;
        liveChannels.push(entry);
        rankedStreamsByChannel.set(entry.id, options.streams);
        registeredIds.add(entry.id);
      };

      for (const channel of channels) {
        if (channel.closed || channel.is_nsfw || blocked.has(channel.id)) continue;

        const nexusForChannel = (nexusStreamsByChannel.get(channel.id) ?? []).map(
          toEnrichedNexusStream,
        );
        const nexusByUrl = new Map(
          nexusForChannel.map((stream) => [stream.url.trim(), stream] as const),
        );

        const merged = mergeStreamsFromGroups(
          {
            source: "iptv-org",
            streams: enrichStreamsWithNexusHealth(
              (orgStreamsByChannel.get(channel.id) ?? []).map(toOrgStream),
              nexusByUrl,
            ),
          },
          {
            source: "nexus",
            streams: nexusForChannel,
          },
          {
            source: "extra",
            streams: extraByMatchedId.get(channel.id) ?? [],
          },
        );

        if (!merged.length) continue;

        registerUnified({
          id: channel.id,
          name: channel.name,
          altNames: channel.alt_names,
          country: channel.country,
          categories: channel.categories ?? [],
          logo: pickLogoForChannel(channel.id),
          streams: merged,
        });
      }

      for (const [nexusChannelId, nexusStreams] of nexusStreamsByChannel) {
        if (!nexusStreams.length || blocked.has(nexusChannelId) || registeredIds.has(nexusChannelId)) {
          continue;
        }

        const nexusMeta = nexusMetaById.get(nexusChannelId);
        if (nexusMeta?.is_nsfw) continue;

        const orgChannel = channelsById.get(nexusChannelId);
        if (orgChannel?.closed) continue;

        registerUnified({
          id: nexusChannelId,
          name: orgChannel?.name ?? nexusMeta?.name ?? nexusStreams[0]?.title ?? nexusChannelId,
          altNames: orgChannel?.alt_names,
          country: orgChannel?.country ?? nexusMeta?.country ?? "INT",
          categories: orgChannel?.categories?.length
            ? orgChannel.categories
            : (nexusMeta?.categories ?? []),
          logo: orgChannel ? pickLogoForChannel(orgChannel.id) : nexusMeta?.logo ?? undefined,
          streams: mergeStreamsFromGroups({
            source: "nexus",
            streams: nexusStreams.map(toEnrichedNexusStream),
          }),
        });
      }

      for (const extraEntry of extraUnmatched) {
        registerUnified({
          id: extraEntry.id,
          name: extraEntry.displayName,
          altNames: extraEntry.altNames,
          country: extraEntry.country,
          categories: extraEntry.categories,
          logo: extraEntry.logo,
          streams: mergeStreamsFromGroups({
            source: "extra",
            streams: [extraEntry.stream],
          }),
        });
      }

      liveChannels.sort((a, b) => {
        if (a.streamOnline !== b.streamOnline) return a.streamOnline ? -1 : 1;
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        return a.name.localeCompare(b.name, "es");
      });

      const bestStreamMap = new Map<string, EnrichedIptvStream>();
      for (const channel of liveChannels) {
        const ranked = rankedStreamsByChannel.get(channel.id) ?? [];
        const best = ranked[0];
        if (best) bestStreamMap.set(channel.id, best);
      }

      const verifiedCount = liveChannels.filter((ch) => ch.verified).length;
      const workingCount = liveChannels.filter(isWorkingChannel).length;
      const hdCount = liveChannels.filter(isHdChannel).length;

      return {
        channels: liveChannels,
        streamsByChannel: bestStreamMap,
        allStreamsByChannel: rankedStreamsByChannel,
        categories,
        verifiedCount,
        workingCount,
        hdCount,
        nexusStats,
      };
    })().catch((error) => {
      cachedCatalog = null;
      throw error;
    });
  }

  return cachedCatalog;
}

export async function getLiveCategories() {
  const { categories } = await loadCatalog();
  return categories;
}

export async function getLiveCatalogStats() {
  const { channels, verifiedCount, workingCount, hdCount, nexusStats } = await loadCatalog();
  return {
    total: channels.length,
    verifiedCount,
    workingCount,
    hdCount,
    nexusStats,
  };
}

export async function listLiveChannels(filters?: {
  country?: string;
  category?: string;
  source?: LiveChannelSource;
  stream?: LiveStreamFilter;
  hd?: boolean;
  search?: string;
  football?: boolean;
  page?: number;
  limit?: number;
}) {
  const {
    channels,
    streamsByChannel,
    verifiedCount,
    workingCount,
    hdCount,
    nexusStats,
  } = await loadCatalog();
  let results = channels;

  if (filters?.source) {
    results = results.filter((ch) => ch.source === filters.source);
  }

  results = filterByStreamStatus(results, filters?.stream ?? "working");
  results = filterByHd(results, Boolean(filters?.hd));

  if (filters?.football) {
    results = results.filter(isSportsChannel);
  } else if (filters?.category?.trim()) {
    results = results.filter((ch) => ch.categories.includes(filters.category!.trim()));
  }

  const searchQuery = filters?.search?.toLowerCase().trim() ?? "";
  const countryCode = filters?.country?.trim()
    ? normalizeCountryCode(filters.country)
    : "CO";

  const applyCountryFilter =
    !isAllCountries(countryCode) && !searchQuery;

  if (applyCountryFilter) {
    results = results.filter((ch) => ch.country === countryCode);
  }

  if (searchQuery) {
    results = results.filter((ch) => {
      const haystack = [ch.name, ch.streamTitle, ...(ch.altNames ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchQuery);
    });
  }

  const total = results.length;
  const page = Math.max(1, filters?.page ?? 1);
  const defaultLimit = isAllCountries(countryCode)
    ? LIVE_CHANNELS_PAGE_SIZE_ALL
    : LIVE_CHANNELS_PAGE_SIZE;
  const limit = Math.min(
    LIVE_CHANNELS_MAX_PAGE_SIZE,
    Math.max(1, filters?.limit ?? defaultLimit),
  );
  const offset = (page - 1) * limit;
  const paginated = results.slice(offset, offset + limit);

  return {
    channels: paginated,
    total,
    page,
    limit,
    hasNext: offset + limit < total,
    verifiedCount,
    workingCount,
    hdCount,
    catalogTotal: channels.length,
    nexusStats,
    streamsByChannel,
  };
}

export async function getLiveStreamCandidates(
  channelId: string,
  limit = LIVE_STREAM_CANDIDATE_LIMIT,
): Promise<LiveStreamPlayback[]> {
  const { allStreamsByChannel } = await loadCatalog();
  const streams = allStreamsByChannel.get(channelId) ?? [];
  return streams.slice(0, limit).map((stream) => toPlayback(channelId, stream));
}

export async function getLiveStreamOptions(channelId: string, limit = LIVE_STREAM_CANDIDATE_LIMIT) {
  const candidates = await getLiveStreamCandidates(channelId, limit);
  return {
    total: candidates.length,
    groups: buildStreamSourceGroups(candidates),
  };
}

export async function findFirstPlayableStream(
  channelId: string,
  options?: { limit?: number; startIndex?: number },
) {
  const limit = options?.limit ?? LIVE_STREAM_CANDIDATE_LIMIT;
  const startIndex = options?.startIndex ?? 0;
  const candidates = await getLiveStreamCandidates(channelId, limit);

  for (let index = startIndex; index < candidates.length; index += 1) {
    const playback = candidates[index];
    const response = await probeStreamUpstream(playback, playback.url);
    if (response?.ok) {
      return {
        index,
        playback,
        total: candidates.length,
      };
    }
  }

  return null;
}

export async function getLiveStreamAt(
  channelId: string,
  sourceIndex = 0,
): Promise<LiveStreamPlayback | null> {
  const candidates = await getLiveStreamCandidates(channelId, sourceIndex + 1);
  return candidates[sourceIndex] ?? null;
}

export async function getLiveStream(channelId: string): Promise<LiveStreamPlayback | null> {
  return getLiveStreamAt(channelId, 0);
}

export async function getLiveChannel(channelId: string): Promise<LiveChannel | null> {
  const { channels } = await loadCatalog();
  return channels.find((channel) => channel.id === channelId) ?? null;
}

export async function listRelatedChannels(channelId: string, limit = 24) {
  const { channels } = await loadCatalog();
  const current = channels.find((ch) => ch.id === channelId);

  if (!current) {
    return { family: null as string | null, channels: [] as LiveChannel[] };
  }

  const family = getChannelFamilyKey(current);
  const currentBase =
    current.baseChannelId ?? parseBaseChannelId(current.id) ?? current.id;

  const related = sortRelatedChannels(
    current,
    channels.filter((ch) => {
      if (ch.id === channelId) return false;

      const otherBase = ch.baseChannelId ?? parseBaseChannelId(ch.id) ?? ch.id;
      if (otherBase === currentBase) return true;

      return family ? channelsSameFamily(current, ch) : false;
    }),
  ).slice(0, limit);

  if (!related.length) {
    return { family: null, channels: [] };
  }

  return { family: family ?? current.name, channels: related };
}
