import { NextResponse } from "next/server";
import { parseContentId } from "@/lib/content-id";
import { requireAuthSession } from "@/lib/session";
import { buildVimeusEmbedUrl, type VimeusEmbedKind } from "@/lib/vimeus/embed";
import { isVimeusEmbedConfigured, isVimeusApiConfigured } from "@/lib/vimeus/config";
import { listAllVimeusEpisodesForSeason, resolveVimeusEmbedUrl } from "@/lib/vimeus/service";

function parseEmbedKind(value: string | null, parsedKind: "movie" | "tv"): VimeusEmbedKind {
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
    return NextResponse.json({ configured: false, embedUrl: null });
  }

  const { searchParams } = new URL(request.url);
  const season = Math.max(1, Number(searchParams.get("season") ?? 1));
  const episode = Math.max(1, Number(searchParams.get("episode") ?? 1));
  const embedKind = parseEmbedKind(searchParams.get("type"), parsed.kind);

  let embedUrl: string | null = null;

  if (isVimeusApiConfigured() && embedKind !== "movie") {
    try {
      const data = await listAllVimeusEpisodesForSeason({
        tmdbId: parsed.tmdbId,
        season,
      });
      const match = data.items.find(
        (ep) => Number(ep.season) === season && Number(ep.episode) === episode,
      );
      if (match?.embed_url) {
        embedUrl = resolveVimeusEmbedUrl(match.embed_url);
      }
    } catch {
      // fallback to built URL
    }
  }

  if (!embedUrl) {
    embedUrl = buildVimeusEmbedUrl({
      kind: embedKind,
      tmdbId: parsed.tmdbId,
      season: embedKind !== "movie" ? season : undefined,
      episode: embedKind !== "movie" ? episode : undefined,
    });
  }

  if (!embedUrl) {
    return NextResponse.json({ configured: false, embedUrl: null });
  }

  return NextResponse.json({ configured: true, embedUrl });
}
