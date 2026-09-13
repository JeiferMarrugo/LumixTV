import { prisma } from "@/lib/prisma";
import type { PreparedDownload } from "@/lib/downloads/prepare";

export type DownloadStatus = "preparing" | "ready" | "failed";

export interface DownloadRecord {
  id: string;
  contentId: string;
  contentType: string;
  title: string;
  image?: string | null;
  filename?: string | null;
  season?: number | null;
  episode?: number | null;
  status: DownloadStatus;
  fileUrl?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

function episodeLabel(season: number | null | undefined, episode: number | null | undefined) {
  if (!season && !episode) return undefined;
  if (season && episode) return `T${season} E${episode}`;
  if (episode) return `E${episode}`;
  return undefined;
}

function mapRecord(row: {
  id: string;
  contentId: string;
  contentType: string;
  title: string;
  image: string | null;
  filename: string | null;
  season: number | null;
  episode: number | null;
  status: string;
  fileUrl: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}): DownloadRecord & { episodeLabel?: string } {
  return {
    id: row.id,
    contentId: row.contentId,
    contentType: row.contentType,
    title: row.title,
    image: row.image,
    filename: row.filename,
    season: row.season,
    episode: row.episode,
    status: row.status as DownloadStatus,
    fileUrl: row.fileUrl,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    episodeLabel: episodeLabel(row.season, row.episode),
  };
}

export async function listUserDownloads(userId: string, limit = 50) {
  const rows = await prisma.contentDownload.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(mapRecord);
}

export async function createDownloadJob(
  userId: string,
  input: {
    contentId: string;
    contentType: string;
    season?: number;
    episode?: number;
  },
) {
  return prisma.contentDownload.create({
    data: {
      userId,
      contentId: input.contentId,
      contentType: input.contentType,
      title: "Preparando...",
      season: input.season,
      episode: input.episode,
      status: "preparing",
    },
  });
}

export async function markDownloadReady(id: string, userId: string, prepared: PreparedDownload) {
  return prisma.contentDownload.updateMany({
    where: { id, userId },
    data: {
      contentId: prepared.contentId,
      contentType: prepared.contentType,
      title: prepared.title,
      image: prepared.image,
      filename: prepared.filename,
      season: prepared.season,
      episode: prepared.episode,
      status: "ready",
      fileUrl: prepared.fileUrl,
      error: null,
    },
  });
}

export async function markDownloadFailed(id: string, userId: string, error: string) {
  return prisma.contentDownload.updateMany({
    where: { id, userId },
    data: {
      status: "failed",
      error,
    },
  });
}

export async function deleteUserDownload(userId: string, id: string) {
  return prisma.contentDownload.deleteMany({
    where: { id, userId },
  });
}

export async function getUserDownload(userId: string, id: string) {
  const row = await prisma.contentDownload.findFirst({
    where: { id, userId },
  });
  return row ? mapRecord(row) : null;
}
