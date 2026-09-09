import type { LiveChannel } from "@/lib/iptv/types";

interface BrandRule {
  key: string;
  pattern: RegExp;
}

const BRAND_RULES: BrandRule[] = [
  { key: "ESPN", pattern: /espn|espnu|espnews/i },
  { key: "D Sports", pattern: /\bd\s*\+?\s*sport|\bdsport|directv\s*sport|directv\s*deportes/i },
  { key: "Win Sports", pattern: /\bwin\s*sport/i },
  { key: "BeIN", pattern: /\bbein\b/i },
  { key: "Fox Sports", pattern: /\bfox\s*sport/i },
  { key: "TUDN", pattern: /\btudn\b/i },
  { key: "TyC Sports", pattern: /\btyc\s*sport/i },
  { key: "Gol TV", pattern: /\bgol\s*tv|\bgoltv\b/i },
  { key: "Star+", pattern: /\bstar\s*\+|\bstarplus\b/i },
  { key: "DAZN", pattern: /\bdazn\b/i },
  { key: "Sky Sports", pattern: /\bsky\s*sport/i },
  { key: "SuperSport", pattern: /\bsupersport/i },
  { key: "Movistar", pattern: /\bmovistar\b/i },
  { key: "Claro Sports", pattern: /\bclaro\s*sport/i },
  { key: "Band Sports", pattern: /\bband\s*sport/i },
  { key: "Premiere", pattern: /\bpremiere\b/i },
  { key: "Telemundo", pattern: /\btelemundo\b/i },
  { key: "Paramount", pattern: /\bparamount\b/i },
];

function channelHaystack(channel: LiveChannel): string {
  return [
    channel.id,
    channel.name,
    channel.streamTitle,
    channel.sourceLabel,
    channel.label,
    ...(channel.altNames ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function fallbackFamilyKey(channel: LiveChannel): string | null {
  const firstWord = channel.name
    .replace(/\b(hd|4k|uhd|plus|\+|latin\s*america|caribbean|africa)\b/gi, "")
    .replace(/\d+/g, " ")
    .trim()
    .split(/\s+/)[0];

  if (!firstWord || firstWord.length < 3) return null;
  return firstWord.toLowerCase();
}

export function getChannelFamilyKey(channel: LiveChannel): string | null {
  const haystack = channelHaystack(channel);

  for (const rule of BRAND_RULES) {
    if (rule.pattern.test(haystack)) return rule.key;
  }

  return fallbackFamilyKey(channel);
}

export function channelsSameFamily(a: LiveChannel, b: LiveChannel): boolean {
  const familyA = getChannelFamilyKey(a);
  const familyB = getChannelFamilyKey(b);
  return Boolean(familyA && familyB && familyA === familyB);
}

export function sortRelatedChannels(current: LiveChannel, related: LiveChannel[]): LiveChannel[] {
  return [...related].sort((a, b) => {
    const aVerified = a.verified ? 0 : 1;
    const bVerified = b.verified ? 0 : 1;
    if (aVerified !== bVerified) return aVerified - bVerified;

    const aSameCountry = a.country === current.country ? 0 : 1;
    const bSameCountry = b.country === current.country ? 0 : 1;
    if (aSameCountry !== bSameCountry) return aSameCountry - bSameCountry;

    return a.name.localeCompare(b.name, "es");
  });
}
