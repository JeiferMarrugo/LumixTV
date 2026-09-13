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

import type {

  LiveCategoryOption,

  LiveChannel,

  LiveChannelFilters,

  LiveChannelListResult,

  LiveCountryOption,

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



export async function getLiveChannelById(id: string): Promise<LiveChannel | null> {

  try {

    const detail = await fetchNexusChannel(id);

    if (!detail.streams?.length) return null;

    return mapNexusChannelDetail(detail);

  } catch {

    return null;

  }

}



export async function getRelatedLiveChannels(

  channel: LiveChannel,

  limit = 12,

): Promise<LiveChannel[]> {

  const { rows } = await getCatalogBundle();

  const categorySet = new Set(channel.categories);
  const scored: Array<{ channel: LiveChannel; score: number }> = [];

  for (const row of rows) {
    const rowId = String(row[F.ID]);
    if (rowId === channel.id) continue;

    const rowCats = rowCategories(row);
    const sameCategory = rowCats.some((c) => categorySet.has(c));
    const sameCountry = String(row[F.COUNTRY]) === channel.countryCode;

    if (!sameCategory && !sameCountry) continue;

    let score = 0;
    if (sameCategory) score += 2 + rowCats.filter((c) => categorySet.has(c)).length;
    if (sameCountry) score += 1;

    scored.push({
      score,
      channel: {
        id: rowId,
        name: String(row[F.NAME]),
        logo: String(row[F.LOGO] || "") || null,
        countryCode: String(row[F.COUNTRY]),
        categories: rowCats,
        languages: [],
        isNsfw: false,
        streams: [],
      },
    });
  }

  scored.sort((a, b) => b.score - a.score || a.channel.name.localeCompare(b.channel.name));

  return scored.slice(0, limit).map((entry) => entry.channel);

}


