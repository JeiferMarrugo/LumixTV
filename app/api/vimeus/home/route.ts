import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { requireAuthSession } from "@/lib/session";
import { buildRandomVimeusFeaturedList } from "@/lib/home-featured";
import { isVimeusApiConfigured } from "@/lib/vimeus/config";

const getCachedFeatured = unstable_cache(
  async () => buildRandomVimeusFeaturedList(),
  ["vimeus-home-featured"],
  { revalidate: 120 },
);

export async function GET() {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isVimeusApiConfigured()) {
    return NextResponse.json({ error: "Catálogo no configurado" }, { status: 503 });
  }

  try {
    const featuredList = await getCachedFeatured();

    return NextResponse.json({
      featured: featuredList[0] ?? null,
      featuredList,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al consultar el catálogo";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
