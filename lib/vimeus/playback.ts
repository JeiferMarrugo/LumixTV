import { buildVimeusEmbedUrl, type VimeusEmbedKind } from "@/lib/vimeus/embed";
import { isVimeusApiConfigured } from "@/lib/vimeus/config";
import { listAllVimeusEpisodesForSeason, listVimeusMovies } from "@/lib/vimeus/service";
import {
  buildVimeusDownloadUrl,
  embedKindFromContentType,
  resolveVimeusStreamUrl,
  type ResolvedStream,
} from "@/lib/vimeus/stream";

export interface PlaybackSources {
  embedUrl: string | null;
  downloadUrl: string | null;
  stream: ResolvedStream | null;
}

export async function resolvePlaybackSources(options: {
  tmdbId: number;
  embedKind: VimeusEmbedKind;
  contentType: "movie" | "series" | "anime";
  season?: number;
  episode?: number;
}): Promise<PlaybackSources> {
  const { tmdbId, embedKind, contentType, season = 1, episode = 1 } = options;

  let downloadUrl: string | null = null;

  if (isVimeusApiConfigured()) {
    try {
      if (embedKind === "movie") {
        const data = await listVimeusMovies(1);
        const match = data.items.find((item) => item.tmdb_id === tmdbId);
        downloadUrl = match?.download_url ?? null;
      } else {
        const data = await listAllVimeusEpisodesForSeason({
          tmdbId,
          season,
        });
        const match = data.items.find(
          (item) => Number(item.season) === season && Number(item.episode) === episode,
        );
        downloadUrl = match?.download_url ?? null;
      }
    } catch {
      downloadUrl = null;
    }
  }

  if (!downloadUrl) {
    downloadUrl = buildVimeusDownloadUrl({
      kind: embedKindFromContentType(contentType),
      tmdbId,
      season: embedKind !== "movie" ? season : undefined,
      episode: embedKind !== "movie" ? episode : undefined,
    });
  }

  const embedUrl =
    buildVimeusEmbedUrl({
      kind: embedKind,
      tmdbId,
      season: embedKind !== "movie" ? season : undefined,
      episode: embedKind !== "movie" ? episode : undefined,
    }) ?? null;

  const stream = downloadUrl ? await resolveVimeusStreamUrl(downloadUrl) : null;

  return { embedUrl, downloadUrl, stream };
}
