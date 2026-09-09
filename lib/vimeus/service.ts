import { getVimeusBaseUrl, getVimeusApiKey, isVimeusApiConfigured } from "@/lib/vimeus/config";
import { applyVimeusEmbedUi } from "@/lib/vimeus/embed";
import { normalizeVimeusListing } from "@/lib/vimeus/normalize";
import type { VimeusApiResponse, VimeusPagedItems, VimeusRawListingData } from "@/lib/vimeus/types";

async function vimeusFetch<T>(path: string, query: Record<string, string | number | undefined> = {}) {
  if (!isVimeusApiConfigured()) {
    throw new Error("VIMEUS_API_KEY no configurada");
  }

  const url = new URL(`${getVimeusBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": getVimeusApiKey(),
    },
    next: { revalidate: 300 },
  });

  const body = (await res.json()) as VimeusApiResponse<T>;

  if (!res.ok || body.error) {
    throw new Error(body.message || `Error del proveedor ${res.status}`);
  }

  if (body.data == null) {
    throw new Error("Respuesta vacía del catálogo");
  }

  return body.data;
}

export function resolveVimeusEmbedUrl(embedPath: string) {
  const resolved = embedPath.startsWith("http://") || embedPath.startsWith("https://")
    ? embedPath
    : `${getVimeusBaseUrl()}${embedPath.startsWith("/") ? embedPath : `/${embedPath}`}`;

  return applyVimeusEmbedUi(resolved);
}

export async function listVimeusMovies(page = 1): Promise<VimeusPagedItems> {
  const data = await vimeusFetch<VimeusRawListingData>("/api/listing/movies", { page });
  return normalizeVimeusListing(data, "movies", page);
}

export async function listVimeusSeries(page = 1): Promise<VimeusPagedItems> {
  const data = await vimeusFetch<VimeusRawListingData>("/api/listing/series", { page });
  return normalizeVimeusListing(data, "series", page);
}

export async function listVimeusAnimes(page = 1): Promise<VimeusPagedItems> {
  const data = await vimeusFetch<VimeusRawListingData>("/api/listing/animes", { page });
  return normalizeVimeusListing(data, "animes", page);
}

export async function listVimeusEpisodes(options: {
  page?: number;
  tmdbId?: number;
  season?: number;
}): Promise<VimeusPagedItems> {
  const data = await vimeusFetch<VimeusRawListingData>("/api/listing/episodes", {
    page: options.page ?? 1,
    tmdb_id: options.tmdbId,
    season: options.season,
  });
  return normalizeVimeusListing(data, "episodes", options.page ?? 1);
}

/** Fetches every page of episodes for a show season (Vimeus API is paginated). */
export async function listAllVimeusEpisodesForSeason(options: {
  tmdbId: number;
  season: number;
}): Promise<VimeusPagedItems> {
  const first = await listVimeusEpisodes({
    tmdbId: options.tmdbId,
    season: options.season,
    page: 1,
  });

  if (first.totalPages <= 1) return first;

  const allItems = [...first.items];

  for (let page = 2; page <= first.totalPages; page++) {
    const next = await listVimeusEpisodes({
      tmdbId: options.tmdbId,
      season: options.season,
      page,
    });
    allItems.push(...next.items);
  }

  return {
    items: allItems,
    page: 1,
    totalPages: first.totalPages,
    totalResults: first.totalResults,
  };
}
