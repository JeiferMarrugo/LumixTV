import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/session";
import { listLiveChannels } from "@/lib/live-tv/service";

const PAGE_SIZE = 24;

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const country = url.searchParams.get("country")?.trim() || undefined;
  const category = url.searchParams.get("category")?.trim() || undefined;
  const search = url.searchParams.get("q")?.trim() || undefined;
  const hdOnly = url.searchParams.get("hd") === "true";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);

  try {
    const result = await listLiveChannels({
      country,
      category,
      search,
      hdOnly,
      page,
      pageSize: PAGE_SIZE,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cargar el catálogo en vivo";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
