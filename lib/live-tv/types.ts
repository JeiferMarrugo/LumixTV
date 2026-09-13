/**
 * Tipos del catálogo "En Vivo" (IPTV).
 *
 * Catálogo vía IPTV Nexus (health-scored, sobre iptv-org):
 * https://dearbulut.github.io/iptv/api/v1/
 * Los streams quedan
 * expuestos a través de nuestra propia API interna, nunca directamente
 * al cliente.
 */

export type LiveStreamProvider = "nexus" | "iptv-org";

export interface LiveStreamSource {
  /** URL original del stream (m3u8/mpd). */
  url: string;
  /** Cabecera Referer requerida por algunos orígenes. */
  referrer?: string | null;
  /** User-Agent requerido por algunos orígenes. */
  userAgent?: string | null;
  /** Calidad reportada (ej. "1080p", "720p"). */
  quality?: string | null;
  /** Último health check de Nexus. */
  online?: boolean;
  /** Origen del catálogo (Nexus o iptv-org). */
  provider?: LiveStreamProvider;
}

export interface LiveChannel {
  id: string;
  name: string;
  logo?: string | null;
  countryCode: string;
  categories: string[];
  languages: string[];
  isNsfw: boolean;
  website?: string | null;
  /** Fuentes de reproducción disponibles, en orden de preferencia. */
  streams: LiveStreamSource[];
}

export interface LiveCategoryOption {
  id: string;
  name: string;
  count: number;
}

export interface LiveCountryOption {
  code: string;
  name: string;
  flag: string;
  count: number;
}

export interface LiveChannelFilters {
  country?: string;
  category?: string;
  search?: string;
  hdOnly?: boolean;
  page: number;
  pageSize: number;
}

export interface LiveChannelListItem {
  id: string;
  name: string;
  logo?: string | null;
  countryCode: string;
  categories: string[];
}

export interface LiveChannelListResult {
  items: LiveChannelListItem[];
  total: number;
  page: number;
  totalPages: number;
  categories: LiveCategoryOption[];
  countries: LiveCountryOption[];
}
