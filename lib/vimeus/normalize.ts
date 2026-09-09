import type { VimeusContentType, VimeusPagedItems, VimeusRawItem, VimeusRawListingData } from "@/lib/vimeus/types";

function pickItems(data: VimeusRawListingData | null | undefined, legacyKey: keyof VimeusRawListingData): VimeusRawItem[] {
  if (!data) return [];

  if (Array.isArray(data.result)) {
    return data.result;
  }

  const legacy = data[legacyKey];
  return Array.isArray(legacy) ? legacy : [];
}

export function normalizeVimeusListing(
  data: VimeusRawListingData | null | undefined,
  legacyKey: keyof VimeusRawListingData,
  page: number,
): VimeusPagedItems {
  const items = pickItems(data, legacyKey);
  const totalPages = data?.pages ?? data?.pagination?.total_pages ?? 1;
  const perPage = data?.pagination?.per_page ?? (items.length || 50);
  const totalResults =
    data?.pagination?.total_results ?? Math.max(items.length, totalPages * perPage);

  return {
    items,
    page: data?.pagination?.current_page ?? page,
    totalPages,
    totalResults,
  };
}

export function inferContentType(
  item: VimeusRawItem,
  fallback: VimeusContentType,
): VimeusContentType {
  const raw = (item.content_type ?? item.parent_type ?? fallback).toLowerCase();
  if (raw.includes("anime")) return "anime";
  if (raw.includes("movie")) return "movie";
  if (raw.includes("series") || raw.includes("serie") || raw.includes("tv")) return "series";
  return fallback;
}

export function itemTitle(item: VimeusRawItem) {
  return item.title ?? item.show_title ?? "Sin título";
}
