import type { TmdbMovie, TmdbMovieDetail, TmdbPagedResponse, TmdbTvDetail, TmdbTvShow, TmdbVideosResponse } from "@/lib/tmdb/types";
import {
  TMDB_API_BASE,
  TMDB_LANGUAGE,
  TMDB_REGION,
  getTmdbApiKey,
} from "@/lib/tmdb/config";
import { findGenreIdByName, getMovieGenres, getTvGenres } from "@/lib/tmdb/genres";
import {
  applyClientFilters,
  mapMockContentDetailById,
  mapMovieDetail,
  mapTmdbFeatured,
  mapTmdbMovie,
  mapTmdbTvShow,
  mapTvDetail,
} from "@/lib/tmdb/mappers";
import type { ContentItem } from "@/lib/data";
import type { TmdbFeatured } from "@/lib/tmdb/types";
import type { ContentDetail } from "@/lib/content-id";
import { parseContentId } from "@/lib/content-id";

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}) {
  const apiKey = getTmdbApiKey();
  const url = new URL(`${TMDB_API_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", TMDB_LANGUAGE);
  url.searchParams.set("region", TMDB_REGION);

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`TMDB error ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchMovies(options: {
  page?: number;
  q?: string;
  genre?: string;
  year?: number;
  minRating?: number;
}) {
  const { map: genreMap, names: genres } = await getMovieGenres();
  const page = String(options.page ?? 1);

  let data: TmdbPagedResponse<TmdbMovie>;

  if (options.q?.trim()) {
    data = await tmdbFetch<TmdbPagedResponse<TmdbMovie>>("/search/movie", {
      query: options.q.trim(),
      page,
      include_adult: "false",
    });
  } else {
    const params: Record<string, string> = {
      page,
      sort_by: "popularity.desc",
    };

    if (options.genre) {
      const genreId = findGenreIdByName(genreMap, options.genre);
      if (genreId) params.with_genres = String(genreId);
    }

    if (options.year) {
      params.primary_release_year = String(options.year);
    }

    data = await tmdbFetch<TmdbPagedResponse<TmdbMovie>>("/discover/movie", params);
  }

  let items = data.results.map((movie) => mapTmdbMovie(movie, genreMap));
  items = applyClientFilters(items, {
    year: options.q ? options.year : undefined,
    minRating: options.minRating,
  });

  return {
    items,
    genres,
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}

export async function fetchSeries(options: {
  page?: number;
  q?: string;
  genre?: string;
  year?: number;
  minRating?: number;
}) {
  const { map: genreMap, names: genres } = await getTvGenres();
  const page = String(options.page ?? 1);

  let data: TmdbPagedResponse<TmdbTvShow>;

  if (options.q?.trim()) {
    data = await tmdbFetch<TmdbPagedResponse<TmdbTvShow>>("/search/tv", {
      query: options.q.trim(),
      page,
      include_adult: "false",
    });
  } else {
    const params: Record<string, string> = {
      page,
      sort_by: "popularity.desc",
    };

    if (options.genre) {
      const genreId = findGenreIdByName(genreMap, options.genre);
      if (genreId) params.with_genres = String(genreId);
    }

    if (options.year) {
      params.first_air_date_year = String(options.year);
    }

    data = await tmdbFetch<TmdbPagedResponse<TmdbTvShow>>("/discover/tv", params);
  }

  let items = data.results.map((show) => mapTmdbTvShow(show, genreMap));
  items = applyClientFilters(items, {
    year: options.q ? options.year : undefined,
    minRating: options.minRating,
  });

  return {
    items,
    genres,
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
  };
}

export async function fetchTrending(): Promise<{
  movies: ContentItem[];
  series: ContentItem[];
  featured: TmdbFeatured | null;
}> {
  const { map: genreMap } = await getMovieGenres();
  const { map: tvGenreMap } = await getTvGenres();

  const [moviesData, seriesData] = await Promise.all([
    tmdbFetch<TmdbPagedResponse<TmdbMovie>>("/trending/movie/week"),
    tmdbFetch<TmdbPagedResponse<TmdbTvShow>>("/trending/tv/week"),
  ]);

  const movies = moviesData.results.slice(0, 10).map((m) => mapTmdbMovie(m, genreMap));
  const series = seriesData.results.slice(0, 10).map((s) => mapTmdbTvShow(s, tvGenreMap));
  const featuredMovie = moviesData.results.find((m) => m.backdrop_path || m.poster_path);
  const featured = mapTmdbFeatured(featuredMovie, genreMap);

  return { movies, series, featured };
}

export async function fetchContentDetail(id: string): Promise<ContentDetail | null> {
  const parsed = parseContentId(id);

  if (parsed.kind === "mock") {
    return mapMockContentDetailById(parsed.id);
  }

  if (parsed.kind === "movie") {
    const data = await tmdbFetch<TmdbMovieDetail>(`/movie/${parsed.tmdbId}`);
    return mapMovieDetail(data);
  }

  const data = await tmdbFetch<TmdbTvDetail>(`/tv/${parsed.tmdbId}`);
  return mapTvDetail(data);
}

export async function fetchContentTrailer(id: string): Promise<string | null> {
  const parsed = parseContentId(id);
  if (parsed.kind === "mock") return null;

  const path = parsed.kind === "movie" ? `/movie/${parsed.tmdbId}/videos` : `/tv/${parsed.tmdbId}/videos`;
  const data = await tmdbFetch<TmdbVideosResponse>(path);
  const video =
    data.results.find((v) => v.site === "YouTube" && v.type === "Trailer") ??
    data.results.find((v) => v.site === "YouTube" && v.type === "Teaser");

  return video?.key ?? null;
}
