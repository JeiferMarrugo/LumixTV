import type {
  IptvBlockEntry,
  IptvCategory,
  IptvChannel,
  IptvLogo,
  IptvStream,
  LiveChannel,
  LiveStreamPlayback,
} from "@/lib/iptv/types";

const IPTV_BASE = "https://iptv-org.github.io/api";
const REVALIDATE_SECONDS = 3600;

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
  const res = await fetch(`${IPTV_BASE}/${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`IPTV API error: ${path}`);
  }

  return res.json() as Promise<T>;
}

function pickBestStream(streams: IptvStream[]) {
  if (streams.length === 0) return null;

  const sorted = [...streams].sort((a, b) => {
    const aBlocked = a.label?.toLowerCase().includes("geo") ? 1 : 0;
    const bBlocked = b.label?.toLowerCase().includes("geo") ? 1 : 0;
    if (aBlocked !== bBlocked) return aBlocked - bBlocked;

    const aQ = QUALITY_RANK[a.quality ?? ""] ?? 0;
    const bQ = QUALITY_RANK[b.quality ?? ""] ?? 0;
    return bQ - aQ;
  });

  return sorted[0];
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
  streamsByChannel: Map<string, IptvStream>;
  categories: IptvCategory[];
}> | null = null;

async function loadCatalog() {
  if (!cachedCatalog) {
    cachedCatalog = (async () => {
      const [channels, streams, logos, blocklist, categories] = await Promise.all([
        fetchIptv<IptvChannel[]>("channels.json"),
        fetchIptv<IptvStream[]>("streams.json"),
        fetchIptv<IptvLogo[]>("logos.json"),
        fetchIptv<IptvBlockEntry[]>("blocklist.json"),
        fetchIptv<IptvCategory[]>("categories.json"),
      ]);

      const blocked = new Set(blocklist.map((entry) => entry.channel));
      const streamsByChannel = new Map<string, IptvStream[]>();

      for (const stream of streams) {
        if (!stream.channel || !stream.url) continue;
        const list = streamsByChannel.get(stream.channel) ?? [];
        list.push(stream);
        streamsByChannel.set(stream.channel, list);
      }

      const logosByChannel = new Map<string, IptvLogo[]>();
      for (const logo of logos) {
        const list = logosByChannel.get(logo.channel) ?? [];
        list.push(logo);
        logosByChannel.set(logo.channel, list);
      }

      const liveChannels: LiveChannel[] = [];

      for (const channel of channels) {
        if (channel.closed || channel.is_nsfw || blocked.has(channel.id)) continue;

        const channelStreams = streamsByChannel.get(channel.id);
        if (!channelStreams?.length) continue;

        const best = pickBestStream(channelStreams);
        if (!best) continue;

        liveChannels.push({
          id: channel.id,
          name: channel.name,
          country: channel.country,
          categories: channel.categories ?? [],
          logo: pickLogo(logosByChannel.get(channel.id) ?? []),
          quality: best.quality ?? undefined,
          label: best.label ?? undefined,
        });
      }

      liveChannels.sort((a, b) => a.name.localeCompare(b.name, "es"));

      const bestStreamMap = new Map<string, IptvStream>();
      for (const channel of liveChannels) {
        const best = pickBestStream(streamsByChannel.get(channel.id) ?? []);
        if (best) bestStreamMap.set(channel.id, best);
      }

      return {
        channels: liveChannels,
        streamsByChannel: bestStreamMap,
        categories,
      };
    })();
  }

  return cachedCatalog;
}

export async function getLiveCategories() {
  const { categories } = await loadCatalog();
  return categories;
}

export async function listLiveChannels(filters?: {
  country?: string;
  category?: string;
  search?: string;
  limit?: number;
}) {
  const { channels, streamsByChannel } = await loadCatalog();
  let results = channels;

  if (filters?.country) {
    results = results.filter((ch) => ch.country === filters.country);
  }

  if (filters?.category) {
    results = results.filter((ch) => ch.categories.includes(filters.category!));
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter((ch) => ch.name.toLowerCase().includes(q));
  }

  if (filters?.limit) {
    results = results.slice(0, filters.limit);
  }

  return { channels: results, total: results.length, streamsByChannel };
}

export async function getLiveStream(channelId: string): Promise<LiveStreamPlayback | null> {
  const { streamsByChannel } = await loadCatalog();
  const stream = streamsByChannel.get(channelId);
  if (!stream) return null;

  return {
    channelId,
    title: stream.title,
    url: stream.url,
    referrer: stream.referrer ?? undefined,
    userAgent: stream.user_agent ?? undefined,
    quality: stream.quality ?? undefined,
    label: stream.label ?? undefined,
  };
}
