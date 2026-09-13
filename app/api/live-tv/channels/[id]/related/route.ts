import { NextResponse } from "next/server";

import { getLiveChannelById, getRelatedLiveChannels } from "@/lib/live-tv/service";

import { requireAuthSession } from "@/lib/session";



export async function GET(

  _request: Request,

  { params }: { params: Promise<{ id: string }> },

) {

  const session = await requireAuthSession();

  if (!session) {

    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  }



  const { id } = await params;

  const channel = await getLiveChannelById(decodeURIComponent(id));



  if (!channel) {

    return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 });

  }



  const related = await getRelatedLiveChannels(channel);



  return NextResponse.json({
    items: related.map((item) => ({
      id: item.id,
      name: item.name,
      logo: item.logo,
      countryCode: item.countryCode,
      categories: item.categories,
    })),
  });

}

