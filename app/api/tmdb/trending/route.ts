import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/session";
import { fetchTrending } from "@/lib/tmdb/service";

export async function GET() {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await fetchTrending();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar las tendencias" }, { status: 502 });
  }
}
