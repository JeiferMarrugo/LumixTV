import type { ContentItem } from "@/lib/data";
import { parseContentId } from "@/lib/content-id";
import { prisma } from "@/lib/prisma";
import { fetchMovieBrief, fetchTvBrief } from "@/lib/tmdb/service";

export interface WatchHistoryRecord {
  id: string;
  contentId: string;
  title: string;
  progress: number;
  watchedAt: string;
  episode?: string;
  image?: string;
}

function episodeLabel(season: number | null | undefined, episode: number | null | undefined) {
  if (!season && !episode) return undefined;
  if (season && episode) return `T${season} E${episode}`;
  if (episode) return `E${episode}`;
  return undefined;
}

function inferContentType(contentId: string, contentType?: string) {
  if (contentType === "anime") return "anime";
  if (contentType === "series") return "series";
  if (contentType === "movie") return "movie";
  const parsed = parseContentId(contentId);
  return parsed.kind === "movie" ? "movie" : "series";
}

async function resolveGenre(contentId: string, contentType: string, genre?: string) {
  if (genre?.trim()) return genre.trim();

  const parsed = parseContentId(contentId);
  if (parsed.kind === "mock") return null;

  try {
    const meta =
      parsed.kind === "movie"
        ? await fetchMovieBrief(parsed.tmdbId)
        : await fetchTvBrief(parsed.tmdbId);
    return meta.genre;
  } catch {
    return contentType === "anime" ? "Anime" : null;
  }
}

export async function recordWatchStart(input: {
  userId: string;
  contentId: string;
  title: string;
  image?: string;
  genre?: string;
  contentType?: string;
  progress?: number;
  season?: number;
  episode?: number;
}) {
  const contentType = inferContentType(input.contentId, input.contentType);
  const genre = await resolveGenre(input.contentId, contentType, input.genre);
  const progress = Math.min(100, Math.max(0, input.progress ?? 5));

  const [history] = await Promise.all([
    prisma.watchHistory.upsert({
      where: {
        userId_contentId: {
          userId: input.userId,
          contentId: input.contentId,
        },
      },
      create: {
        userId: input.userId,
        contentId: input.contentId,
        contentType,
        title: input.title,
        image: input.image,
        genre,
        progress,
        season: input.season,
        episode: input.episode,
      },
      update: {
        title: input.title,
        image: input.image ?? undefined,
        genre: genre ?? undefined,
        progress,
        season: input.season,
        episode: input.episode,
        watchedAt: new Date(),
      },
    }),
    prisma.contentPlayStat.upsert({
      where: { contentId: input.contentId },
      create: {
        contentId: input.contentId,
        contentType,
        title: input.title,
        image: input.image,
        genre,
        playCount: 1,
      },
      update: {
        title: input.title,
        image: input.image ?? undefined,
        genre: genre ?? undefined,
        playCount: { increment: 1 },
      },
    }),
  ]);

  return history;
}

export async function updateWatchProgress(input: {
  userId: string;
  contentId: string;
  progress: number;
  season?: number;
  episode?: number;
}) {
  const progress = Math.min(100, Math.max(0, input.progress));

  return prisma.watchHistory.updateMany({
    where: {
      userId: input.userId,
      contentId: input.contentId,
    },
    data: {
      progress,
      season: input.season,
      episode: input.episode,
      watchedAt: new Date(),
    },
  });
}

export async function removeFromWatchHistory(userId: string, contentId: string) {
  return prisma.watchHistory.deleteMany({
    where: {
      userId,
      contentId,
    },
  });
}

export async function listContinueWatching(userId: string, limit = 20): Promise<WatchHistoryRecord[]> {
  const rows = await prisma.watchHistory.findMany({
    where: {
      userId,
      progress: { lt: 95 },
    },
    orderBy: { watchedAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.contentId,
    contentId: row.contentId,
    title: row.title,
    progress: row.progress,
    watchedAt: row.watchedAt.toISOString(),
    episode: episodeLabel(row.season, row.episode),
    image: row.image ?? undefined,
  }));
}

export async function listUserWatchHistory(userId: string, limit = 50) {
  return prisma.watchHistory.findMany({
    where: { userId },
    orderBy: { watchedAt: "desc" },
    take: limit,
  });
}

export async function listPopularContent(limit = 12): Promise<ContentItem[]> {
  const stats = await prisma.contentPlayStat.findMany({
    orderBy: { playCount: "desc" },
    take: limit,
  });

  return stats.map((stat) => ({
    id: stat.contentId,
    title: stat.title,
    genre: stat.genre ?? "General",
    year: new Date(stat.updatedAt).getFullYear(),
    rating: 0,
    image:
      stat.image ??
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=85&auto=format&fit=crop",
    type:
      stat.contentType === "anime"
        ? "anime"
        : stat.contentType === "movie"
          ? "movie"
          : "series",
  }));
}

export async function enrichStatsAsContentItems(contentIds: string[]): Promise<ContentItem[]> {
  if (contentIds.length === 0) return [];

  const stats = await prisma.contentPlayStat.findMany({
    where: { contentId: { in: contentIds } },
  });

  const byId = new Map(stats.map((stat) => [stat.contentId, stat]));

  return contentIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((stat) => ({
      id: stat!.contentId,
      title: stat!.title,
      genre: stat!.genre ?? "General",
      year: new Date(stat!.updatedAt).getFullYear(),
      rating: 0,
      image:
        stat!.image ??
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=85&auto=format&fit=crop",
      type:
        stat!.contentType === "anime"
          ? "anime"
          : stat!.contentType === "movie"
            ? "movie"
            : "series",
    }));
}
