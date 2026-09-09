import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/session";
import { fetchMovies } from "@/lib/tmdb/service";
import { enrichVimeusItems, parseVimeusCatalogFilters } from "@/lib/vimeus/catalog";
import { searchVimeusCatalogPage } from "@/lib/vimeus/search";
import { listVimeusMovies } from "@/lib/vimeus/service";
import { isVimeusApiConfigured } from "@/lib/vimeus/config";

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isVimeusApiConfigured()) {
    return NextResponse.json({ error: "Catálogo no configurado" }, { status: 503 });
  }

  const filters = parseVimeusCatalogFilters(new URL(request.url));

  try {
    if (filters.q) {
      const data = await searchVimeusCatalogPage({
        contentType: "movie",
        query: filters.q,
        page: filters.page,
      });
      const tmdbCatalog = await fetchMovies({ page: 1 });

      return NextResponse.json({
        items: data.items,
        genres: tmdbCatalog.genres ?? [],
        page: data.page,
        totalPages: data.totalPages,
        totalResults: data.totalResults,
      });
    }

    if (filters.hasFilters) {
      const data = await fetchMovies({
        page: filters.page,
        genre: filters.genre,
        year: filters.year,
        minRating: filters.minRating,
      });

      return NextResponse.json({
        items: data.items ?? [],
        genres: data.genres ?? [],
        page: data.page,
        totalPages: data.totalPages,
        totalResults: data.totalResults,
      });
    }

    const data = await listVimeusMovies(filters.page);
    const items = await enrichVimeusItems(data.items, "movie");
    const tmdbCatalog = await fetchMovies({ page: 1 });

    return NextResponse.json({
      items,
      genres: tmdbCatalog.genres ?? [],
      page: data.page,
      totalPages: data.totalPages,
      totalResults: data.totalResults,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al consultar el catálogo";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
