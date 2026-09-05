export const TMDB_API_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
export const TMDB_LANGUAGE = "es-ES";
export const TMDB_REGION = "CO";

export function getTmdbApiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error("TMDB_API_KEY no configurada");
  }
  return key;
}

export function posterUrl(path: string | null, size: "w500" | "w780" | "original" = "w500") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}
