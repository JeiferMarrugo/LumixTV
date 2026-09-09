import type { ContentItem } from "@/lib/data";
import { fetchHomeCategoryItems } from "@/lib/home-category-fetch";
import { isVimeusApiConfigured } from "@/lib/vimeus/config";
import { listPopularContent, listUserWatchHistory } from "@/lib/watch-history";
import { fetchMovies, fetchSeries } from "@/lib/tmdb/service";
import { shuffle } from "@/lib/shuffle";

const RECOMMENDATION_LIMIT = 6;

function topGenres(history: { genre: string | null }[], limit = 3) {
  const counts = new Map<string, number>();

  for (const row of history) {
    if (!row.genre) continue;
    counts.set(row.genre, (counts.get(row.genre) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre);
}

async function fetchFallbackTrending(source: "catalog" | "tmdb"): Promise<ContentItem[]> {
  if (source === "tmdb") {
    const [movies, series] = await Promise.all([
      fetchMovies({ page: Math.floor(Math.random() * 5) + 1 }),
      fetchSeries({ page: Math.floor(Math.random() * 5) + 1 }),
    ]);
    return shuffle([...(movies.items ?? []), ...(series.items ?? [])]).slice(0, RECOMMENDATION_LIMIT);
  }

  const genre = shuffle(["Acción", "Drama", "Comedia", "Aventura"])[0];
  return fetchHomeCategoryItems({
    genre,
    type: "movie",
    random: true,
    source: "catalog",
  });
}

async function fetchGenreRecommendations(options: {
  genres: string[];
  excludeIds: Set<string>;
  source: "catalog" | "tmdb";
}) {
  const collected: ContentItem[] = [];

  for (const genre of options.genres) {
    if (collected.length >= RECOMMENDATION_LIMIT) break;

    const type = genre === "Anime" || genre === "Animación" ? "series" : "movie";
    const items = await fetchHomeCategoryItems({
      genre,
      type,
      excludeIds: [...options.excludeIds, ...collected.map((item) => item.id)],
      random: true,
      source: options.source,
    });

    for (const item of items) {
      if (options.excludeIds.has(item.id)) continue;
      collected.push(item);
      if (collected.length >= RECOMMENDATION_LIMIT) break;
    }
  }

  return collected.slice(0, RECOMMENDATION_LIMIT);
}

export async function buildRecommendations(userId: string) {
  const source = isVimeusApiConfigured() ? "catalog" : "tmdb";
  const [history, popular] = await Promise.all([
    listUserWatchHistory(userId, 40),
    listPopularContent(RECOMMENDATION_LIMIT),
  ]);

  const watchedIds = new Set(history.map((row) => row.contentId));
  const genres = topGenres(history);

  let forYouItems: ContentItem[] = [];
  let forYouSubtitle: string | null = null;

  if (genres.length > 0) {
    forYouItems = await fetchGenreRecommendations({
      genres,
      excludeIds: watchedIds,
      source,
    });
    forYouSubtitle = `Porque sueles ver ${genres.slice(0, 2).join(" y ")}`;
  }

  if (forYouItems.length === 0) {
    forYouItems = await fetchFallbackTrending(source);
    forYouSubtitle = "Explora títulos que podrían gustarte";
  }

  const popularFiltered = popular.filter((item) => !watchedIds.has(item.id));
  let popularItems = popularFiltered.length > 0 ? popularFiltered : popular;
  if (popularItems.length === 0) {
    popularItems = await fetchFallbackTrending(source);
  }

  return {
    forYou: {
      title: "Recomendado para ti",
      subtitle: forYouSubtitle,
      items: forYouItems,
    },
    popular: {
      title: "Lo más visto en LumixTV",
      subtitle: "Basado en lo que la comunidad reproduce",
      items: popularItems,
    },
  };
}
