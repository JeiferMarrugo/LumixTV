import type { LiveStreamPlayback } from "@/lib/iptv/types";

export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

type ProxyRouteOptions = {
  endpoint?: string;
  idParam?: string;
};

function buildProxyUrl(
  origin: string,
  id: string,
  sourceIndex: number,
  target: string,
  route: ProxyRouteOptions = {},
) {
  const endpoint = route.endpoint ?? "/api/live-tv/hls";
  const idParam = route.idParam ?? "channelId";
  const params = new URLSearchParams({
    [idParam]: id,
    source: String(sourceIndex),
    target,
  });
  return `${origin}${endpoint}?${params.toString()}`;
}

function resolveAbsoluteUrl(relativeOrAbsolute: string, baseUrl: string) {
  try {
    return new URL(relativeOrAbsolute, baseUrl).toString();
  } catch {
    return relativeOrAbsolute;
  }
}

function originFromUrl(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function rewriteUriAttribute(
  line: string,
  baseUrl: string,
  origin: string,
  id: string,
  sourceIndex: number,
  route: ProxyRouteOptions,
) {
  return line.replace(/URI="([^"]+)"/gi, (_, uri: string) => {
    const absolute = resolveAbsoluteUrl(uri, baseUrl);
    return `URI="${buildProxyUrl(origin, id, sourceIndex, absolute, route)}"`;
  });
}

export function rewriteM3u8Playlist(options: {
  body: string;
  baseUrl: string;
  origin: string;
  channelId: string;
  sourceIndex: number;
  proxyEndpoint?: string;
  proxyIdParam?: string;
}) {
  const { body, baseUrl, origin, channelId, sourceIndex, proxyEndpoint, proxyIdParam } = options;
  const route: ProxyRouteOptions = {
    endpoint: proxyEndpoint,
    idParam: proxyIdParam,
  };
  const lines = body.split(/\r?\n/);
  const output: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      output.push(line);
      continue;
    }

    if (trimmed.startsWith("#")) {
      output.push(rewriteUriAttribute(line, baseUrl, origin, channelId, sourceIndex, route));
      continue;
    }

    const absolute = resolveAbsoluteUrl(trimmed, baseUrl);
    output.push(buildProxyUrl(origin, channelId, sourceIndex, absolute, route));
  }

  return output.join("\n");
}

export function enrichPlaybackForUrl(playback: LiveStreamPlayback, fetchUrl: string): LiveStreamPlayback {
  const url = fetchUrl.toLowerCase();
  const enriched = { ...playback };

  if (!enriched.userAgent) {
    enriched.userAgent = DEFAULT_USER_AGENT;
  }

  if (!enriched.referrer) {
    if (url.includes("jmp2.uk") || url.includes("pluto.tv")) {
      enriched.referrer = "https://pluto.tv/";
    } else if (url.includes("cloudfront.net") || url.includes("amagi.tv")) {
      enriched.referrer = fetchUrl;
    }
  }

  return enriched;
}

export function buildStreamFetchHeaders(playback: LiveStreamPlayback): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "*/*",
    "User-Agent": playback.userAgent || DEFAULT_USER_AGENT,
  };

  const referer = playback.referrer ?? originFromUrl(playback.url);
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      headers.Referer = referer.endsWith("/") ? referer : `${referer}/`;
      headers.Origin = refererUrl.origin;
    } catch {
      headers.Referer = referer.endsWith("/") ? referer : `${referer}/`;
      headers.Origin = referer.replace(/\/+$/, "");
    }
  }

  return headers;
}

function headerVariants(playback: LiveStreamPlayback, fetchUrl: string): HeadersInit[] {
  const primary = buildStreamFetchHeaders(playback);
  const streamOrigin = originFromUrl(fetchUrl);
  const variants: HeadersInit[] = [primary];

  if (streamOrigin) {
    variants.push({
      Accept: "*/*",
      "User-Agent": playback.userAgent || DEFAULT_USER_AGENT,
      Referer: `${streamOrigin}/`,
      Origin: streamOrigin,
    });
  }

  variants.push({
    Accept: "*/*",
    "User-Agent": DEFAULT_USER_AGENT,
  });

  return variants;
}

function extractFirstVariantUrl(body: string, baseUrl: string) {
  const lines = body.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index]?.includes("#EXT-X-STREAM-INF")) continue;
    const next = lines[index + 1]?.trim();
    if (next && !next.startsWith("#")) {
      try {
        return new URL(next, baseUrl).toString();
      } catch {
        return next;
      }
    }
  }
  return null;
}

export async function fetchStreamUpstream(
  playback: LiveStreamPlayback,
  fetchUrl: string,
  timeoutMs = 20_000,
) {
  const enriched = enrichPlaybackForUrl(playback, fetchUrl);

  for (const headers of headerVariants(enriched, fetchUrl)) {
    try {
      const response = await fetch(fetchUrl, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) {
        return response;
      }
    } catch {
      continue;
    }
  }

  return null;
}

/** Comprueba si la URL responde y el manifiesto HLS parece válido. */
export async function probeStreamUpstream(playback: LiveStreamPlayback, fetchUrl: string) {
  const enriched = enrichPlaybackForUrl(playback, fetchUrl);

  for (const headers of headerVariants(enriched, fetchUrl)) {
    try {
      const response = await fetch(fetchUrl, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) continue;

      const contentType = response.headers.get("content-type");
      const body = await response.text();

      if (!looksLikeM3u8(fetchUrl, contentType, body)) {
        return response;
      }

      if (/#EXT-X-STREAM-INF/i.test(body)) {
        const variantUrl = extractFirstVariantUrl(body, fetchUrl);
        if (variantUrl && variantUrl !== fetchUrl) {
          return probeStreamUpstream(enriched, variantUrl);
        }
      }

      if (/#EXTINF:|#EXT-X-TARGETDURATION/i.test(body)) {
        return response;
      }

      continue;
    } catch {
      continue;
    }
  }

  return null;
}

export function looksLikeM3u8(url: string, contentType: string | null, sample?: string) {
  if (url.toLowerCase().includes(".m3u8")) return true;
  if (contentType?.toLowerCase().includes("mpegurl")) return true;
  if (sample?.trimStart().startsWith("#EXTM3U")) return true;
  return false;
}
