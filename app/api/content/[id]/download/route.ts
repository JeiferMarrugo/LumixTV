import { NextResponse } from "next/server";
import { parseContentId } from "@/lib/content-id";
import { requireAuthSession } from "@/lib/session";
import { fetchContentDetail } from "@/lib/tmdb/service";
import type { VimeusEmbedKind } from "@/lib/vimeus/embed";
import { isVimeusEmbedConfigured } from "@/lib/vimeus/config";
import { resolvePlaybackSources } from "@/lib/vimeus/playback";
import {
  resolveVimeusDownloadFile,
  sanitizeDownloadFilename,
} from "@/lib/vimeus/download";

function parseKind(value: string | null, parsedKind: "movie" | "tv"): VimeusEmbedKind {
  if (value === "anime") return "anime";
  if (value === "movie") return "movie";
  if (value === "series" || value === "tv") return "tv";
  return parsedKind === "movie" ? "movie" : "tv";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const contentId = decodeURIComponent(id);
  const parsed = parseContentId(contentId);

  if (parsed.kind === "mock") {
    return NextResponse.json({ error: "Contenido no compatible" }, { status: 400 });
  }

  if (!isVimeusEmbedConfigured()) {
    return NextResponse.json({ configured: false, available: false });
  }

  const { searchParams } = new URL(request.url);
  const season = Math.max(1, Number(searchParams.get("season") ?? 1));
  const episode = Math.max(1, Number(searchParams.get("episode") ?? 1));
  const contentType = (searchParams.get("type") ?? parsed.kind) as "movie" | "series" | "anime";
  const embedKind = parseKind(searchParams.get("type"), parsed.kind);

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
    return NextResponse.json({
      configured: true,
      available: false,
      error: "No se pudo preparar la descarga",
    });
  }

  const query = new URLSearchParams({
    season: String(season),
    episode: String(episode),
    type: contentType,
  });

  return NextResponse.json({
    configured: true,
    available: true,
    filename: file.filename,
    fileUrl: `/api/content/${encodeURIComponent(contentId)}/download/file?${query}`,
  });
}
