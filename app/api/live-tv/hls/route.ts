import { NextResponse } from "next/server";
import {
  fetchStreamUpstream,
  looksLikeM3u8,
  rewriteM3u8Playlist,
} from "@/lib/iptv/hls-proxy";
import { getLiveStreamAt } from "@/lib/iptv/service";
import { requireAuthSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams, origin } = new URL(request.url);
  const channelId = searchParams.get("channelId")?.trim();
  const target = searchParams.get("target")?.trim();
  const sourceIndex = Math.max(0, Number(searchParams.get("source") ?? 0));

  if (!channelId) {
    return NextResponse.json({ error: "channelId requerido" }, { status: 400 });
  }

  const playback = await getLiveStreamAt(channelId, sourceIndex);
  if (!playback) {
    return NextResponse.json({ error: "Canal no disponible" }, { status: 404 });
  }

  const fetchUrl = target || playback.url;

  try {
    const upstream = await fetchStreamUpstream(playback, fetchUrl);

    if (!upstream) {
      return NextResponse.json({ error: "Stream bloqueado o no disponible" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type");

    if (looksLikeM3u8(fetchUrl, contentType)) {
      const body = await upstream.text();

      if (looksLikeM3u8(fetchUrl, contentType, body)) {
        const rewritten = rewriteM3u8Playlist({
          body,
          baseUrl: fetchUrl,
          origin,
          channelId,
          sourceIndex,
        });

        return new Response(rewritten, {
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Cache-Control": "no-cache, no-store",
          },
        });
      }
    }

    const headers = new Headers();
    const lowerUrl = fetchUrl.toLowerCase();
    if (contentType) {
      headers.set("Content-Type", contentType);
    } else if (lowerUrl.includes(".ts") || lowerUrl.includes(".mp2t")) {
      headers.set("Content-Type", "video/mp2t");
    } else if (lowerUrl.includes(".mp4")) {
      headers.set("Content-Type", "video/mp4");
    }
    headers.set("Cache-Control", "no-cache, no-store");
    headers.set("Accept-Ranges", "bytes");

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json({ error: "Error al reproducir el canal" }, { status: 502 });
  }
}
