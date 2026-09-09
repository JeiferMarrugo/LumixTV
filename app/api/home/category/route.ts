import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/session";
import { fetchHomeCategoryItems } from "@/lib/home-category-fetch";
import { isVimeusApiConfigured } from "@/lib/vimeus/config";

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre")?.trim();
  const type = searchParams.get("type") === "series" ? "series" : "movie";
  const random = searchParams.get("random") === "1";
  const exclude = searchParams.get("exclude")?.split(",").filter(Boolean) ?? [];

  if (!genre) {
    return NextResponse.json({ error: "Género requerido" }, { status: 400 });
  }

  try {
    const source = isVimeusApiConfigured() ? "catalog" : "tmdb";
    const items = await fetchHomeCategoryItems({
      genre,
      type,
      excludeIds: exclude,
      random,
      source,
    });

    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cargar la categoría";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
