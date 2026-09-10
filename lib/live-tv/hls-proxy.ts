/**
 * Proxy de streams HLS.
 *
 * Muchos canales públicos exigen una cabecera `Referer`/`User-Agent`
 * concreta o bloquean CORS entre orígenes. Para poder reproducirlos
 * desde nuestro propio reproductor (hls.js) reenviamos cada petición
 * (playlist y segmentos) a través de `/api/live-tv/hls`, reescribiendo
 * las URIs de la playlist para que también pasen por el proxy.
 */

export interface ProxyTarget {
  url: string;
  referrer?: string | null;
  userAgent?: string | null;
}

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export function encodeProxyTarget(target: ProxyTarget): string {
  const json = JSON.stringify(target);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeProxyTarget(token: string): ProxyTarget | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as ProxyTarget;
    if (!parsed.url || !/^https?:\/\//i.test(parsed.url)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildProxyUrl(origin: string, target: ProxyTarget): string {
  const token = encodeProxyTarget(target);
  return `${origin}/api/live-tv/hls?s=${encodeURIComponent(token)}`;
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
  });
}

export function looksLikePlaylist(contentType: string | null, url: string) {
  if (contentType && /mpegurl|m3u8/i.test(contentType)) return true;
  return /\.m3u8($|\?)/i.test(url);
}

/**
 * Reescribe las URIs de una playlist HLS (maestra o de medios) para que
 * cada segmento, clave o sub-playlist se solicite a través del proxy.
 */
export function rewritePlaylist(
  body: string,
  target: ProxyTarget,
  origin: string,
): string {
  const baseUrl = target.url;

  function resolve(rawUri: string): string {
    const trimmed = rawUri.trim();
    if (!trimmed) return trimmed;
    try {
      const absolute = new URL(trimmed, baseUrl).toString();
      return buildProxyUrl(origin, {
        url: absolute,
        referrer: target.referrer,
        userAgent: target.userAgent,
      });
    } catch {
      return trimmed;
    }
  }

  const lines = body.split(/\r?\n/);

  const rewritten = lines.map((line) => {
    if (!line.trim()) return line;

    if (line.startsWith("#")) {
      // Reescribe atributos URI="..." dentro de tags como #EXT-X-KEY o #EXT-X-MAP
      if (/URI="/.test(line)) {
        return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
          return `URI="${resolve(uri)}"`;
        });
      }
      return line;
    }

    // Línea sin "#": es la URI de un segmento o de una sub-playlist.
    return resolve(line);
  });

  return rewritten.join("\n");
}
