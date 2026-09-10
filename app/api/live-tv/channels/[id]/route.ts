import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/session";
import { buildProxyUrl } from "@/lib/live-tv/hls-proxy";
import { getLiveChannelById, getRelatedLiveChannels } from "@/lib/live-tv/service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const channelId = decodeURIComponent(id);

  const channel = await getLiveChannelById(channelId);
  if (!channel) {
    return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const related = await getRelatedLiveChannels(channel);

  return NextResponse.json({
    channel: {
      id: channel.id,
      name: channel.name,
      logo: channel.logo,
      countryCode: channel.countryCode,
      categories: channel.categories,
    },
    // Candidatos de reproducción, en orden de preferencia. El reproductor
    // intenta el primero y hace failover al siguiente si falla.
    sources: channel.streams.map((stream) => ({
      proxyUrl: buildProxyUrl(origin, {
        url: stream.url,
        referrer: stream.referrer,
        userAgent: stream.userAgent,
      }),
      quality: stream.quality,
    })),
    related: related.map((item) => ({
      id: item.id,
      name: item.name,
      logo: item.logo,
      countryCode: item.countryCode,
    })),
  });
}
