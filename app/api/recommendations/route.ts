import { NextResponse } from "next/server";
import { buildRecommendations } from "@/lib/recommendations";
import { requireAuthSession } from "@/lib/session";

export async function GET() {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await buildRecommendations(session.user.id);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cargar recomendaciones";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
