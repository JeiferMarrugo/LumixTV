import type { LiveChannel } from "@/lib/iptv/types";

const FOOTBALL_KEYWORDS = [
  "football",
  "futbol",
  "fútbol",
  "soccer",
  "bein",
  "beIN",
  "espn",
  "deportes",
  "tyc",
  "win sports",
  "gol tv",
  "goltv",
  "directv",
  "direc tv",
  "sky sport",
  "supersport",
  "premier",
  "liga",
  "movistar",
  "telemundo",
  "claro sport",
  "band sport",
  "fox sport",
  "tudn",
  "universo",
  "cbf",
  "fifa",
  "uefa",
  "copa",
  "champions",
  "dazn",
  "star+",
  "paramount",
];

function channelSearchText(channel: LiveChannel): string {
  return [channel.name, ...(channel.altNames ?? [])].join(" ").toLowerCase();
}

export function isFootballSportsChannel(channel: LiveChannel): boolean {
  if (!channel.categories.includes("sports")) return false;

  const text = channelSearchText(channel);
  return FOOTBALL_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
}

export function isSportsChannel(channel: LiveChannel): boolean {
  return channel.categories.includes("sports");
}
