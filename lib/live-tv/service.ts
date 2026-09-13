import { unstable_cache } from "next/cache";

import {

  fetchNexusCategories,

  fetchNexusChannel,

  fetchNexusCountries,

  fetchNexusSearchIndex,

  normalizeNexusSearch,

  NEXUS_SEARCH_FIELDS as F,

  type NexusChannelDetail,

  type NexusSearchRow,

} from "@/lib/live-tv/nexus-catalog";

import { detectChannelBrand } from "@/lib/live-tv/channel-brand";
import {
  getIptvOrgChannelMeta,
  getIptvOrgStreamsForChannel,
  orderLiveStreamSources,
  parseCustomFallbackStreams,
} from "@/lib/live-tv/iptv-org-fallback";
import type {
  LiveCategoryOption,
  LiveChannel,
  LiveChannelFilters,
  LiveChannelListResult,
  LiveCountryOption,
  LiveStreamSource,
} from "@/lib/live-tv/types";



const CATALOG_TTL_MS = 30 * 60 * 1000;



interface CatalogBundle {

  rows: NexusSearchRow[];

  categories: LiveCategoryOption[];

  countries: LiveCountryOption[];

}



type LiveTvGlobal = typeof globalThis & {

  __liveTvCatalog?: { bundle: CatalogBundle; expiresAt: number };

  __liveTvInflight?: Promise<CatalogBundle>;

};



const liveTvGlobal = globalThis as LiveTvGlobal;



function rowCategories(row: NexusSearchRow): string[] {

  const raw = String(row[F.CATEGORIES] ?? "");

  return raw ? raw.split(",").map((c) => c.trim()).filter(Boolean) : [];

}



function rowStreamCount(row: NexusSearchRow) {

  return Number(row[F.STREAMS] ?? 0);

}



function rowQuality(row: NexusSearchRow) {

  return String(row[F.QUALITY] ?? "");

}



function isHdQuality(quality: string) {

  const match = quality.toLowerCase().match(/(\d+)p/);

  return match ? Number(match[1]) >= 720 : false;

}



function mapSearchRowToListItem(row: NexusSearchRow) {

  return {

    id: String(row[F.ID]),

    name: String(row[F.NAME]),

    logo: String(row[F.LOGO] || "") || null,

    countryCode: String(row[F.COUNTRY]),

    categories: rowCategories(row),

  };

}



function mapNexusStreams(channel: NexusChannelDetail): LiveChannel["streams"] {

  const online = channel.streams.filter((s) => s.health?.status === "online");

  const candidates = online.length > 0 ? online : channel.streams;



  return candidates

    .slice()

    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))

    .map((stream) => ({
      url: stream.url,
      referrer: stream.referrer ?? null,
      userAgent: stream.user_agent ?? null,
      quality: stream.quality ?? null,
      online: stream.health?.status === "online",
      provider: "nexus" as const,
    }));

}



function mapNexusChannelDetail(channel: NexusChannelDetail): LiveChannel {

  return {

    id: channel.id,

    name: channel.name,

    logo: channel.logo ?? null,

    countryCode: channel.country,

    categories: channel.categories ?? [],

    languages: channel.languages ?? [],

    isNsfw: Boolean(channel.is_nsfw),

    website: channel.website ?? null,

    streams: mapNexusStreams(channel),

  };

}



async function buildCatalogBundle(): Promise<CatalogBundle> {

  const [search, rawCategories, rawCountries] = await Promise.all([

    fetchNexusSearchIndex(),

    fetchNexusCategories(),

    fetchNexusCountries(),

  ]);



  const playableRows = search.channels.filter((row) => rowStreamCount(row) > 0);



  const categories: LiveCategoryOption[] = rawCategories

    .filter((c) => (c.playable ?? c.channels) > 0 && c.id !== "xxx")

    .map((c) => ({

      id: c.id ?? "",

      name: c.name,

      count: c.playable ?? c.channels,

    }))

    .sort((a, b) => b.count - a.count);



  const countries: LiveCountryOption[] = rawCountries

    .filter((c) => (c.playable ?? c.channels) > 0)

    .map((c) => ({

      code: c.code ?? "",

      name: c.name,

      flag: c.flag ?? "",

      count: c.playable ?? c.channels,

    }))

    .sort((a, b) => b.count - a.count);



  return { rows: playableRows, categories, countries };

}



