import { NextResponse } from "next/server";
import { z } from "zod";
import {
  countUnreadNotifications,
  createNotification,
  ensureWelcomeNotification,
  listNotifications,
  markAllNotificationsRead,
} from "@/lib/notifications";
import { requireAuthSession, requireSuperAdminSession } from "@/lib/session";

const createSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
  type: z.enum(["info", "success", "warning", "error"]).optional(),
  href: z.string().optional(),
});

export async function GET() {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await ensureWelcomeNotification(session.user.id, session.user.name);

  const [items, unread] = await Promise.all([
    listNotifications(session.user.id),
    countUnreadNotifications(session.user.id),
  ]);

  return NextResponse.json({ items, unread });
}

export async function POST(request: Request) {
  const adminSession = await requireSuperAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const notification = await createNotification(parsed.data);
  return NextResponse.json({ notification });
}

export async function PATCH() {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await markAllNotificationsRead(session.user.id);
  return NextResponse.json({ ok: true });
}
