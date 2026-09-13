import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/session";
import { buildProxyUrl, getRequestOrigin, streamNeedsProxy } from "@/lib/live-tv/hls-proxy";
import { getLiveChannelById } from "@/lib/live-tv/service";

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

  const origin = getRequestOrigin(request);
  const clientIsHttps =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https" ||
    new URL(request.url).protocol === "https:";

  return NextResponse.json({
    channel: {
      id: channel.id,
      name: channel.name,
      logo: channel.logo,
      countryCode: channel.countryCode,
      categories: channel.categories,
    },
    sources: channel.streams.map((stream) => {
      const target = {
        url: stream.url,
        referrer: stream.referrer,
        userAgent: stream.userAgent,
      };
      const needsProxy = streamNeedsProxy(target, clientIsHttps);

      return {
        url: stream.url,
        proxyUrl: buildProxyUrl(origin, target),
        needsProxy,
        quality: stream.quality,
        online: stream.online ?? false,
      };
    }),
  });
}
