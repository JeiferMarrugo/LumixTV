import { NextResponse } from "next/server";
import { parseContentId } from "@/lib/content-id";
import { requireAuthSession } from "@/lib/session";
import { fetchTvSeason } from "@/lib/tmdb/service";
import { isVimeusApiConfigured } from "@/lib/vimeus/config";
import { mapVimeusEpisode } from "@/lib/vimeus/mappers";
import { listAllVimeusEpisodesForSeason } from "@/lib/vimeus/service";

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

  if (parsed.kind !== "tv") {
    return NextResponse.json({ error: "Solo aplica a series" }, { status: 400 });
  }

  const season = Math.max(1, Number(new URL(request.url).searchParams.get("season") ?? 1));

  if (isVimeusApiConfigured()) {
    try {
      const data = await listAllVimeusEpisodesForSeason({
        tmdbId: parsed.tmdbId,
        season,
      });

      const episodes = data.items
        .filter((ep) => Number(ep.season) === season)
        .map(mapVimeusEpisode)
        .sort((a, b) => a.number - b.number);

      if (episodes.length > 0) {
        try {
          const tmdbSeason = await fetchTvSeason(parsed.tmdbId, season);
          const nameByNumber = new Map(
            tmdbSeason.episodes.map((ep) => [ep.number, ep.name]),
          );

          return NextResponse.json({
            seasonNumber: season,
            episodes: episodes.map((ep) => ({
              ...ep,
              name: nameByNumber.get(ep.number) ?? ep.name,
            })),
            source: "vimeus",
          });
        } catch {
          return NextResponse.json({ seasonNumber: season, episodes, source: "vimeus" });
        }
      }
    } catch {
      // fallback to TMDB
    }
  }

  try {
    const data = await fetchTvSeason(parsed.tmdbId, season);
    return NextResponse.json({ ...data, source: "tmdb" });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar la temporada" }, { status: 502 });
  }
}
