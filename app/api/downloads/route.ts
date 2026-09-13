import { NextResponse } from "next/server";
import { z } from "zod";
import { prepareContentDownload } from "@/lib/downloads/prepare";
import {
  createDownloadJob,
  listUserDownloads,
  markDownloadFailed,
  markDownloadReady,
} from "@/lib/downloads/service";
import { requireAuthSession } from "@/lib/session";

const createSchema = z.object({
  contentId: z.string().min(1),
  season: z.number().int().positive().optional(),
  episode: z.number().int().positive().optional(),
  type: z.enum(["movie", "series", "anime"]).optional(),
});

export async function GET() {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const items = await listUserDownloads(session.user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const contentId = decodeURIComponent(parsed.data.contentId);
  const contentType = parsed.data.type ?? "movie";

  const job = await createDownloadJob(session.user.id, {
    contentId,
    contentType,
    season: parsed.data.season,
    episode: parsed.data.episode,
  });

  const result = await prepareContentDownload(parsed.data);

  if (!result.ok) {
    await markDownloadFailed(job.id, session.user.id, result.error);
    return NextResponse.json(
      {
        item: {
          id: job.id,
          status: "failed" as const,
          error: result.error,
        },
        available: false,
        error: result.error,
      },
      { status: result.status },
    );
  }

  await markDownloadReady(job.id, session.user.id, result.data);

  return NextResponse.json({
    available: true,
    item: {
      id: job.id,
      contentId: result.data.contentId,
      contentType: result.data.contentType,
      title: result.data.title,
      image: result.data.image,
      filename: result.data.filename,
      season: result.data.season,
      episode: result.data.episode,
      status: "ready" as const,
      fileUrl: result.data.fileUrl,
    },
    filename: result.data.filename,
    fileUrl: result.data.fileUrl,
  });
}
