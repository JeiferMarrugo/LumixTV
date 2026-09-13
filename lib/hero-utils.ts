const YEAR_SUFFIX = /\s*[\(\[]?\s*(19|20)\d{2}\s*[\)\]]?\s*$/;

export function cleanHeroTitle(title: string) {
  return title.replace(YEAR_SUFFIX, "").trim() || title;
}

export function truncateHeroDescription(text: string, maxLength = 240) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

const PLACEHOLDER_DESCRIPTIONS = [
  "Disponible para reproducir en LumixTV.",
  "Descubre este título en LumixTV.",
  "Descubre este anime en LumixTV.",
  "Explora este título en LumixTV y disfrútalo en streaming.",
  "Sinopsis no disponible.",
];

export function isPlaceholderHeroDescription(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return true;
  if (PLACEHOLDER_DESCRIPTIONS.includes(normalized)) return true;
  if (/^Disponible en .+\.$/i.test(normalized)) return true;
  return false;
}

export function isValidHeroYear(year: number) {
  const current = new Date().getFullYear();
  return year >= 1950 && year <= current + 1;
}
