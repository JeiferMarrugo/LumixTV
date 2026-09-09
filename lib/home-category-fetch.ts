import type { ContentItem } from "@/lib/data";
import { HOME_ROW_SIZE } from "@/lib/home-categories";
import { shuffle } from "@/lib/shuffle";
import { fetchMovies, fetchSeries } from "@/lib/tmdb/service";
import { enrichVimeusItems } from "@/lib/vimeus/catalog";
import { listVimeusMovies, listVimeusSeries } from "@/lib/vimeus/service";

function matchesGenre(item: ContentItem, genre: string) {
  return item.genre.localeCompare(genre, "es", { sensitivity: "accent" }) === 0;
}

export async function fetchHomeCategoryItems(options: {
  genre: string;
  type: "movie" | "series";
  excludeIds?: string[];
  random?: boolean;
  source: "catalog" | "tmdb";
}) {
  const exclude = new Set(options.excludeIds ?? []);
  const collected: ContentItem[] = [];

  if (options.source === "tmdb") {
    const randomPage = Math.floor(Math.random() * 12) + 1;
    const page = options.random ? randomPage : 1;
    const data =
      options.type === "movie"
        ? await fetchMovies({ genre: options.genre, page })
        : await fetchSeries({ genre: options.genre, page });

    for (const item of shuffle(data.items ?? [])) {
      if (exclude.has(item.id)) continue;
      collected.push(item);
      if (collected.length >= HOME_ROW_SIZE) break;
    }

    return collected.slice(0, HOME_ROW_SIZE);
  }

  let page = options.random ? Math.floor(Math.random() * 15) + 1 : 1;
  let attempts = 0;
  const maxAttempts = 10;

  while (collected.length < HOME_ROW_SIZE && attempts < maxAttempts) {
    attempts += 1;

    const data =
      options.type === "movie" ? await listVimeusMovies(page) : await listVimeusSeries(page);

    const enriched = await enrichVimeusItems(data.items, options.type);

    for (const item of shuffle(enriched)) {
      if (!matchesGenre(item, options.genre)) continue;
      if (exclude.has(item.id)) continue;
      collected.push(item);
      if (collected.length >= HOME_ROW_SIZE) break;
    }

    const totalPages = Math.max(1, data.totalPages ?? 1);
    page = page >= totalPages ? 1 : page + 1;
  }

  return collected.slice(0, HOME_ROW_SIZE);
}
