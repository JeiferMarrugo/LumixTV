import type {
  LoginCinemaMovie,
  TmdbMovie,
  TmdbMovieDetail,
  TmdbPagedResponse,
  TmdbSeasonDetail,
  TmdbTvDetail,
  TmdbTvShow,
  TmdbVideosResponse,
} from "@/lib/tmdb/types";
import {
  TMDB_API_BASE,
  TMDB_LANGUAGE,
  TMDB_REGION,
  backdropUrl,
  getTmdbApiKey,
  posterUrl,
} from "@/lib/tmdb/config";
import { findGenreIdByName, getMovieGenres, getTvGenres } from "@/lib/tmdb/genres";
import {
  applyClientFilters,
  mapMockContentDetailById,
  mapMovieDetail,
  mapTmdbFeatured,
  mapTmdbFeaturedTv,
  mapTmdbMovie,
  mapTmdbTvShow,
  mapTvDetail,
} from "@/lib/tmdb/mappers";
import type { ContentItem } from "@/lib/data";
import type { TmdbFeatured } from "@/lib/tmdb/types";
import type { ContentDetail } from "@/lib/content-id";
import { parseContentId } from "@/lib/content-id";
import { HOME_FEATURED_COUNT } from "@/lib/home-categories";
import { shuffle } from "@/lib/shuffle";

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

  let items = (data.results ?? []).map((movie) => mapTmdbMovie(movie, genreMap));
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

  let items = (data.results ?? []).map((show) => mapTmdbTvShow(show, genreMap));
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

export async function fetchLoginCinemaMovies(): Promise<LoginCinemaMovie[]> {
  const data = await tmdbFetch<TmdbPagedResponse<TmdbMovie>>("/trending/movie/week");

  return data.results
    .filter((movie) => movie.poster_path)
    .slice(0, 10)
    .map((movie) => ({
      id: String(movie.id),
      title: movie.title,
      poster: posterUrl(movie.poster_path, "w500")!,
      backdrop:
        backdropUrl(movie.backdrop_path, "w1280") ??
        posterUrl(movie.poster_path, "w780")!,
    }));
}

