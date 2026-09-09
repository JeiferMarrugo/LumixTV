import {
  getVimeusBaseUrl,
  getVimeusViewKey,
  isVimeusEmbedConfigured,
} from "@/lib/vimeus/config";
import type { VimeusEmbedKind, VimeusEmbedParams } from "@/lib/vimeus/embed";

function downloadPath(kind: VimeusEmbedKind) {
  if (kind === "movie") return "movie";
  if (kind === "anime") return "anime";
  return "series";
}

export function buildVimeusDownloadUrl(params: VimeusEmbedParams): string | null {
  if (!isVimeusEmbedConfigured()) return null;

  const base = getVimeusBaseUrl();
  const viewKey = getVimeusViewKey();
  const url = new URL(`${base}/d/${downloadPath(params.kind)}`);

  url.searchParams.set("tmdb", String(params.tmdbId));
  url.searchParams.set("view_key", viewKey);

  if (params.kind === "tv" || params.kind === "anime") {
    if (params.season) url.searchParams.set("se", String(params.season));
    if (params.episode) url.searchParams.set("ep", String(params.episode));
  }

  return url.toString();
}

export interface ResolvedStream {
  url: string;
  type: "hls" | "mp4";
  referer: string;
}

const STREAM_HEADERS = {
  Referer: `${getVimeusBaseUrl()}/`,
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
};

function detectStreamType(url: string, contentType: string): "hls" | "mp4" | null {
  const lower = `${url} ${contentType}`.toLowerCase();
  if (lower.includes(".m3u8") || lower.includes("mpegurl")) return "hls";
  if (lower.includes("video/") || lower.includes(".mp4") || lower.includes(".webm")) return "mp4";
  return null;
}

function extractStreamFromHtml(html: string): string | null {
  const patterns = [
    /"(https?:[^"]+\.m3u8[^"]*)"/i,
    /'(https?:[^']+\.m3u8[^']*)'/i,
    /(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i,
    /"(https?:[^"]+\.mp4[^"]*)"/i,
    /file:\s*["'](https?:[^"']+)["']/i,
    /source:\s*["'](https?:[^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].replace(/\\u002F/g, "/").replace(/\\\//g, "/");
  }

  return null;
}

export async function resolveVimeusStreamUrl(downloadUrl: string): Promise<ResolvedStream | null> {
  const referer = STREAM_HEADERS.Referer;

  try {
    const res = await fetch(downloadUrl, {
      redirect: "follow",
      headers: STREAM_HEADERS,
      signal: AbortSignal.timeout(20_000),
    });

    const contentType = res.headers.get("content-type") ?? "";
    const finalUrl = res.url;
    const directType = detectStreamType(finalUrl, contentType);

    if (directType) {
      return { url: finalUrl, type: directType, referer };
    }

    const body = await res.text();

    if (body.trimStart().startsWith("#EXTM3U")) {
      return { url: finalUrl, type: "hls", referer };
    }

    const extracted = extractStreamFromHtml(body);
    if (extracted) {
      const type = detectStreamType(extracted, "") ?? "hls";
      return { url: extracted, type, referer };
    }
  } catch {
    return null;
  }

  return null;
}

export function embedKindFromContentType(
  contentType: "movie" | "series" | "anime",
): VimeusEmbedKind {
  if (contentType === "movie") return "movie";
  if (contentType === "anime") return "anime";
  return "tv";
}
