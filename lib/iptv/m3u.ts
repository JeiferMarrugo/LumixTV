export interface M3uEntry {
  channelId?: string;
  name: string;
  url: string;
  group?: string;
}

function parseExtinf(line: string): Omit<M3uEntry, "url"> {
  const tvgId = line.match(/tvg-id="([^"]*)"/i)?.[1]?.trim();
  const group = line.match(/group-title="([^"]*)"/i)?.[1]?.trim();
  const name = line.split(",").pop()?.trim() || "Canal";

  return {
    channelId: tvgId || undefined,
    name,
    group,
  };
}

export function parseM3u(content: string): M3uEntry[] {
  const lines = content.split(/\r?\n/);
  const entries: M3uEntry[] = [];
  let pending: Omit<M3uEntry, "url"> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("#EXTINF:")) {
      pending = parseExtinf(trimmed);
      continue;
    }

    if (trimmed.startsWith("#")) continue;

    if (pending && /^https?:\/\//i.test(trimmed)) {
      entries.push({ ...pending, url: trimmed });
      pending = null;
    }
  }

  return entries;
}

export async function fetchM3uEntries(url: string): Promise<M3uEntry[]> {
  const res = await fetch(url, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(60_000),
    headers: { Accept: "application/vnd.apple.mpegurl,text/plain,*/*" },
  });

  if (!res.ok) {
    throw new Error(`M3U fetch failed: ${url}`);
  }

  const text = await res.text();
  return parseM3u(text);
}
