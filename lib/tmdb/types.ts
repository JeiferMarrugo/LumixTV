export interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  overview?: string;
}

export interface TmdbTvShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
  overview?: string;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbPagedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbFeatured {
  id: string;
  title: string;
  description: string;
  genre: string;
  year: number;
  rating: string;
  image: string;
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  runtime?: number;
  tagline?: string;
  genres: TmdbGenre[];
}

export interface TmdbTvDetail {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  tagline?: string;
  genres: TmdbGenre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
}

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  name: string;
}

export interface TmdbVideosResponse {
  results: TmdbVideo[];
}