const getPersistedCatalogBundle = unstable_cache(

  buildCatalogBundle,

  ["live-tv-nexus-catalog"],

  { revalidate: 1800 },

);



async function getCatalogBundle(): Promise<CatalogBundle> {

  const now = Date.now();

  const cached = liveTvGlobal.__liveTvCatalog;

  if (cached && cached.expiresAt > now) return cached.bundle;



  if (liveTvGlobal.__liveTvInflight) return liveTvGlobal.__liveTvInflight;



  liveTvGlobal.__liveTvInflight = getPersistedCatalogBundle()

    .then((bundle) => {

      liveTvGlobal.__liveTvCatalog = { bundle, expiresAt: Date.now() + CATALOG_TTL_MS };

      liveTvGlobal.__liveTvInflight = undefined;

      return bundle;

    })

    .catch((err) => {

      liveTvGlobal.__liveTvInflight = undefined;

      throw err;

    });



  return liveTvGlobal.__liveTvInflight;

}



function filterRows(rows: NexusSearchRow[], filters: LiveChannelFilters) {

  const search = filters.search ? normalizeNexusSearch(filters.search) : "";



  return rows.filter((row) => {

    if (filters.country && String(row[F.COUNTRY]) !== filters.country) return false;

    if (filters.category && !rowCategories(row).includes(filters.category)) return false;

    if (filters.hdOnly && !isHdQuality(rowQuality(row))) return false;



    if (search) {

      const blob = String(row[F.SEARCH] ?? "");

      const name = normalizeNexusSearch(String(row[F.NAME] ?? ""));

      if (!blob.includes(search) && !name.includes(search)) return false;

    }



    return true;

  });

}



export async function getLiveCategories(): Promise<LiveCategoryOption[]> {

  const { categories } = await getCatalogBundle();

  return categories;

}



export async function getLiveCountries(): Promise<LiveCountryOption[]> {

  const { countries } = await getCatalogBundle();

  return countries;

}



export async function listLiveChannels(

  filters: LiveChannelFilters,

): Promise<LiveChannelListResult> {

  const { rows, categories, countries } = await getCatalogBundle();

  const filtered = filterRows(rows, filters);



  const total = filtered.length;

  const pageSize = filters.pageSize;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const page = Math.min(Math.max(1, filters.page), totalPages);

  const start = (page - 1) * pageSize;



  return {

    items: filtered.slice(start, start + pageSize).map(mapSearchRowToListItem),

    total,

    page,

    totalPages,

    categories,

    countries,

  };

}



async function getCatalogRowById(id: string): Promise<NexusSearchRow | null> {
  const { rows } = await getCatalogBundle();
  return rows.find((row) => String(row[F.ID]) === id) ?? null;
}

async function buildChannelFromCatalogRow(id: string): Promise<LiveChannel | null> {
  const row = await getCatalogRowById(id);
  if (!row) return null;

  return {
    id,
    name: String(row[F.NAME]),
    logo: String(row[F.LOGO] || "") || null,
    countryCode: String(row[F.COUNTRY]),
    categories: rowCategories(row),
    languages: [],
    isNsfw: false,
    website: null,
    streams: [],
  };
}

async function resolveIptvOrgAlternatives(
  channelId: string,
  hint?: { name?: string; countryCode?: string },
) {
  return getIptvOrgStreamsForChannel(channelId, hint);
}