export async function fetchTrending(): Promise<{
  movies: ContentItem[];
  series: ContentItem[];
  featured: TmdbFeatured | null;
  featuredList: TmdbFeatured[];
}> {
  const { map: genreMap } = await getMovieGenres();
  const { map: tvGenreMap } = await getTvGenres();

  const moviePage = Math.floor(Math.random() * 8) + 1;
  const seriesPage = Math.floor(Math.random() * 8) + 1;
  const animePage = Math.floor(Math.random() * 8) + 1;

  const [moviesData, seriesData, animeData] = await Promise.all([
    tmdbFetch<TmdbPagedResponse<TmdbMovie>>("/trending/movie/week"),
    tmdbFetch<TmdbPagedResponse<TmdbTvShow>>("/trending/tv/week"),
    fetchAnimes({ page: animePage }),
  ]);

  const movies = moviesData.results.slice(0, 10).map((m) => mapTmdbMovie(m, genreMap));
  const series = seriesData.results.slice(0, 10).map((s) => mapTmdbTvShow(s, tvGenreMap));

  const movieDiscover = await tmdbFetch<TmdbPagedResponse<TmdbMovie>>("/discover/movie", {
    page: String(moviePage),
    sort_by: "popularity.desc",
  });
  const seriesDiscover = await tmdbFetch<TmdbPagedResponse<TmdbTvShow>>("/discover/tv", {
    page: String(seriesPage),
    sort_by: "popularity.desc",
  });

  const candidates: TmdbFeatured[] = [];

  for (const movie of movieDiscover.results) {
    const featured = mapTmdbFeatured(movie, genreMap);
    if (featured) candidates.push(featured);
  }

  for (const show of seriesDiscover.results) {
    const featured = mapTmdbFeaturedTv(show, tvGenreMap);
    if (featured) candidates.push(featured);
  }

  for (const anime of animeData.items.slice(0, 12)) {
    candidates.push({
      id: anime.id,
      title: anime.title,
      description: "Descubre este anime en LumixTV.",
      genre: "Anime",
      year: anime.year,
      rating: `${anime.rating}/5`,
      image: anime.image,
    });
  }

  const featuredList = shuffle(candidates)
    .filter((item) => item.image)
    .slice(0, HOME_FEATURED_COUNT);

  return {
    movies,
    series,
    featured: featuredList[0] ?? null,
    featuredList,
  };
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

export async function fetchTvSeason(tmdbId: number, season: number) {
  const data = await tmdbFetch<TmdbSeasonDetail>(`/tv/${tmdbId}/season/${season}`);

  return {
    seasonNumber: data.season_number,
    episodes: data.episodes.map((ep) => ({
      number: ep.episode_number,
      name: ep.name,
      runtime: ep.runtime,
    })),
  };
}

export async function fetchMovieBrief(tmdbId: number) {
  const data = await tmdbFetch<TmdbMovieDetail>(`/movie/${tmdbId}`);

  return {
    title: data.title,
    genre: data.genres[0]?.name ?? "Película",
    year: data.release_date ? new Date(data.release_date).getFullYear() : 0,
    rating: Math.round(data.vote_average * 10) / 10,
    poster: posterUrl(data.poster_path, "w500"),
    backdrop: backdropUrl(data.backdrop_path, "w780"),
    overview: data.overview,
  };
}

export async function fetchTvBrief(tmdbId: number) {
  const data = await tmdbFetch<TmdbTvDetail>(`/tv/${tmdbId}`);

  return {
    title: data.name,
    genre: data.genres[0]?.name ?? "Serie",
    year: data.first_air_date ? new Date(data.first_air_date).getFullYear() : 0,
    rating: Math.round(data.vote_average * 10) / 10,
    poster: posterUrl(data.poster_path, "w500"),
    backdrop: backdropUrl(data.backdrop_path, "w780"),
    overview: data.overview,
  };
}

export async function fetchHeroBrief(tmdbId: number, kind: "movie" | "tv") {
  if (kind === "movie") {
    const data = await tmdbFetch<TmdbMovieDetail>(`/movie/${tmdbId}`);

    return {
      title: data.title,
      genre: data.genres[0]?.name ?? "Película",
      year: data.release_date ? new Date(data.release_date).getFullYear() : 0,
      rating: Math.round(data.vote_average * 10) / 10,
      backdrop:
        backdropUrl(data.backdrop_path, "original") ??
        backdropUrl(data.backdrop_path, "w1280") ??
        posterUrl(data.poster_path, "w780"),
      overview: data.overview,
    };
  }

  const data = await tmdbFetch<TmdbTvDetail>(`/tv/${tmdbId}`);

  return {
    title: data.name,
    genre: data.genres[0]?.name ?? "Serie",
    year: data.first_air_date ? new Date(data.first_air_date).getFullYear() : 0,
    rating: Math.round(data.vote_average * 10) / 10,
    backdrop:
      backdropUrl(data.backdrop_path, "original") ??
      backdropUrl(data.backdrop_path, "w1280") ??
      posterUrl(data.poster_path, "w780"),
    overview: data.overview,
  };
}

export async function fetchAnimes(options: {
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
      with_genres: String(findGenreIdByName(genreMap, "Animación") ?? 16),
    };

    if (options.genre && options.genre !== "Animación") {
      const genreId = findGenreIdByName(genreMap, options.genre);
      if (genreId) params.with_genres = String(genreId);
    }

    if (options.year) {
      params.first_air_date_year = String(options.year);
    }

    data = await tmdbFetch<TmdbPagedResponse<TmdbTvShow>>("/discover/tv", params);
  }

  let items: ContentItem[] = (data.results ?? []).map((show) => ({
    ...mapTmdbTvShow(show, genreMap),
    type: "anime" as const,
  }));
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

const ANIMATION_GENRE_ID = 16;
const FULL_SEARCH_MAX_PAGES = 20;

function isAnimeTvShow(show: TmdbTvShow) {
  return show.genre_ids?.includes(ANIMATION_GENRE_ID) ?? false;
}

async function fetchTmdbSearchPages<T>(
  path: "/search/movie" | "/search/tv",
  query: string,
  maxPages: number,
) {
  const first = await tmdbFetch<TmdbPagedResponse<T>>(path, {
    query,
    page: "1",
    include_adult: "false",
  });

  const results = [...(first.results ?? [])];
  const reportedTotalPages = first.total_pages ?? 1;
  const pagesToFetch = Math.min(reportedTotalPages, maxPages);

  for (let page = 2; page <= pagesToFetch; page += 1) {
    const data = await tmdbFetch<TmdbPagedResponse<T>>(path, {
      query,
      page: String(page),
      include_adult: "false",
    });
    results.push(...(data.results ?? []));
  }

  return {
    results,
    totalResults: first.total_results ?? results.length,
    reportedTotalPages,
    fetchedPages: pagesToFetch,
  };
}

function splitTvResults(shows: TmdbTvShow[], tvGenreMap: Map<number, string>) {
  const anime: ContentItem[] = [];
  const series: ContentItem[] = [];

  for (const show of shows) {
    const mapped = mapTmdbTvShow(show, tvGenreMap);
    if (isAnimeTvShow(show)) {
      anime.push({ ...mapped, type: "anime" });
    } else {
      series.push(mapped);
    }
  }

  return { anime, series };
}

export async function searchAllContent(
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
    };
  }

  const previewLimit = options.previewLimit;
  const maxPages = options.maxPages ?? (previewLimit ? 1 : FULL_SEARCH_MAX_PAGES);

  const [{ map: movieGenreMap }, { map: tvGenreMap }] = await Promise.all([
    getMovieGenres(),
    getTvGenres(),
  ]);

  const [movieData, tvData] = await Promise.all([
    fetchTmdbSearchPages<TmdbMovie>("/search/movie", q, maxPages),
    fetchTmdbSearchPages<TmdbTvShow>("/search/tv", q, maxPages),
  ]);

  const movies = (previewLimit ? movieData.results.slice(0, previewLimit) : movieData.results).map(
    (movie) => mapTmdbMovie(movie, movieGenreMap),
  );
  const { anime: allAnime, series: allSeries } = splitTvResults(tvData.results, tvGenreMap);
  const limitedAnime = previewLimit ? allAnime.slice(0, previewLimit) : allAnime;
  const limitedSeries = previewLimit ? allSeries.slice(0, previewLimit) : allSeries;

  return {
    query: q,
    movies,
    series: limitedSeries,
    anime: limitedAnime,
    total: movies.length + limitedSeries.length + limitedAnime.length,
    totals: {
      movies: movieData.totalResults,
      series: limitedSeries.length,
      anime: limitedAnime.length,
    },
    meta: {
      moviesFetched: movies.length,
      moviesTotal: movieData.totalResults,
      tvFetched: tvData.results.length,
      tvTotal: tvData.totalResults,
      hasMoreMovies: movieData.reportedTotalPages > movieData.fetchedPages,
      hasMoreTv: tvData.reportedTotalPages > tvData.fetchedPages,
    },
  };
}
