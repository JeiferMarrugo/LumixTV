import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/session";
import {
  decodeProxyTarget,
  fetchUpstream,
  looksLikePlaylist,
  rewritePlaylist,
} from "@/lib/live-tv/hls-proxy";

const PASSTHROUGH_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
];

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("s");
  if (!token) {
    return NextResponse.json({ error: "Falta el parámetro de stream" }, { status: 400 });
  }

  const target = decodeProxyTarget(token);
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
    return NextResponse.json(
      { error: "El canal no respondió correctamente" },
      { status: upstream.status || 502 },
    );
  }

  const contentType = upstream.headers.get("content-type");

  if (looksLikePlaylist(contentType, target.url)) {
    const body = await upstream.text();
    const rewritten = rewritePlaylist(body, target, url.origin);

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "content-type": "application/vnd.apple.mpegurl",
        "cache-control": "no-store",
      },
    });
  }

  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("cache-control", "no-store");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
