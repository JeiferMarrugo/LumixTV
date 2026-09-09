import type { ContentItem } from "@/lib/data";
import { posterUrl, backdropUrl } from "@/lib/tmdb/config";
import { inferContentType, itemTitle } from "@/lib/vimeus/normalize";
import type { VimeusContentType, VimeusRawItem } from "@/lib/vimeus/types";

function contentId(item: VimeusRawItem, contentType: VimeusContentType) {
  const prefix = contentType === "movie" ? "movie" : "tv";
  return `${prefix}-${item.tmdb_id}`;
}

function genreLabel(contentType: VimeusContentType) {
  if (contentType === "anime") return "Anime";
  if (contentType === "movie") return "Película";
  return "Serie";
}

export function mapVimeusListingItem(
  item: VimeusRawItem,
  fallbackType: VimeusContentType = "movie",
): ContentItem {
  const contentType = inferContentType(item, fallbackType);
  const poster = item.poster ? posterUrl(item.poster, "w500") : null;
  const backdrop = item.backdrop ? backdropUrl(item.backdrop, "w780") : null;

  return {
    id: contentId(item, contentType),
    title: itemTitle(item),
    genre: genreLabel(contentType),
    year: new Date(item.synced_at ?? Date.now()).getFullYear(),
    rating: 0,
    image: poster ?? backdrop ?? "https://image.tmdb.org/t/p/w500/wwemzKWzjKYJFfCeiB57N3fzImp.jpg",
    type: contentType === "anime" ? "anime" : contentType === "movie" ? "movie" : "series",
  };
}

export function mapVimeusFeatured(item: VimeusRawItem, fallbackType: VimeusContentType = "movie") {
  const contentType = inferContentType(item, fallbackType);
  const backdrop = item.backdrop
    ? backdropUrl(item.backdrop, "original") ?? backdropUrl(item.backdrop, "w1280")
    : null;
  const poster = item.poster ? posterUrl(item.poster, "w780") : null;

  return {
    id: contentId(item, contentType),
    title: itemTitle(item),
    description: item.quality ? `Disponible en ${item.quality}.` : "Disponible para reproducir en LumixTV.",
    genre: genreLabel(contentType),
    year: new Date(item.synced_at ?? Date.now()).getFullYear(),
    rating: item.quality ?? "HD",
    image: backdrop ?? poster ?? "https://image.tmdb.org/t/p/w1280/wwemzKWzjKYJFfCeiB57N3fzImp.jpg",
  };
}

export function mapVimeusEpisode(item: VimeusRawItem) {
  const number = Number(item.episode ?? 1);
  const label = item.title?.trim();
  return {
    number,
    name: label && !label.toLowerCase().includes("episodio") ? label : `Episodio ${number}`,
  };
}
