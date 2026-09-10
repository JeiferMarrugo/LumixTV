/**
 * Tipos del catálogo "En Vivo" (IPTV).
 *
 * El catálogo se construye combinando los feeds públicos de iptv-org
 * (https://iptv-org.github.io/api) con los canales y streams quedan
 * expuestos a través de nuestra propia API interna, nunca directamente
 * al cliente.
 */

export interface LiveStreamSource {
  /** URL original del stream (m3u8/mpd). */
  url: string;
  /** Cabecera Referer requerida por algunos orígenes. */
  referrer?: string | null;
  /** User-Agent requerido por algunos orígenes. */
  userAgent?: string | null;
  /** Calidad reportada (ej. "1080p", "720p"). */
  quality?: string | null;
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

export interface LiveChannelListResult {
  items: LiveChannel[];
  total: number;
  page: number;
  totalPages: number;
  categories: LiveCategoryOption[];
  countries: LiveCountryOption[];
}
