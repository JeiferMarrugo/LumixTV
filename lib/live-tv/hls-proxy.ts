/**
 * Proxy de streams HLS.
 *
 * Muchos canales exigen Referer/User-Agent o son HTTP en páginas HTTPS.
 * Reenviamos playlist y segmentos por `/api/live-tv/hls` con tokens
 * **stateless** (sin memoria en servidor) para que funcione en dev y prod.
 */

export interface ProxyTarget {
  url: string;
  referrer?: string | null;
  userAgent?: string | null;
}

interface CompactProxyPayload {
  u: string;
  r?: string;
  a?: string;
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const UPSTREAM_TIMEOUT_MS = 12_000;
const INVALID_BIND_HOSTS = new Set(["0.0.0.0", "::", "[::]"]);

export function encodeProxyTarget(target: ProxyTarget): string {
  const payload: CompactProxyPayload = { u: target.url };
  if (target.referrer) payload.r = target.referrer;
  if (target.userAgent) payload.a = target.userAgent;
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeProxyTarget(token: string): ProxyTarget | null {
  const candidates = [token];
  try {
    candidates.push(decodeURIComponent(token));
  } catch {
    /* ignore */
  }

  for (const raw of candidates) {
    try {
      const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as
        | CompactProxyPayload
        | ProxyTarget;

      if ("u" in parsed && parsed.u && /^https?:\/\//i.test(parsed.u)) {
        return {
          url: parsed.u,
          referrer: parsed.r ?? null,
          userAgent: parsed.a ?? null,
        };
      }

      if ("url" in parsed && parsed.url && /^https?:\/\//i.test(parsed.url)) {
        return {
          url: parsed.url,
          referrer: parsed.referrer ?? null,
          userAgent: parsed.userAgent ?? null,
        };
      }
    } catch {
      /* try next */
    }
  }

  return null;
}

export function resolveProxyRequest(id: string | null, token: string | null): ProxyTarget | null {
  if (token) return decodeProxyTarget(token);
  if (id) return decodeProxyTarget(id);
  return null;
}

export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);

  if (!INVALID_BIND_HOSTS.has(url.hostname)) {
    return url.origin;
  }

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host")?.trim();

  if (host && !host.startsWith("0.0.0.0")) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
      url.protocol.replace(":", "");
    return `${proto}://${host}`;
  }

  const port = url.port || "3000";
  return `http://localhost:${port}`;
}

export function buildProxyUrl(origin: string, target: ProxyTarget): string {
  const token = encodeProxyTarget(target);
  return `${origin}/api/live-tv/hls?s=${encodeURIComponent(token)}`;
}

/** ¿Requiere proxy? Cabeceras custom o HTTP en contexto HTTPS. */
export function streamNeedsProxy(
  stream: { url: string; referrer?: string | null; userAgent?: string | null },
  clientIsHttps: boolean,
) {
  if (stream.referrer || stream.userAgent) return true;
  if (clientIsHttps && stream.url.startsWith("http:")) return true;
  return false;
}

export async function fetchUpstream(target: ProxyTarget, range?: string | null) {
  return fetch(target.url, {
    headers: {
      "user-agent": target.userAgent || DEFAULT_USER_AGENT,
      ...(target.referrer ? { referer: target.referrer } : {}),
      accept: "*/*",
      ...(range ? { range } : {}),
    },
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
}

export function looksLikePlaylist(contentType: string | null, url: string) {
  if (contentType && /mpegurl|m3u8|dash\+xml/i.test(contentType)) return true;
  return /\.m3u8($|\?)/i.test(url);
}

function guessSegmentContentType(url: string) {
  if (/\.ts($|\?)/i.test(url)) return "video/mp2t";
  if (/\.m4s($|\?)/i.test(url)) return "video/iso.segment";
  if (/\.mp4($|\?)/i.test(url)) return "video/mp4";
  if (/\.aac($|\?)/i.test(url)) return "audio/aac";
  return "application/octet-stream";
}

export function rewritePlaylist(
  body: string,
  target: ProxyTarget,
  origin: string,
  baseUrl?: string,
): string {
  const resolveBase = baseUrl ?? target.url;

  function resolve(rawUri: string): string {
    const trimmed = rawUri.trim();
    if (!trimmed) return trimmed;
    try {
      const absolute = new URL(trimmed, resolveBase).toString();
      return buildProxyUrl(origin, {
        url: absolute,
        referrer: target.referrer,
        userAgent: target.userAgent,
      });
    } catch {
      return trimmed;
    }
  }

  return body
    .split(/\r?\n/)
    .map((line) => {
      if (!line.trim()) return line;
      if (line.startsWith("#")) {
        if (/URI="/.test(line)) {
          return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => `URI="${resolve(uri)}"`);
        }
        return line;
      }
      return resolve(line);
    })
    .join("\n");
}

export function buildBinaryResponse(upstream: Response, targetUrl: string) {
  return upstream.arrayBuffer().then((body) => {
    const headers = new Headers();
    headers.set("content-type", upstream.headers.get("content-type") ?? guessSegmentContentType(targetUrl));
    headers.set("content-length", String(body.byteLength));
    headers.set("cache-control", "no-store");

    if (upstream.status === 206) {
      const contentRange = upstream.headers.get("content-range");
      if (contentRange) headers.set("content-range", contentRange);
      headers.set("accept-ranges", "bytes");
    } else if (upstream.headers.get("accept-ranges")) {
      headers.set("accept-ranges", upstream.headers.get("accept-ranges")!);
    }

    return new Response(body, { status: upstream.status, headers });
  });
}
