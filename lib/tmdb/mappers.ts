import type { ContentDetail } from "@/lib/content-id";
import type { TmdbFeatured, TmdbMovie, TmdbMovieDetail, TmdbTvDetail, TmdbTvShow } from "@/lib/tmdb/types";
import { backdropUrl, posterUrl } from "@/lib/tmdb/config";
import type { ContentItem } from "@/lib/data";
import { getContentById } from "@/lib/data";
import { cleanHeroTitle, truncateHeroDescription } from "@/lib/hero-utils";

const FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=85&auto=format&fit=crop";

function extractYear(date?: string) {
  if (!date) return new Date().getFullYear();
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

function toRating(voteAverage: number) {
  return Math.round((voteAverage / 2) * 10) / 10;
}

function primaryGenre(genreIds: number[], genreMap: Map<number, string>) {
  const first = genreIds[0];
  if (first && genreMap.has(first)) return genreMap.get(first)!;
  return "General";
}

export function mapTmdbMovie(movie: TmdbMovie, genreMap: Map<number, string>): ContentItem {
  return {
    id: `movie-${movie.id}`,
    title: movie.title,
    genre: primaryGenre(movie.genre_ids, genreMap),
    year: extractYear(movie.release_date),
    rating: toRating(movie.vote_average),
    image: posterUrl(movie.poster_path) ?? FALLBACK_POSTER,
    type: "movie",
  };
}

export function mapTmdbTvShow(show: TmdbTvShow, genreMap: Map<number, string>): ContentItem {
  return {
    id: `tv-${show.id}`,
    title: show.name,
    genre: primaryGenre(show.genre_ids, genreMap),
    year: extractYear(show.first_air_date),
    rating: toRating(show.vote_average),
    image: posterUrl(show.poster_path) ?? FALLBACK_POSTER,
    type: "series",
  };
}

export function mapTmdbFeatured(
  movie: TmdbMovie | undefined,
  genreMap: Map<number, string>,
): TmdbFeatured | null {
  if (!movie) return null;
  return {
    id: `movie-${movie.id}`,
    title: cleanHeroTitle(movie.title),
    description: truncateHeroDescription(movie.overview?.trim() || "Descubre este título en LumixTV."),
    genre: primaryGenre(movie.genre_ids, genreMap),
    year: extractYear(movie.release_date),
    rating: `${toRating(movie.vote_average)}/5`,
    image:
      backdropUrl(movie.backdrop_path, "original") ??
      backdropUrl(movie.backdrop_path, "w1280") ??
      posterUrl(movie.poster_path, "w780") ??
      FALLBACK_POSTER,
  };
}

export function mapTmdbFeaturedTv(
  show: TmdbTvShow | undefined,
  genreMap: Map<number, string>,
): TmdbFeatured | null {
  if (!show) return null;
  return {
    id: `tv-${show.id}`,
    title: cleanHeroTitle(show.name),
    description: truncateHeroDescription(show.overview?.trim() || "Descubre este título en LumixTV."),
    genre: primaryGenre(show.genre_ids, genreMap),
    year: extractYear(show.first_air_date),
    rating: `${toRating(show.vote_average)}/5`,
    image:
      backdropUrl(show.backdrop_path, "original") ??
      backdropUrl(show.backdrop_path, "w1280") ??
      posterUrl(show.poster_path, "w780") ??
      FALLBACK_POSTER,
  };
}

export function applyClientFilters(
  items: ContentItem[],
  filters: { year?: number; minRating?: number },
) {
  return items.filter((item) => {
    if (filters.year && item.year !== filters.year) return false;
    if (filters.minRating && item.rating < filters.minRating) return false;
    return true;
  });
}

function mapGenres(genres: { name: string }[]) {
  const names = genres.map((g) => g.name);
  return { genres: names, genre: names[0] ?? "General" };
}

export function mapMovieDetail(movie: TmdbMovieDetail): ContentDetail {
  const { genres, genre } = mapGenres(movie.genres);
  return {
    id: `movie-${movie.id}`,
    title: movie.title,
    overview: movie.overview?.trim() || "Sinopsis no disponible.",
    genre,
    genres,
    year: extractYear(movie.release_date),
    rating: toRating(movie.vote_average),
    poster: posterUrl(movie.poster_path) ?? FALLBACK_POSTER,
    backdrop:
      backdropUrl(movie.backdrop_path, "w1280") ??
      posterUrl(movie.poster_path, "w780") ??
      FALLBACK_POSTER,
    type: "movie",
    runtime: movie.runtime,
    tagline: movie.tagline?.trim() || undefined,
  };
}

export function mapTvDetail(show: TmdbTvDetail): ContentDetail {
  const { genres, genre } = mapGenres(show.genres);
  return {
    id: `tv-${show.id}`,
    title: show.name,
    overview: show.overview?.trim() || "Sinopsis no disponible.",
    genre,
    genres,
    year: extractYear(show.first_air_date),
    rating: toRating(show.vote_average),
    poster: posterUrl(show.poster_path) ?? FALLBACK_POSTER,
    backdrop:
      backdropUrl(show.backdrop_path, "w1280") ??
      posterUrl(show.poster_path, "w780") ??
      FALLBACK_POSTER,
    type: "series",
    seasons: show.number_of_seasons,
    episodes: show.number_of_episodes,
    tagline: show.tagline?.trim() || undefined,
  };
}

export function mapMockContentDetail(item: ContentItem): ContentDetail {
  return {
    id: item.id,
    title: item.title,
    overview: "Explora este título en LumixTV.",
    genre: item.genre,
    genres: [item.genre],
    year: item.year,
    rating: item.rating,
    poster: item.image,
    backdrop: item.image,
    type: item.type === "series" ? "series" : item.type,
  };
}

export function mapMockContentDetailById(id: string): ContentDetail | null {
  const item = getContentById(id);
  if (!item) return null;
  return mapMockContentDetail(item);
}
