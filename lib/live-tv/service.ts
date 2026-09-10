import {
  fetchRawCategories,
  fetchRawChannels,
  fetchRawCountries,
  fetchRawLogos,
  fetchRawStreams,
} from "@/lib/live-tv/catalog";
import type {
  LiveCategoryOption,
  LiveChannel,
  LiveChannelFilters,
  LiveChannelListResult,
  LiveCountryOption,
} from "@/lib/live-tv/types";

const CATALOG_TTL_MS = 30 * 60 * 1000; // 30 minutos en memoria del proceso

let cachedCatalog: { channels: LiveChannel[]; expiresAt: number } | null = null;
let inflight: Promise<LiveChannel[]> | null = null;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function pickLogo(logosByChannel: Map<string, string[]>, channelId: string) {
  const logos = logosByChannel.get(channelId);
  return logos && logos.length > 0 ? logos[0] : null;
}

async function buildCatalog(): Promise<LiveChannel[]> {
  const [channels, streams, logos] = await Promise.all([
    fetchRawChannels(),
    fetchRawStreams(),
    fetchRawLogos().catch(() => []),
  ]);

  const logosByChannel = new Map<string, string[]>();
  for (const logo of logos) {
    if (!logo.channel || !logo.url) continue;
    const list = logosByChannel.get(logo.channel) ?? [];
    list.push(logo.url);
    logosByChannel.set(logo.channel, list);
  }

  const streamsByChannel = new Map<string, typeof streams>();
  for (const stream of streams) {
    if (!stream.channel || !stream.url) continue;
    const list = streamsByChannel.get(stream.channel) ?? [];
    list.push(stream);
    streamsByChannel.set(stream.channel, list);
  }

  const result: LiveChannel[] = [];

  for (const channel of channels) {
    if (channel.closed || channel.replaced_by) continue;
    if (channel.is_nsfw) continue;

    const rawStreams = streamsByChannel.get(channel.id);
    if (!rawStreams || rawStreams.length === 0) continue;

    result.push({
      id: channel.id,
      name: channel.name,
      logo: pickLogo(logosByChannel, channel.id) ?? channel.logo ?? null,
      countryCode: channel.country,
      categories: channel.categories ?? [],
      languages: channel.languages ?? [],
      isNsfw: Boolean(channel.is_nsfw),
      website: channel.website ?? null,
      streams: rawStreams.map((stream) => ({
        url: stream.url,
        referrer: stream.referrer ?? null,
        userAgent: stream.user_agent ?? null,
        quality: stream.quality ?? null,
      })),
    });
  }

  result.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return result;
}

async function getCatalog(): Promise<LiveChannel[]> {
  const now = Date.now();
  if (cachedCatalog && cachedCatalog.expiresAt > now) {
    return cachedCatalog.channels;
  }
  if (inflight) return inflight;

  inflight = buildCatalog()
    .then((channels) => {
      cachedCatalog = { channels, expiresAt: Date.now() + CATALOG_TTL_MS };
      inflight = null;
      return channels;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });

  return inflight;
}

function isHd(channel: LiveChannel) {
  return channel.streams.some((stream) => {
    const quality = stream.quality?.toLowerCase() ?? "";
    const match = quality.match(/(\d+)p/);
    return match ? Number(match[1]) >= 720 : false;
  });
}

export async function getLiveCategories(): Promise<LiveCategoryOption[]> {
  const [channels, rawCategories] = await Promise.all([
    getCatalog(),
    fetchRawCategories().catch(() => []),
  ]);

  const nameById = new Map(rawCategories.map((c) => [c.id, c.name] as const));
  const counts = new Map<string, number>();

  for (const channel of channels) {
    for (const category of channel.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([id, count]) => ({ id, name: nameById.get(id) ?? id, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getLiveCountries(): Promise<LiveCountryOption[]> {
  const [channels, rawCountries] = await Promise.all([
    getCatalog(),
    fetchRawCountries().catch(() => []),
  ]);

  const infoByCode = new Map(rawCountries.map((c) => [c.code, c] as const));
  const counts = new Map<string, number>();

  for (const channel of channels) {
    counts.set(channel.countryCode, (counts.get(channel.countryCode) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([code, count]) => ({
      code,
      name: infoByCode.get(code)?.name ?? code,
      flag: infoByCode.get(code)?.flag ?? "",
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function listLiveChannels(
  filters: LiveChannelFilters,
): Promise<LiveChannelListResult> {
  const channels = await getCatalog();

  const search = filters.search ? normalize(filters.search) : "";

  const filtered = channels.filter((channel) => {
    if (filters.country && channel.countryCode !== filters.country) return false;
    if (filters.category && !channel.categories.includes(filters.category)) return false;
    if (filters.hdOnly && !isHd(channel)) return false;
    if (search && !normalize(channel.name).includes(search)) return false;
    return true;
  });

  const total = filtered.length;
  const pageSize = filters.pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page), totalPages);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  const [categories, countries] = await Promise.all([
    getLiveCategories(),
    getLiveCountries(),
  ]);

  return { items, total, page, totalPages, categories, countries };
}

export async function getLiveChannelById(id: string): Promise<LiveChannel | null> {
  const channels = await getCatalog();
  return channels.find((channel) => channel.id === id) ?? null;
}

export async function getRelatedLiveChannels(
  channel: LiveChannel,
  limit = 12,
): Promise<LiveChannel[]> {
  const channels = await getCatalog();

  return channels
    .filter((candidate) => {
      if (candidate.id === channel.id) return false;
      const sameCategory = candidate.categories.some((c) => channel.categories.includes(c));
      const sameCountry = candidate.countryCode === channel.countryCode;
      return sameCategory || sameCountry;
    })
    .slice(0, limit);
}
