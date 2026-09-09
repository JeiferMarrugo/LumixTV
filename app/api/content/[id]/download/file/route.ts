import { NextResponse } from "next/server";
import { parseContentId } from "@/lib/content-id";
import { requireAuthSession } from "@/lib/session";
import { fetchContentDetail } from "@/lib/tmdb/service";
import type { VimeusEmbedKind } from "@/lib/vimeus/embed";
import { isVimeusEmbedConfigured } from "@/lib/vimeus/config";
import { resolvePlaybackSources } from "@/lib/vimeus/playback";
import {
  DOWNLOAD_STREAM_HEADERS,
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
    return NextResponse.json({ error: "Descarga no configurada" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const season = Math.max(1, Number(searchParams.get("season") ?? 1));
  const episode = Math.max(1, Number(searchParams.get("episode") ?? 1));
  const embedKind = parseKind(searchParams.get("type"), parsed.kind);

  const detail = await fetchContentDetail(contentId).catch(() => null);
  const contentType = (searchParams.get("type") ?? parsed.kind) as "movie" | "series" | "anime";

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
    return NextResponse.json({ error: "No se pudo preparar la descarga" }, { status: 502 });
  }

  const range = request.headers.get("range");
  const upstreamHeaders: Record<string, string> = {
    ...DOWNLOAD_STREAM_HEADERS,
    Referer: file.referer,
  };

  if (range) upstreamHeaders.Range = range;

  const upstream = await fetch(file.url, {
    headers: upstreamHeaders,
    signal: AbortSignal.timeout(120_000),
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: "No se pudo descargar el archivo" }, { status: 502 });
  }

  const filename = sanitizeDownloadFilename(file.filename);
  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "video/mp4");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  headers.set("Cache-Control", "private, no-store");

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  const contentRange = upstream.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);

  const acceptRanges = upstream.headers.get("accept-ranges");
  if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
