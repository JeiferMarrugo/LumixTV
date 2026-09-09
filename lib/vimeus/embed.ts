import {
  getVimeusBaseUrl,
  getVimeusViewKey,
  isVimeusEmbedConfigured,
} from "@/lib/vimeus/config";

export type VimeusEmbedKind = "movie" | "tv" | "anime";

export interface VimeusEmbedParams {
  kind: VimeusEmbedKind;
  tmdbId: number;
  season?: number;
  episode?: number;
}

/** UI del reproductor Vimeus (theme minimal, controles v3/v4). */
export const VIMEUS_EMBED_UI = {
  theme: "minimal",
  loader: "v3",
  font: "v3",
  overlay: "v4",
  selector: "v2",
  playUI: "v3",
  epanel: "v3",
  splash: "v3",
} as const;

function embedPath(kind: VimeusEmbedKind) {
  if (kind === "movie") return "movie";
  if (kind === "anime") return "anime";
  return "serie";
}

function isVimeusPlayerUrl(url: URL) {
  return /\/e\/(movie|serie|anime)\/?$/i.test(url.pathname);
}

export function applyVimeusEmbedUi(url: string): string {
  try {
    const parsed = new URL(url);
    if (!isVimeusPlayerUrl(parsed)) return url;

    for (const [key, value] of Object.entries(VIMEUS_EMBED_UI)) {
      parsed.searchParams.set(key, value);
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

export function buildVimeusEmbedUrl(params: VimeusEmbedParams): string | null {
  if (!isVimeusEmbedConfigured()) return null;

  const base = getVimeusBaseUrl();
  const viewKey = getVimeusViewKey();
  const url = new URL(`${base}/e/${embedPath(params.kind)}`);

  url.searchParams.set("tmdb", String(params.tmdbId));
  url.searchParams.set("view_key", viewKey);

  if (params.kind === "tv" || params.kind === "anime") {
    if (params.season) url.searchParams.set("se", String(params.season));
    if (params.episode) url.searchParams.set("ep", String(params.episode));
  }

  return applyVimeusEmbedUi(url.toString());
}
