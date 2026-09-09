import { NextResponse } from "next/server";
import { LIVE_STREAM_CANDIDATE_LIMIT } from "@/lib/iptv/constants";
import { getLiveStreamOptions } from "@/lib/iptv/service";
import { requireAuthSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId")?.trim();

  if (!channelId) {
    return NextResponse.json({ error: "channelId requerido" }, { status: 400 });
  }

  try {
    const options = await getLiveStreamOptions(channelId, LIVE_STREAM_CANDIDATE_LIMIT);
    return NextResponse.json(options);
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar las fuentes" }, { status: 502 });
  }
}
