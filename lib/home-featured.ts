import { backdropUrl } from "@/lib/tmdb/config";
import { fetchHeroBrief } from "@/lib/tmdb/service";
import type { TmdbFeatured } from "@/lib/tmdb/types";
import { HOME_FEATURED_COUNT } from "@/lib/home-categories";
import { cleanHeroTitle, truncateHeroDescription } from "@/lib/hero-utils";
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

function featuredFromVimeus(item: VimeusRawItem, type: VimeusContentType): TmdbFeatured | null {
  const base = mapVimeusFeatured(item, type);
  const image = heroBackdropFromPath(item.backdrop);
  if (!image) return null;

  return {
    ...base,
    title: cleanHeroTitle(base.title),
    description: truncateHeroDescription(base.description),
    image,
  } satisfies TmdbFeatured;
}

async function enrichFeaturedItem(
  item: VimeusRawItem,
  type: VimeusContentType,
): Promise<TmdbFeatured | null> {
  const fast = featuredFromVimeus(item, type);
  if (fast) return fast;

  const base = mapVimeusFeatured(item, type);

  try {
    const meta =
      type === "movie"
        ? await fetchHeroBrief(item.tmdb_id, "movie")
        : await fetchHeroBrief(item.tmdb_id, "tv");

    const image = meta.backdrop ?? heroBackdropFromPath(item.backdrop);
    if (!image) return null;

    const description = meta.overview?.trim() || base.description;

    return {
      ...base,
      title: cleanHeroTitle(meta.title || base.title),
      description: truncateHeroDescription(description),
      genre: type === "anime" ? "Anime" : meta.genre || base.genre,
      year: meta.year || base.year,
      rating: meta.rating ? String(meta.rating) : base.rating,
      image,
    } satisfies TmdbFeatured;
  } catch {
    return null;
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
  const collected: TmdbFeatured[] = [];
  const seenIds = new Set<string>();

  for (const { item, type } of candidates) {
    if (collected.length >= HOME_FEATURED_COUNT) break;

    const featured = featuredFromVimeus(item, type);
    if (!featured?.id || seenIds.has(featured.id)) continue;

    seenIds.add(featured.id);
    collected.push(featured);
  }

  if (collected.length >= HOME_FEATURED_COUNT) {
    return collected.slice(0, HOME_FEATURED_COUNT);
  }

  const remaining = candidates.filter(({ item, type }) => {
    const id = `${type}-${item.tmdb_id}`;
    return !seenIds.has(id);
  });

  const enriched = await Promise.all(
    remaining.slice(0, 12).map(({ item, type }) => enrichFeaturedItem(item, type)),
  );

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
