import { NextResponse } from "next/server";
import { searchAllContent } from "@/lib/tmdb/service";
import { isVimeusApiConfigured } from "@/lib/vimeus/config";
import { searchVimeusContent } from "@/lib/vimeus/search";
import { requireAuthSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const full = searchParams.get("full") === "1" || searchParams.get("full") === "true";
  const previewLimit = Math.min(
    12,
    Math.max(1, Number(searchParams.get("limit") ?? 6) || 6),
  );

  if (q.length < 2) {
    return NextResponse.json({
      query: q,
      movies: [],
      series: [],
      anime: [],
      total: 0,
      totals: { movies: 0, series: 0, anime: 0 },
    });
  }

  try {
    if (isVimeusApiConfigured()) {
      const data = full
        ? await searchVimeusContent(q)
        : await searchVimeusContent(q, { previewLimit, maxPages: 15 });
      return NextResponse.json(data);
    }

    const data = full
      ? await searchAllContent(q)
      : await searchAllContent(q, { previewLimit });

    return NextResponse.json({ ...data, source: "tmdb" });
  } catch {
    return NextResponse.json({ error: "No se pudo buscar contenido" }, { status: 502 });
  }
}
