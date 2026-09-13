import { backdropUrl } from "@/lib/tmdb/config";
import { fetchContentDetail, fetchHeroBrief } from "@/lib/tmdb/service";
import type { TmdbFeatured } from "@/lib/tmdb/types";
import { HOME_FEATURED_COUNT } from "@/lib/home-categories";
import {
  cleanHeroTitle,
  isPlaceholderHeroDescription,
  truncateHeroDescription,
} from "@/lib/hero-utils";
import { shuffle } from "@/lib/shuffle";
import { mapVimeusFeatured } from "@/lib/vimeus/mappers";
import {
  listVimeusAnimes,
  listVimeusMovies,
  listVimeusSeries,
} from "@/lib/vimeus/service";
import type { VimeusContentType, VimeusRawItem } from "@/lib/vimeus/types";

function randomPage(max = 20) {
  return Math.floor(Math.random() * max) + 1;
}

function heroBackdropFromPath(path: string | null | undefined) {
  if (!path) return null;
  return backdropUrl(path, "original") ?? backdropUrl(path, "w1280");
}

async function runPool<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
  );
  return results;
}

function featuredFromVimeus(item: VimeusRawItem, type: VimeusContentType): TmdbFeatured | null {
  const base = mapVimeusFeatured(item, type);
  const image = heroBackdropFromPath(item.backdrop);
  if (!image) return null;

  return {
    ...base,
    title: cleanHeroTitle(base.title),
    description: truncateHeroDescription(base.description, 240),
    quality: item.quality ?? undefined,
    image,
  } satisfies TmdbFeatured;
}

async function resolveHeroMeta(item: VimeusRawItem, type: VimeusContentType) {
  const kinds = type === "movie" ? (["movie", "tv"] as const) : (["tv", "movie"] as const);

  for (const kind of kinds) {
    try {
      return await fetchHeroBrief(item.tmdb_id, kind);
    } catch {
      /* probar otro tipo en TMDB */
    }
  }

  throw new Error(`Sin metadata TMDB para ${item.tmdb_id}`);
}

async function resolveHeroDescription(
  base: ReturnType<typeof mapVimeusFeatured>,
  metaOverview: string | undefined,
) {
  const fromMeta = metaOverview?.trim() ?? "";
  if (fromMeta && !isPlaceholderHeroDescription(fromMeta)) {
    return truncateHeroDescription(fromMeta, 240);
  }

  if (base.id) {
    try {
      const detail = await fetchContentDetail(base.id);
      const fromDetail = detail?.overview?.trim() ?? "";
      if (fromDetail && !isPlaceholderHeroDescription(fromDetail)) {
        return truncateHeroDescription(fromDetail, 240);
      }
    } catch {
      /* ignore */
    }
  }

  if (fromMeta) return truncateHeroDescription(fromMeta, 240);
  return truncateHeroDescription(base.description, 240);
}

async function enrichFeaturedItem(
  item: VimeusRawItem,
  type: VimeusContentType,
): Promise<TmdbFeatured | null> {
  const base = mapVimeusFeatured(item, type);

  try {
    const meta = await resolveHeroMeta(item, type);
    const image = meta.backdrop ?? heroBackdropFromPath(item.backdrop);
    if (!image) return null;

    const description = await resolveHeroDescription(base, meta.overview);

    return {
      ...base,
      title: cleanHeroTitle(meta.title || base.title),
      description,
      tagline: meta.tagline?.trim() || undefined,
      quality: item.quality ?? undefined,
      genre: type === "anime" ? "Anime" : meta.genre || base.genre,
      year: meta.year || base.year,
      rating: meta.rating ? String(meta.rating) : base.rating,
      image,
    } satisfies TmdbFeatured;
  } catch {
    return featuredFromVimeus(item, type);
  }
}

type FeaturedCandidate = { item: VimeusRawItem; type: VimeusContentType };

async function fetchCandidateBatch(): Promise<FeaturedCandidate[]> {
  const pages = {
    movie: randomPage(),
    series: randomPage(),
    anime: randomPage(),
  };

  const [moviesData, seriesData, animesData] = await Promise.all([
    listVimeusMovies(pages.movie),
    listVimeusSeries(pages.series),
    listVimeusAnimes(pages.anime),
  ]);

  return shuffle([
    ...moviesData.items.map((item) => ({ item, type: "movie" as const })),
    ...seriesData.items.map((item) => ({ item, type: "series" as const })),
    ...animesData.items.map((item) => ({ item, type: "anime" as const })),
  ]).filter(({ item }) => item.backdrop);
}

async function collectFromCandidates(candidates: FeaturedCandidate[]) {
  const pool = candidates.slice(0, 18);
  const tasks = pool.map(
    ({ item, type }) =>
      () =>
        enrichFeaturedItem(item, type),
  );
  const enriched = await runPool(tasks, 4);

  const collected: TmdbFeatured[] = [];
  const seenIds = new Set<string>();

  for (const item of enriched) {
    if (collected.length >= HOME_FEATURED_COUNT) break;
    if (!item?.id || seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    collected.push(item);
  }

  return collected;
}

export async function buildRandomVimeusFeaturedList(): Promise<TmdbFeatured[]> {
  let collected = await collectFromCandidates(await fetchCandidateBatch());

  if (collected.length < HOME_FEATURED_COUNT) {
    collected = await collectFromCandidates(await fetchCandidateBatch());
  }

  return collected.slice(0, HOME_FEATURED_COUNT);
}
