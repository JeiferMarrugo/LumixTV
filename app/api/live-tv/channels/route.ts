import { NextResponse } from "next/server";
import { normalizeCountryCode } from "@/lib/iptv/constants";
import { getLiveCategories, listLiveChannels } from "@/lib/iptv/service";
import type { LiveChannelSource } from "@/lib/iptv/types";
import { requireAuthSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const country = normalizeCountryCode(searchParams.get("country"));
  const category = searchParams.get("category")?.trim() || undefined;
  const sourceParam = searchParams.get("source")?.trim();
  const source =
    sourceParam === "iptv-org" || sourceParam === "nexus" || sourceParam === "extra"
      ? (sourceParam as LiveChannelSource)
      : undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const football = searchParams.get("football") === "1";
  const streamParam = searchParams.get("stream")?.trim();
  const stream = streamParam === "all" ? "all" : "working";
  const hdParam = searchParams.get("hd");
  const hd = hdParam === "1" || hdParam === "true";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);

  try {
    const [
      {
        channels,
        total,
        hasNext,
        limit,
        verifiedCount,
        workingCount,
        hdCount,
        catalogTotal,
        nexusStats,
      },
      categories,
    ] = await Promise.all([
      listLiveChannels({ country, category, source, stream, hd, search, football, page }),
      getLiveCategories(),
    ]);

    return NextResponse.json({
      channels,
      total,
      page,
      limit,
      hasNext,
      verifiedCount,
      workingCount,
      hdCount,
      catalogTotal,
      nexusStats,
      categories,
      country,
    });
  } catch {
    return NextResponse.json({ error: "No se pudieron cargar los canales" }, { status: 502 });
  }
}
