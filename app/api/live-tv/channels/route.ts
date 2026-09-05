import { NextResponse } from "next/server";
import { getLiveCategories, listLiveChannels } from "@/lib/iptv/service";
import { requireAuthSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") ?? "CO";
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  try {
    const [{ channels, total }, categories] = await Promise.all([
      listLiveChannels({ country, category, search }),
      getLiveCategories(),
    ]);

    return NextResponse.json({ channels, total, categories, country });
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar los canales" }, { status: 502 });
  }
}
