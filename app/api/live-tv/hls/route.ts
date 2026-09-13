import { NextResponse } from "next/server";
import {
  buildBinaryResponse,
  fetchUpstream,
  getRequestOrigin,
  looksLikePlaylist,
  resolveProxyRequest,
  rewritePlaylist,
} from "@/lib/live-tv/hls-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = resolveProxyRequest(null, url.searchParams.get("s"));

  if (!target) {
    return NextResponse.json({ error: "Stream inválido" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetchUpstream(target, request.headers.get("range"));
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con el origen del canal" },
      { status: 502 },
    );
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new NextResponse(null, {
      status: upstream.status || 502,
      headers: { "cache-control": "no-store" },
    });
  }

  const contentType = upstream.headers.get("content-type");
  const playlistBase = upstream.url || target.url;

  if (looksLikePlaylist(contentType, playlistBase)) {
    const body = await upstream.text();
    const rewritten = rewritePlaylist(body, target, getRequestOrigin(request), playlistBase);

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "content-type": "application/vnd.apple.mpegurl",
        "cache-control": "no-store",
      },
    });
  }

  return buildBinaryResponse(upstream, target.url);
}
