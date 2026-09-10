/**
 * Acceso a los feeds públicos de iptv-org.
 *
 * Todos los feeds son JSON estáticos publicados en GitHub Pages y se
 * cachean con el Data Cache de Next.js (`revalidate`) para evitar
 * descargarlos en cada request.
 */

const API_BASE = "https://iptv-org.github.io/api";

/** Revalida el catálogo cada 6 horas. */
const CATALOG_REVALIDATE_SECONDS = 60 * 60 * 6;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    next: { revalidate: CATALOG_REVALIDATE_SECONDS },
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`No se pudo descargar ${path} (${res.status})`);
  }

  return (await res.json()) as T;
}

export interface RawChannel {
  id: string;
  name: string;
  alt_names?: string[];
  network?: string | null;
  country: string;
  subdivision?: string | null;
  city?: string | null;
  categories?: string[];
  languages?: string[];
  is_nsfw?: boolean;
  closed?: string | null;
  replaced_by?: string | null;
  website?: string | null;
  logo?: string | null;
}

export interface RawStream {
  channel?: string | null;
  feed?: string | null;
  title?: string | null;
  url: string;
  referrer?: string | null;
  user_agent?: string | null;
  quality?: string | null;
}

export interface RawCategory {
  id: string;
  name: string;
}

export interface RawCountry {
  name: string;
  code: string;
  flag?: string;
  languages?: string[];
}

export interface RawLogo {
  channel: string;
  feed?: string | null;
  tags?: string[];
  url: string;
}

export function fetchRawChannels() {
  return fetchJson<RawChannel[]>("channels.json");
}

export function fetchRawStreams() {
  return fetchJson<RawStream[]>("streams.json");
}

export function fetchRawCategories() {
  return fetchJson<RawCategory[]>("categories.json");
}

export function fetchRawCountries() {
  return fetchJson<RawCountry[]>("countries.json");
}

export function fetchRawLogos() {
  return fetchJson<RawLogo[]>("logos.json");
}
