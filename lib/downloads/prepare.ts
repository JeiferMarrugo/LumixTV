import { parseContentId } from "@/lib/content-id";
import { fetchContentDetail } from "@/lib/tmdb/service";
import type { VimeusEmbedKind } from "@/lib/vimeus/embed";
import { isVimeusEmbedConfigured } from "@/lib/vimeus/config";
import { resolvePlaybackSources } from "@/lib/vimeus/playback";
import { resolveVimeusDownloadFile } from "@/lib/vimeus/download";

function parseKind(value: string | null | undefined, parsedKind: "movie" | "tv"): VimeusEmbedKind {
  if (value === "anime") return "anime";
  if (value === "movie") return "movie";
  if (value === "series" || value === "tv") return "tv";
  return parsedKind === "movie" ? "movie" : "tv";
}

export interface PrepareDownloadInput {
  contentId: string;
  season?: number;
  episode?: number;
  type?: "movie" | "series" | "anime";
}

export interface PreparedDownload {
  contentId: string;
  contentType: "movie" | "series" | "anime";
  title: string;
  image?: string | null;
  season: number;
  episode: number;
  filename: string;
  fileUrl: string;
}

export async function prepareContentDownload(
  input: PrepareDownloadInput,
): Promise<{ ok: true; data: PreparedDownload } | { ok: false; error: string; status: number }> {
  const contentId = decodeURIComponent(input.contentId);
  const parsed = parseContentId(contentId);

  if (parsed.kind === "mock") {
    return { ok: false, error: "Contenido no compatible", status: 400 };
  }

  if (!isVimeusEmbedConfigured()) {
    return { ok: false, error: "Descarga no configurada", status: 503 };
  }

  const season = Math.max(1, input.season ?? 1);
  const episode = Math.max(1, input.episode ?? 1);
  const contentType = (input.type ?? parsed.kind) as "movie" | "series" | "anime";
  const embedKind = parseKind(input.type, parsed.kind);

  const detail = await fetchContentDetail(contentId).catch(() => null);

  const sources = await resolvePlaybackSources({
    tmdbId: parsed.tmdbId,
    embedKind,
    contentType,
    season,
    episode,
  });

  const file = await resolveVimeusDownloadFile({
    embedKind,
    tmdbId: parsed.tmdbId,
    season,
    episode,
    title: detail?.title,
    downloadPageUrl: sources.downloadUrl,
  });

  if (!file) {
    return { ok: false, error: "No se pudo preparar la descarga", status: 502 };
  }

  const query = new URLSearchParams({
    season: String(season),
    episode: String(episode),
    type: contentType,
  });

  return {
    ok: true,
    data: {
      contentId,
      contentType,
      title: detail?.title ?? "Descarga",
      image: detail?.poster ?? null,
      season,
      episode,
      filename: file.filename,
      fileUrl: `/api/content/${encodeURIComponent(contentId)}/download/file?${query}`,
    },
  };
}
