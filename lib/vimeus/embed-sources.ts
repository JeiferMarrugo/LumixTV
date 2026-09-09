import { buildVimeusEmbedUrl, type VimeusEmbedParams } from "@/lib/vimeus/embed";

export interface VimeusPlaybackSource {
  id: string;
  label: string;
  url: string;
}

/** Solo el reproductor Vimeus — calidad/servidor se elige dentro del embed. */
export async function fetchVimeusPlaybackSources(params: VimeusEmbedParams) {
  const playerUrl = buildVimeusEmbedUrl(params);
  if (!playerUrl) {
    return { playerUrl: null as string | null, sources: [] as VimeusPlaybackSource[] };
  }

  return {
    playerUrl,
    sources: [{ id: "player", label: "Vimeus", url: playerUrl }],
  };
}
