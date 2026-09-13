import { NextResponse } from "next/server";
import { deleteUserDownload, getUserDownload } from "@/lib/downloads/service";
import { requireAuthSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const item = await getUserDownload(session.user.id, id);

  if (!item) {
    return NextResponse.json({ error: "Descarga no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const result = await deleteUserDownload(session.user.id, id);

  if (result.count === 0) {
    return NextResponse.json({ error: "Descarga no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
