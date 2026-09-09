const DEFAULT_BASE = "https://vimeus.com";

export function getVimeusBaseUrl() {
  const base = process.env.VIMEUS_EMBED_BASE?.trim() || DEFAULT_BASE;
  return base.replace(/\/+$/, "");
}

export function getVimeusViewKey() {
  return process.env.VIMEUS_VIEW_KEY?.trim() ?? "";
}

export function getVimeusApiKey() {
  return process.env.VIMEUS_API_KEY?.trim() ?? "";
}

export function isVimeusEmbedConfigured() {
  return getVimeusViewKey().length > 0;
}

export function isVimeusApiConfigured() {
  return getVimeusApiKey().length > 0;
}

/** Playback needs view_key; catalog needs API key. */
export function isVimeusConfigured() {
  return isVimeusEmbedConfigured() || isVimeusApiConfigured();
}