export async function getLiveChannelById(id: string): Promise<LiveChannel | null> {
  const catalogRow = await getCatalogRowById(id);
  const lookupHint = catalogRow
    ? {
        name: String(catalogRow[F.NAME]),
        countryCode: String(catalogRow[F.COUNTRY]),
      }
    : undefined;

  let nexusChannel: LiveChannel | null = null;

  try {
    const detail = await fetchNexusChannel(id);
    if (detail.streams?.length) {
      nexusChannel = mapNexusChannelDetail(detail);
    }
  } catch (error) {
    console.warn(`[LUMIXTV En Vivo] Nexus no respondió para ${id}:`, error);
  }

  const iptvOrg = await resolveIptvOrgAlternatives(id, lookupHint);
  const customStreams = parseCustomFallbackStreams(id);
  const iptvOrgCount = iptvOrg.direct.length + iptvOrg.related.length;

  if (nexusChannel) {
    const nexusOnline = nexusChannel.streams.filter((stream) => stream.online === true);
    const mergedStreams = orderLiveStreamSources(nexusChannel.streams, iptvOrg.direct, {
      relatedStreams: iptvOrg.related,
      customStreams,
    });

    if (iptvOrgCount > 0 || customStreams.length > 0) {
      const strategy =
        nexusOnline.length === 0
          ? "iptv-org priorizado (Nexus offline)"
          : "Nexus online + alternativas";
      console.info(
        `[LUMIXTV En Vivo] ${nexusChannel.name}: ${nexusChannel.streams.length} Nexus + ${iptvOrg.direct.length} iptv-org + ${iptvOrg.related.length} relacionados + ${customStreams.length} custom · ${strategy}`,
      );
    }

    return { ...nexusChannel, streams: mergedStreams };
  }

  if (iptvOrgCount === 0 && customStreams.length === 0) return null;

  const shell = await buildChannelFromCatalogRow(id);
  const iptvMeta = await getIptvOrgChannelMeta(id);

  const channel: LiveChannel = shell ?? {
    id,
    name: iptvMeta?.name ?? lookupHint?.name ?? id,
    logo: iptvMeta?.logo ?? null,
    countryCode: iptvMeta?.country ?? lookupHint?.countryCode ?? "",
    categories: iptvMeta?.categories ?? [],
    languages: iptvMeta?.languages ?? [],
    isNsfw: Boolean(iptvMeta?.is_nsfw),
    website: iptvMeta?.website ?? null,
    streams: [],
  };

  const mergedStreams = orderLiveStreamSources([], iptvOrg.direct, {
    relatedStreams: iptvOrg.related,
    customStreams,
  });

  console.info(
    `[LUMIXTV En Vivo] ${channel.name}: ${iptvOrg.direct.length} iptv-org + ${iptvOrg.related.length} relacionados + ${customStreams.length} custom (Nexus sin señal)`,
  );

  return { ...channel, streams: mergedStreams };
}



export interface RelatedLiveChannelsResult {
  items: LiveChannel[];
  groupLabel: string | null;
}

function mapCatalogRowToLiveChannel(row: NexusSearchRow): LiveChannel {
  const rowId = String(row[F.ID]);
  return {
    id: rowId,
    name: String(row[F.NAME]),
    logo: String(row[F.LOGO] || "") || null,
    countryCode: String(row[F.COUNTRY]),
    categories: rowCategories(row),
    languages: [],
    isNsfw: false,
    streams: [],
  };
}

export async function getRelatedLiveChannels(
  channel: LiveChannel,
  limit = 12,
): Promise<RelatedLiveChannelsResult> {
  const { rows } = await getCatalogBundle();
  const brand = detectChannelBrand(channel.name, channel.id);

  if (brand) {
    const brandMatches: LiveChannel[] = [];

    for (const row of rows) {
      const rowId = String(row[F.ID]);
      if (rowId === channel.id) continue;

      const candidate = mapCatalogRowToLiveChannel(row);
      const candidateBrand = detectChannelBrand(candidate.name, candidate.id);
      if (candidateBrand?.key !== brand.key) continue;

      brandMatches.push(candidate);
    }

    brandMatches.sort((a, b) => {
      const aSameCountry = a.countryCode === channel.countryCode ? 1 : 0;
      const bSameCountry = b.countryCode === channel.countryCode ? 1 : 0;
      return bSameCountry - aSameCountry || a.name.localeCompare(b.name, "es");
    });

    if (brandMatches.length > 0) {
      return {
        items: brandMatches.slice(0, limit),
        groupLabel: brand.label,
      };
    }
  }

  const categorySet = new Set(channel.categories);
  const scored: Array<{ channel: LiveChannel; score: number }> = [];

  for (const row of rows) {
    const rowId = String(row[F.ID]);
    if (rowId === channel.id) continue;

    const candidate = mapCatalogRowToLiveChannel(row);
    const sameCategory = candidate.categories.some((c) => categorySet.has(c));
    const sameCountry = candidate.countryCode === channel.countryCode;

    if (!sameCategory && !sameCountry) continue;

    let score = 0;
    if (sameCategory) {
      score += 2 + candidate.categories.filter((c) => categorySet.has(c)).length;
    }
    if (sameCountry) score += 1;

    scored.push({ score, channel: candidate });
  }

  scored.sort((a, b) => b.score - a.score || a.channel.name.localeCompare(b.channel.name, "es"));

  return {
    items: scored.slice(0, limit).map((entry) => entry.channel),
    groupLabel: null,
  };
}


