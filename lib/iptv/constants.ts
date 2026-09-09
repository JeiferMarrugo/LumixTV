export const ALL_COUNTRIES_CODE = "ALL";

/** Canales por página cuando el filtro es "Todos los países" */
export const LIVE_CHANNELS_PAGE_SIZE_ALL = 48;
/** Canales por página con un país concreto */
export const LIVE_CHANNELS_PAGE_SIZE = 72;
export const LIVE_CHANNELS_MAX_PAGE_SIZE = 120;

/** Fuentes alternativas probadas por canal en el reproductor */
export const LIVE_STREAM_CANDIDATE_LIMIT = 20;

/** Tiempo máximo esperando respuesta de un server antes de probar el siguiente */
export const LIVE_PLAYER_SOURCE_TIMEOUT_MS = 40_000;
/** Tiempo esperando primer frame tras cargar el manifiesto HLS */
export const LIVE_PLAYER_PLAYBACK_TIMEOUT_MS = 32_000;
/** Pausa entre cambio de server para dar tiempo al buffer */
export const LIVE_PLAYER_SERVER_SWITCH_DELAY_MS = 3_000;
/** Pausa antes de reiniciar el ciclo completo de servers */
export const LIVE_PLAYER_CYCLE_DELAY_MS = 5_000;
/** Tiempo total intentando conectar antes de mostrar error al usuario */
export const LIVE_PLAYER_MAX_CONNECT_MS = 60_000;

export const LIVE_COUNTRY_OPTIONS = [
  { code: ALL_COUNTRIES_CODE, name: "Todos", flag: "🌎" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
] as const;

export function normalizeCountryCode(input?: string | null): string {
  const value = input?.trim() ?? "";
  if (!value) return "CO";

  const upper = value.toUpperCase();
  if (upper === ALL_COUNTRIES_CODE) return ALL_COUNTRIES_CODE;

  const byCode = LIVE_COUNTRY_OPTIONS.find((opt) => opt.code === upper);
  if (byCode) return byCode.code;

  const byName = LIVE_COUNTRY_OPTIONS.find(
    (opt) => opt.name.toLowerCase() === value.toLowerCase(),
  );
  if (byName) return byName.code;

  return upper.length === 2 ? upper : "CO";
}

export function isAllCountries(code?: string | null): boolean {
  return normalizeCountryCode(code) === ALL_COUNTRIES_CODE;
}
