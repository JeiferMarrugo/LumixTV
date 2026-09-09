import { getVimeusBaseUrl } from "@/lib/vimeus/config";
import { buildVimeusEmbedUrl, type VimeusEmbedKind } from "@/lib/vimeus/embed";
import { buildVimeusDownloadUrl } from "@/lib/vimeus/stream";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface VimeusEmbedData {
  title?: string;
  embeds?: {
    url?: string;
    quality?: string;
    server?: string;
    lang?: string;
  }[];
}

export interface ResolvedDownloadFile {
  url: string;
  filename: string;
  referer: string;
  sizeLabel?: string;
}

function fetchHeaders(referer: string) {
  return {
    Referer: referer,
    "User-Agent": USER_AGENT,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };
}

export function parseVimeusEmbedData(html: string): VimeusEmbedData | null {
  const match = html.match(/<script type="text\/json" id="data">\s*([\s\S]*?)\s*<\/script>/);
  if (!match?.[1]) return null;

  try {
    return JSON.parse(match[1]) as VimeusEmbedData;
  } catch {
    return null;
  }
}

export function extractFileCode(embedSourceUrl: string): string | null {
  const patterns = [
    /embed-([a-zA-Z0-9]+)\.html/i,
    /vimeos\.net\/d\/([a-zA-Z0-9]+)/i,
    /\/d\/([a-zA-Z0-9]+)_h/i,
  ];

  for (const pattern of patterns) {
    const match = embedSourceUrl.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function parseHiddenField(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`name="${name}"[^>]*value="([^"]*)"`, "i"),
    new RegExp(`value="([^"]*)"[^>]*name="${name}"`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function parseDownloadFilename(html: string): string | null {
  const match = html.match(/<div class="small">\s*([^<]+\.mp4)\s*<\/div>/i);
  return match?.[1]?.trim() ?? null;
}

function parseDirectFileUrl(html: string): string | null {
  const match = html.match(/https:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i);
  return match?.[0]?.replace(/&amp;/g, "&") ?? null;
}

async function resolveFromVimeosNet(fileCode: string, referer: string): Promise<ResolvedDownloadFile | null> {
  const downloadPageUrl = `https://vimeos.net/d/${fileCode}_h`;
  const pageRes = await fetch(downloadPageUrl, {
    headers: fetchHeaders(referer),
    signal: AbortSignal.timeout(25_000),
  });

  if (!pageRes.ok) return null;

  const pageHtml = await pageRes.text();
  const hash = parseHiddenField(pageHtml, "hash");
  const id = parseHiddenField(pageHtml, "id") ?? fileCode;
  const mode = parseHiddenField(pageHtml, "mode") ?? "h";
  const filename = parseDownloadFilename(pageHtml);

  if (!hash) return null;

  const postRes = await fetch(downloadPageUrl, {
    method: "POST",
    headers: {
      ...fetchHeaders(downloadPageUrl),
      Origin: "https://vimeos.net",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      op: "download_orig",
      id,
      mode,
      hash,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!postRes.ok) return null;

  const postHtml = await postRes.text();
  const fileUrl = parseDirectFileUrl(postHtml);
  if (!fileUrl) return null;

  return {
    url: fileUrl,
    filename: filename ?? `${fileCode}.mp4`,
    referer: "https://vimeos.net/",
  };
}

function applyDownloadTitle(
  resolved: ResolvedDownloadFile,
  title: string | undefined,
  fallbackTitle?: string,
) {
  const safeTitle = (title ?? fallbackTitle ?? "lumixtv")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);

  if (safeTitle && !resolved.filename.toLowerCase().includes(safeTitle.toLowerCase())) {
    resolved.filename = `${safeTitle}.mp4`;
  }

  return resolved;
}

async function resolveFromVimeusPage(
  pageUrl: string,
  title?: string,
): Promise<ResolvedDownloadFile | null> {
  const referer = `${getVimeusBaseUrl()}/`;
  const pageRes = await fetch(pageUrl, {
    headers: fetchHeaders(referer),
    signal: AbortSignal.timeout(25_000),
  });

  if (!pageRes.ok) return null;

  const pageHtml = await pageRes.text();
  const embedData = parseVimeusEmbedData(pageHtml);
  const sourceUrls = (embedData?.embeds ?? [])
    .map((embed) => embed.url?.trim())
    .filter((url): url is string => Boolean(url));

  if (sourceUrls.length === 0) {
    const inline = parseDirectFileUrl(pageHtml);
    if (inline) {
      return applyDownloadTitle(
        { url: inline, filename: `${title ?? "lumixtv"}.mp4`, referer },
        title,
        embedData?.title,
      );
    }
    return null;
  }

  for (const sourceUrl of sourceUrls) {
    const fileCode = extractFileCode(sourceUrl);
    if (!fileCode) continue;

    const resolved = await resolveFromVimeosNet(fileCode, sourceUrl);
    if (resolved) {
      return applyDownloadTitle(resolved, title, embedData?.title);
    }
  }

  return null;
}

export async function resolveVimeusDownloadFile(options: {
  embedKind: VimeusEmbedKind;
  tmdbId: number;
  season?: number;
  episode?: number;
  title?: string;
  downloadPageUrl?: string | null;
}): Promise<ResolvedDownloadFile | null> {
  const params = {
    kind: options.embedKind,
    tmdbId: options.tmdbId,
    season: options.season,
    episode: options.episode,
  };

  const candidates = [
    options.downloadPageUrl,
    buildVimeusDownloadUrl(params),
    buildVimeusEmbedUrl(params),
  ].filter((url): url is string => Boolean(url));

  const uniqueCandidates = [...new Set(candidates)];

  for (const pageUrl of uniqueCandidates) {
    const resolved = await resolveFromVimeusPage(pageUrl, options.title);
    if (resolved) return resolved;
  }

  return null;
}

export function sanitizeDownloadFilename(filename: string) {
  return filename.replace(/[^\w\s.-]/g, "").trim() || "descarga.mp4";
}

export const DOWNLOAD_STREAM_HEADERS = {
  Referer: "https://vimeos.net/",
  "User-Agent": USER_AGENT,
};
