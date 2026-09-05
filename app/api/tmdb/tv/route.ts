import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/session";
import { fetchSeries } from "@/lib/tmdb/service";

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const q = searchParams.get("q") ?? undefined;
  const genre = searchParams.get("genre") ?? undefined;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
  const minRating = searchParams.get("minRating")
    ? Number(searchParams.get("minRating"))
    : undefined;

  try {
    const data = await fetchSeries({ page, q, genre, year, minRating });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No se pudo cargar el catálogo" }, { status: 502 });
  }
}
