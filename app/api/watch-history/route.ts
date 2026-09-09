import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthSession } from "@/lib/session";
import {
  listContinueWatching,
  recordWatchStart,
  removeFromWatchHistory,
  updateWatchProgress,
} from "@/lib/watch-history";

const recordSchema = z.object({
  contentId: z.string().min(1),
  title: z.string().min(1),
  image: z.string().optional(),
  genre: z.string().optional(),
  contentType: z.enum(["movie", "series", "anime"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  season: z.number().int().positive().optional(),
  episode: z.number().int().positive().optional(),
});

const progressSchema = z.object({
  contentId: z.string().min(1),
  progress: z.number().min(0).max(100),
  season: z.number().int().positive().optional(),
  episode: z.number().int().positive().optional(),
});

export async function GET() {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const items = await listContinueWatching(session.user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = recordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const record = await recordWatchStart({
    userId: session.user.id,
    ...parsed.data,
  });

  return NextResponse.json({ ok: true, record });
}

export async function PATCH(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = progressSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  await updateWatchProgress({
    userId: session.user.id,
    ...parsed.data,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const contentId = new URL(request.url).searchParams.get("contentId")?.trim();
  if (!contentId) {
    return NextResponse.json({ error: "contentId requerido" }, { status: 400 });
  }

  await removeFromWatchHistory(session.user.id, contentId);
  return NextResponse.json({ ok: true });
}
