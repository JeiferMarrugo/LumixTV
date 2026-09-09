const YEAR_SUFFIX = /\s*[\(\[]?\s*(19|20)\d{2}\s*[\)\]]?\s*$/;

export function cleanHeroTitle(title: string) {
  return title.replace(YEAR_SUFFIX, "").trim() || title;
}

export function truncateHeroDescription(text: string, maxLength = 180) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}
