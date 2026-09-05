import type { TmdbGenre } from "@/lib/tmdb/types";
import { TMDB_API_BASE, TMDB_LANGUAGE, getTmdbApiKey } from "@/lib/tmdb/config";

let movieGenresCache: { map: Map<number, string>; names: string[] } | null = null;
let tvGenresCache: { map: Map<number, string>; names: string[] } | null = null;

async function fetchGenres(type: "movie" | "tv") {
  const apiKey = getTmdbApiKey();
  const url = new URL(`${TMDB_API_BASE}/genre/${type}/list`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", TMDB_LANGUAGE);

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`TMDB genres error: ${type}`);

  const data = (await res.json()) as { genres: TmdbGenre[] };
  const map = new Map(data.genres.map((g) => [g.id, g.name]));
  const names = data.genres.map((g) => g.name).sort((a, b) => a.localeCompare(b, "es"));

  return { map, names };
}

export async function getMovieGenres() {
  if (!movieGenresCache) {
    movieGenresCache = await fetchGenres("movie");
  }
  return movieGenresCache;
}

export async function getTvGenres() {
  if (!tvGenresCache) {
    tvGenresCache = await fetchGenres("tv");
  }
  return tvGenresCache;
}

export function findGenreIdByName(genres: Map<number, string>, name: string) {
  for (const [id, genreName] of genres) {
    if (genreName.toLowerCase() === name.toLowerCase()) return id;
  }
  return null;
}
