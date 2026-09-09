export interface IptvChannel {
  id: string;
  name: string;
  alt_names?: string[];
  country: string;
  categories: string[];
  is_nsfw: boolean;
  closed?: string | null;
  website?: string | null;
}

export interface IptvStreamHealth {
  status?: string;
  score?: number;
  uptime?: number;
  latency_ms?: number;
  media?: {
    variants?: number;
    width?: number | null;
    height?: number | null;
    bitrate?: number | null;
  };
}

export interface IptvStream {
  channel: string | null;
  feed?: string | null;
  title: string;
  url: string;
  referrer?: string | null;
  user_agent?: string | null;
  quality?: string | null;
  label?: string | null;
}

export type LiveChannelSource = "iptv-org" | "nexus" | "extra";

/** Stream enriquecido con datos de salud (IPTV Nexus) */
export interface EnrichedIptvStream extends IptvStream {
  verified?: boolean;
  health?: IptvStreamHealth;
  rank?: number;
  source?: LiveChannelSource;
  sourceDetail?: string;
}

export interface IptvLogo {
  channel: string;
  feed?: string | null;
  in_use: boolean;
  format?: string | null;
  url: string;
}

export interface IptvBlockEntry {
  channel: string;
  reason: string;
}

export interface IptvCategory {
  id: string;
  name: string;
}

export interface LiveChannel {
  id: string;
  name: string;
  altNames?: string[];
  country: string;
  categories: string[];
  logo?: string;
  quality?: string;
  label?: string;
  /** Origen del catálogo (iptv-org, Nexus, M3U/servidores extra) */
  source: LiveChannelSource;
  /** ID iptv-org para emparejar variantes del mismo canal */
  baseChannelId?: string;
  /** Nombre legible de la fuente (p. ej. "Nexus", "best.m3u") */
  sourceLabel?: string;
  /** Título del stream en streams.json (p. ej. "ESPN Deportes HD") */
  streamTitle?: string;
  /** Tiene al menos un stream verificado en línea (IPTV Nexus) */
  verified?: boolean;
  /** Hay al menos una fuente con posibilidad de reproducir */
  available?: boolean;
  /** Al menos un stream con health online (Nexus) o URL directa (org/extra) */
  streamOnline?: boolean;
}

export interface LiveStreamPlayback {
  channelId: string;
  title: string;
  url: string;
  referrer?: string;
  userAgent?: string;
  quality?: string;
  label?: string;
  /** Stream comprobado en línea por IPTV Nexus — no requiere probe previo */
  verified?: boolean;
  source?: LiveChannelSource;
  sourceDetail?: string;
}

export interface LiveStreamOption {
  index: number;
  quality?: string;
  label: string;
}

export interface LiveStreamSourceGroup {
  source: LiveChannelSource;
  label: string;
  streams: LiveStreamOption[];
}
