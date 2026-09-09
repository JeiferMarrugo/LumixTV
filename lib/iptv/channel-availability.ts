import { getChannelFamilyKey } from "@/lib/iptv/channel-family";
import type { EnrichedIptvStream, LiveChannel } from "@/lib/iptv/types";
import type { NexusStream } from "@/lib/iptv/nexus";

const DGO_URL = "https://www.directvgo.com";

export function isChannelAvailable(
  streams: EnrichedIptvStream[],
  nexusStreams: NexusStream[],
) {
  if (streams.some((stream) => stream.verified)) return true;

  if (streams.some((stream) => stream.label?.startsWith("Nexus:"))) return true;

  if (nexusStreams.some((stream) => stream.health?.status === "online")) return true;

  if (streams.length === 0) return false;

  if (nexusStreams.length === 0) return streams.length > 0;

  const allBlocked = nexusStreams.every((stream) => {
    const status = stream.health?.status?.toLowerCase();
    return status === "blocked" || status === "offline";
  });

  return !allBlocked;
}

export function getUnavailableChannelMessage(channel: LiveChannel) {
  const family = getChannelFamilyKey(channel);

  if (family === "D Sports") {
    return {
      title: "DSports requiere acceso oficial",
      body:
        "Los streams públicos de DSports están bloqueados o fuera de línea. " +
        "Este canal se transmite oficialmente por DGO / DIRECTV en Latinoamérica.",
      actionLabel: "Ir a DGO",
      actionUrl: DGO_URL,
      alternatives: "Prueba Win Sports, ESPN o TyC Sports — muchos tienen señal verificada.",
    };
  }

  return {
    title: "Canal sin señal disponible",
    body:
      "Ningún servidor público respondió para este canal. Puede estar geo-bloqueado o temporalmente fuera de línea.",
    alternatives: "Busca otro canal de la misma familia con el badge Verificado.",
  };
}
