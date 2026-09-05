import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/session";
import { fetchContentDetail, fetchContentTrailer } from "@/lib/tmdb/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const contentId = decodeURIComponent(id);

  try {
    const [detail, trailerKey] = await Promise.all([
      fetchContentDetail(contentId),
      fetchContentTrailer(contentId),
    ]);

    if (!detail) {
      return NextResponse.json({ error: "Contenido no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ detail, trailerKey });
  } catch {
    return NextResponse.json({ error: "No se pudo cargar el contenido" }, { status: 502 });
  }
}
