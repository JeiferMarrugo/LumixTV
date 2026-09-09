import type { ContentItem } from "@/lib/data";
import { posterUrl, backdropUrl } from "@/lib/tmdb/config";
import { fetchMovieBrief, fetchTvBrief } from "@/lib/tmdb/service";
import { mapVimeusListingItem } from "@/lib/vimeus/mappers";
import type { VimeusContentType, VimeusRawItem } from "@/lib/vimeus/types";

async function runPool<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

export async function enrichVimeusItems(
  items: VimeusRawItem[] | undefined,
  contentType: VimeusContentType,
): Promise<ContentItem[]> {
  const list = items ?? [];
  if (list.length === 0) return [];

  const fetchBrief = contentType === "movie" ? fetchMovieBrief : fetchTvBrief;

  const tasks = list.map((item) => async () => {
    const base = mapVimeusListingItem(item, contentType);

    try {
      const meta = await fetchBrief(item.tmdb_id);
      return {
        ...base,
        title: meta.title || base.title,
        genre: meta.genre,
        year: meta.year || base.year,
        rating: meta.rating,
        image: meta.poster ?? base.image,
      } satisfies ContentItem;
    } catch {
      return base;
    }
  });

  return runPool(tasks, 8);
}

export function parseVimeusCatalogFilters(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const q = url.searchParams.get("q")?.trim() || undefined;
  const genre = url.searchParams.get("genre")?.trim() || undefined;
  const yearRaw = url.searchParams.get("year");
  const year = yearRaw ? Number(yearRaw) : undefined;
  const minRatingRaw = url.searchParams.get("minRating");
  const minRating = minRatingRaw ? Number(minRatingRaw) : undefined;

  const hasFilters = Boolean(
    q || genre || (year && !Number.isNaN(year)) || (minRating && !Number.isNaN(minRating)),
  );

  return { page, q, genre, year, minRating, hasFilters };
}
