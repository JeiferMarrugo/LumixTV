import { NextResponse } from "next/server";
import { LIVE_STREAM_CANDIDATE_LIMIT } from "@/lib/iptv/constants";
import { getLiveStreamCandidates } from "@/lib/iptv/service";
import { requireAuthSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams, origin } = new URL(request.url);
  const channelId = searchParams.get("channelId")?.trim();
  const afterSource = Math.max(-1, Number(searchParams.get("after") ?? -1));

  if (!channelId) {
    return NextResponse.json({ error: "channelId requerido" }, { status: 400 });
  }

  try {
    const candidates = await getLiveStreamCandidates(channelId, LIVE_STREAM_CANDIDATE_LIMIT);
    const sourceIndex = afterSource + 1;

    if (!candidates.length || sourceIndex >= candidates.length) {
      return NextResponse.json(
        {
          alternativeCount: candidates.length,
          sourceIndex,
          exhausted: true,
        },
        { status: 502 },
      );
    }

    const playback = candidates[sourceIndex];
    const playUrl = `${origin}/api/live-tv/hls?channelId=${encodeURIComponent(channelId)}&source=${sourceIndex}`;

    return NextResponse.json({
      stream: {
        ...playback,
        url: playUrl,
      },
      sourceIndex,
      alternativeCount: candidates.length,
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener el stream" }, { status: 502 });
  }
}
