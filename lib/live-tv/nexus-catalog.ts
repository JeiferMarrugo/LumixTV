/**

 * Cliente de IPTV Nexus (dearbulut/iptv).

 * API estática con health scoring sobre iptv-org.

 * @see https://dearbulut.github.io/iptv/api/v1/index.json

 */



const NEXUS_BASE = "https://dearbulut.github.io/iptv/api/v1";

const REVALIDATE_SECONDS = 60 * 60;



const FETCH_TIMEOUT_MS = 25_000;



async function fetchNexusJson<T>(path: string): Promise<T> {

  const res = await fetch(`${NEXUS_BASE}/${path}`, {

    next: { revalidate: REVALIDATE_SECONDS },

    headers: { accept: "application/json" },

    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),

  });



  if (!res.ok) {

    throw new Error(`IPTV Nexus: no se pudo descargar ${path} (${res.status})`);

  }



  return (await res.json()) as T;

}



/** Posiciones en cada fila de search.json (ver docs/API.md de Nexus). */

export const NEXUS_SEARCH_FIELDS = {

  ID: 0,

  NAME: 1,

  SEARCH: 2,

  COUNTRY: 3,

  CATEGORIES: 4,

  LANGUAGES: 5,

  LOGO: 6,

  SCORE: 7,

  ONLINE: 8,

  STREAMS: 9,

  QUALITY: 10,

} as const;



export type NexusSearchRow = (string | number)[];



export interface NexusSearchIndex {

  generated_at: string;

  fields: string[];

  count: number;

  channels: NexusSearchRow[];

}



export interface NexusMetaListItem {

  id?: string;

  code?: string;

  name: string;

  flag?: string;

  channels: number;

  playable?: number;

  online?: number;

}



export interface NexusStreamHealth {

  status: "online" | "offline" | "blocked" | "error" | "timeout" | string;

  score: number;

  latency_ms?: number;

}



export interface NexusStream {

  channel: string;

  url: string;

  referrer?: string | null;

  user_agent?: string | null;

  quality?: string | null;

  rank?: number;

  health?: NexusStreamHealth;

}



export interface NexusChannelDetail {

  id: string;

  name: string;

  country: string;

  categories: string[];

  languages: string[];

  logo?: string | null;

  website?: string | null;

  is_nsfw?: boolean;

  score: number;

  online: boolean;

  best_quality?: string | null;

  streams: NexusStream[];

}



export function fetchNexusSearchIndex() {

  return fetchNexusJson<NexusSearchIndex>("search.json");

}



export function fetchNexusCountries() {

  return fetchNexusJson<NexusMetaListItem[]>("countries.json");

}



export function fetchNexusCategories() {

  return fetchNexusJson<NexusMetaListItem[]>("categories.json");

}



export function fetchNexusChannel(id: string) {

  return fetchNexusJson<NexusChannelDetail>(`channels/${encodeURIComponent(id)}.json`);

}



/** Misma normalización que usa el índice de búsqueda de Nexus. */

export function normalizeNexusSearch(value: string) {

  return value

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .toLowerCase()

    .replace(/[ıİ]/g, "i")

    .replace(/[ğ]/g, "g")

    .replace(/[şç]/g, (c) => (c === "ş" ? "s" : "c"))

    .replace(/&/g, " and ")

    .replace(/[^a-z0-9]+/g, "")

    .trim();

}


