export async function syncWatchStart(input: {
  contentId: string;
  title: string;
  image?: string;
  genre?: string;
  contentType?: "movie" | "series" | "anime";
  progress?: number;
  season?: number;
  episode?: number;
}) {
  try {
    await fetch("/api/watch-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // Best-effort sync; local state still works offline.
  }
}

export async function syncWatchProgress(input: {
  contentId: string;
  progress: number;
  season?: number;
  episode?: number;
}) {
  try {
    await fetch("/api/watch-history", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // Best-effort sync.
  }
}

export async function syncRemoveFromContinueWatching(contentId: string) {
  try {
    await fetch(
      `/api/watch-history?contentId=${encodeURIComponent(contentId)}`,
      { method: "DELETE" },
    );
  } catch {
    // Best-effort sync.
  }
}

export async function fetchServerContinueWatching() {
  const res = await fetch("/api/watch-history");
  if (!res.ok) return [];

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      title: string;
      progress: number;
      watchedAt: string;
      episode?: string;
      image?: string;
    }>;
  };

  return data.items ?? [];
}
