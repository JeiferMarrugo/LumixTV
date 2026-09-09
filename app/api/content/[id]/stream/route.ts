import { NextResponse } from "next/server";
import { parseContentId } from "@/lib/content-id";
import { requireAuthSession } from "@/lib/session";
import type { VimeusEmbedKind } from "@/lib/vimeus/embed";
import { isVimeusEmbedConfigured } from "@/lib/vimeus/config";
import { fetchVimeusPlaybackSources } from "@/lib/vimeus/embed-sources";
import { resolvePlaybackSources } from "@/lib/vimeus/playback";

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
    return NextResponse.json({
      configured: false,
      stream: null,
      embedUrl: null,
      downloadUrl: null,
    });
  }

  const { searchParams } = new URL(request.url);
  const season = Math.max(1, Number(searchParams.get("season") ?? 1));
  const episode = Math.max(1, Number(searchParams.get("episode") ?? 1));
  const contentType = (searchParams.get("type") ?? parsed.kind) as "movie" | "series" | "anime";
  const embedKind = parseKind(searchParams.get("type"), parsed.kind);

  const playback = await resolvePlaybackSources({
    tmdbId: parsed.tmdbId,
    embedKind,
    contentType,
    season,
    episode,
  });

  const embedSources = await fetchVimeusPlaybackSources({
    kind: embedKind,
    tmdbId: parsed.tmdbId,
    season: embedKind !== "movie" ? season : undefined,
    episode: embedKind !== "movie" ? episode : undefined,
  });

  if (!playback.embedUrl && !playback.downloadUrl) {
    return NextResponse.json({
      configured: true,
      embedUrl: null,
      downloadUrl: null,
      sources: [],
    });
  }

  return NextResponse.json({
    configured: true,
    embedUrl: embedSources.playerUrl ?? playback.embedUrl,
    downloadUrl: playback.downloadUrl,
  });
}
