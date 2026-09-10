export interface ContentDetail {
  id: string;
  title: string;
  overview: string;
  genre: string;
  genres: string[];
  year: number;
  rating: number;
  poster: string;
  backdrop: string;
  type: "movie" | "series" | "anime";
  runtime?: number;
  seasons?: number;
  episodes?: number;
  tagline?: string;
}

export function contentHref(id: string) {
  return `/titulo/${encodeURIComponent(id)}`;
}

export function parseContentId(
  id: string,
):
  | { kind: "movie" | "tv"; tmdbId: number }
  | { kind: "mock"; id: string } {
  const match = id.match(/^(movie|tv)-(\d+)$/);
  if (match) {
    return { kind: match[1] as "movie" | "tv", tmdbId: Number(match[2]) };
  }
  return { kind: "mock", id };
}
