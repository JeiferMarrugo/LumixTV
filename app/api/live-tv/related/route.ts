import { NextResponse } from "next/server";
import { listRelatedChannels } from "@/lib/iptv/service";
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
    const { family, channels } = await listRelatedChannels(channelId);
    return NextResponse.json({ family, channels });
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar canales relacionados" }, { status: 502 });
  }
}
