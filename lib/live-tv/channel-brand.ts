interface ChannelBrand {
  key: string;
  label: string;
  patterns: RegExp[];
}

const CHANNEL_BRANDS: ChannelBrand[] = [
  { key: "caracol", label: "Caracol", patterns: [/caracol/i] },
  {
    key: "rcn",
    label: "RCN",
    patterns: [
      /\brcn\b/i,
      /^rcn/i,
      /canalrcn/i,
      /noticiasrcn/i,
      /deportesrcn/i,
      /novelasrcn/i,
      /rcnmas/i,
      /rcnnovelas/i,
      /rcnxtra/i,
      /rcnhd/i,
    ],
  },
  { key: "winsports", label: "Win Sports", patterns: [/win\s*sports?/i, /winsports/i] },
  { key: "citytv", label: "City TV", patterns: [/city\s*tv/i, /citytv/i] },
  { key: "telecaribe", label: "Telecaribe", patterns: [/telecaribe/i] },
  { key: "teleantioquia", label: "Teleantioquia", patterns: [/teleantioquia/i] },
  { key: "telepacifico", label: "Telepacífico", patterns: [/telepacifico/i, /telepacífico/i] },
  { key: "canal1", label: "Canal 1", patterns: [/canal\s*1\b/i, /canal1/i] },
  { key: "canalinst", label: "Canal Institucional", patterns: [/canal\s*inst/i, /canalinst/i] },
  { key: "bluradio", label: "Blu Radio", patterns: [/blu\s*radio/i, /bluradio/i] },
  { key: "espn", label: "ESPN", patterns: [/espn/i] },
  { key: "fox", label: "Fox", patterns: [/fox\s*(sports|news)?/i] },
  { key: "directv", label: "DIRECTV", patterns: [/directv/i, /d\s*sports/i] },
  { key: "televisa", label: "Televisa", patterns: [/televisa/i] },
  { key: "telemundo", label: "Telemundo", patterns: [/telemundo/i] },
  { key: "unicable", label: "Unicable", patterns: [/unicable/i] },
  { key: "azteca", label: "TV Azteca", patterns: [/azteca/i] },
  { key: "lasestrellas", label: "Las Estrellas", patterns: [/las\s*estrellas/i] },
];

export interface DetectedChannelBrand {
  key: string;
  label: string;
}

export function detectChannelBrand(name: string, id = ""): DetectedChannelBrand | null {
  const haystack = `${name} ${id}`;

  for (const brand of CHANNEL_BRANDS) {
    if (brand.patterns.some((pattern) => pattern.test(haystack))) {
      return { key: brand.key, label: brand.label };
    }
  }

  return null;
}

export function channelsShareBrand(
  source: { name: string; id: string },
  candidate: { name: string; id: string },
): boolean {
  const sourceBrand = detectChannelBrand(source.name, source.id);
  if (!sourceBrand) return false;

  const candidateBrand = detectChannelBrand(candidate.name, candidate.id);
  return candidateBrand?.key === sourceBrand.key;
}
