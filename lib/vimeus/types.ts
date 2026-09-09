export interface VimeusPagination {
  current_page: number;
  total_pages: number;
  total_results: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

/** Shape returned by the live Vimeus listing API. */
export interface VimeusRawListingData {
  pages?: number;
  result?: VimeusRawItem[];
  movies?: VimeusRawItem[];
  series?: VimeusRawItem[];
  animes?: VimeusRawItem[];
  episodes?: VimeusRawItem[];
  pagination?: VimeusPagination;
}

export interface VimeusRawItem {
  tmdb_id: number;
  title?: string;
  show_title?: string;
  poster?: string | null;
  backdrop?: string | null;
  embed_url?: string;
  download_url?: string;
  imdb_id?: string;
  quality?: string;
  content_type?: string;
  parent_type?: string;
  season?: string | number;
  episode?: string | number;
  synced_at?: string;
}

export interface VimeusPagedItems {
  items: VimeusRawItem[];
  page: number;
  totalPages: number;
  totalResults: number;
}

export interface VimeusApiResponse<T> {
  error: boolean;
  message: string;
  data: T;
}

export type VimeusContentType = "movie" | "series" | "anime";
