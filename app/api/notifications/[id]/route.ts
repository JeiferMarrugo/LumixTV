import { NextResponse } from "next/server";
import { markNotificationRead } from "@/lib/notifications";
import { requireAuthSession } from "@/lib/session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, { params }: RouteParams) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await markNotificationRead(session.user.id, id);

  return NextResponse.json({ ok: true });
}
