import { NextResponse } from "next/server";
import { getLiveStream } from "@/lib/iptv/service";
import { requireAuthSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const channelId = new URL(request.url).searchParams.get("channelId");
  if (!channelId) {
    return NextResponse.json({ error: "channelId requerido" }, { status: 400 });
  }

  try {
    const stream = await getLiveStream(channelId);
    if (!stream) {
      return NextResponse.json({ error: "Canal no disponible" }, { status: 404 });
    }

    return NextResponse.json({ stream });
  } catch {
    return NextResponse.json({ error: "Error al obtener el stream" }, { status: 502 });
  }
}
