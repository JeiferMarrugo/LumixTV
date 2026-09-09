import type { ContentItem } from "@/lib/data";
import { enrichVimeusItems } from "@/lib/vimeus/catalog";
import { itemTitle } from "@/lib/vimeus/normalize";
import {
  listVimeusAnimes,
  listVimeusMovies,
  listVimeusSeries,
} from "@/lib/vimeus/service";
import type { VimeusContentType, VimeusPagedItems, VimeusRawItem } from "@/lib/vimeus/types";

const MAX_SCAN_PAGES = 120;
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

const enrichedSearchCache = new Map<
  string,
  { items: ContentItem[]; expiresAt: number }
>();

function searchCacheKey(contentType: VimeusContentType, query: string) {
  return `${contentType}:${normalizeSearchText(query)}`;
}

function getCachedSearch(contentType: VimeusContentType, query: string) {
  const key = searchCacheKey(contentType, query);
  const cached = enrichedSearchCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    enrichedSearchCache.delete(key);
    return null;
  }
  return cached.items;
}

function setCachedSearch(contentType: VimeusContentType, query: string, items: ContentItem[]) {
  enrichedSearchCache.set(searchCacheKey(contentType, query), {
    items,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchesQuery(item: VimeusRawItem, query: string) {
  const needle = normalizeSearchText(query);
  if (!needle) return false;

  const haystack = normalizeSearchText(itemTitle(item));
  return haystack.includes(needle);
}

async function scanVimeusListing(
  fetchPage: (page: number) => Promise<VimeusPagedItems>,
  query: string,
  options: { previewLimit?: number; maxPages?: number },
) {
  const previewLimit = options.previewLimit;
  const maxPages = Math.min(options.maxPages ?? MAX_SCAN_PAGES, MAX_SCAN_PAGES);
  const matches: VimeusRawItem[] = [];

  const first = await fetchPage(1);
  const pagesToScan = Math.min(first.totalPages, maxPages);

  for (let page = 1; page <= pagesToScan; page += 1) {
    const data = page === 1 ? first : await fetchPage(page);

    for (const item of data.items) {
      if (!matchesQuery(item, query)) continue;
      matches.push(item);
      if (previewLimit && matches.length >= previewLimit) {
        return { matches, catalogTotal: first.totalResults, scannedPages: page };
      }
    }
  }

  return { matches, catalogTotal: first.totalResults, scannedPages: pagesToScan };
}

async function searchVimeusType(
  contentType: VimeusContentType,
  fetchPage: (page: number) => Promise<VimeusPagedItems>,
  query: string,
  options: { previewLimit?: number; maxPages?: number },
) {
  const { matches, catalogTotal, scannedPages } = await scanVimeusListing(
    fetchPage,
    query,
    options,
  );
  const items = await enrichVimeusItems(matches, contentType);

  return {
    items,
    total: items.length,
    catalogTotal,
    scannedPages,
  };
}

export async function searchVimeusContent(
  query: string,
  options: { previewLimit?: number; maxPages?: number } = {},
) {
  const q = query.trim();
  if (!q) {
    return {
      query: q,
      movies: [] as ContentItem[],
      series: [] as ContentItem[],
      anime: [] as ContentItem[],
      total: 0,
      totals: { movies: 0, series: 0, anime: 0 },
      source: "vimeus" as const,
    };
  }

  const [moviesResult, seriesResult, animeResult] = await Promise.all([
    searchVimeusType("movie", listVimeusMovies, q, options),
    searchVimeusType("series", listVimeusSeries, q, options),
    searchVimeusType("anime", listVimeusAnimes, q, options),
  ]);

  return {
    query: q,
    movies: moviesResult.items,
    series: seriesResult.items,
    anime: animeResult.items,
    total: moviesResult.items.length + seriesResult.items.length + animeResult.items.length,
    totals: {
      movies: moviesResult.items.length,
      series: seriesResult.items.length,
      anime: animeResult.items.length,
    },
    meta: {
      moviesFetched: moviesResult.items.length,
      moviesTotal: moviesResult.items.length,
      tvFetched: seriesResult.items.length + animeResult.items.length,
      tvTotal: seriesResult.items.length + animeResult.items.length,
      catalogMovies: moviesResult.catalogTotal,
      catalogSeries: seriesResult.catalogTotal,
      catalogAnime: animeResult.catalogTotal,
    },
    source: "vimeus" as const,
  };
}

async function getEnrichedVimeusMatches(contentType: VimeusContentType, query: string) {
  const cached = getCachedSearch(contentType, query);
  if (cached) return cached;

  const fetchPage =
    contentType === "movie"
      ? listVimeusMovies
      : contentType === "series"
        ? listVimeusSeries
        : listVimeusAnimes;

  const { matches } = await scanVimeusListing(fetchPage, query, {});
  const items = await enrichVimeusItems(matches, contentType);
  setCachedSearch(contentType, query, items);
  return items;
}

export async function searchVimeusCatalogPage(options: {
  contentType: VimeusContentType;
  query: string;
  page: number;
  pageSize?: number;
}) {
  const pageSize = options.pageSize ?? 24;
  const items = await getEnrichedVimeusMatches(options.contentType, options.query);
  const totalResults = items.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const safePage = Math.min(Math.max(1, options.page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    totalResults,
  };
}
