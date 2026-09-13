"use client";

import { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { liveSearchParams } from "@/lib/nuqs/live-parsers";
import type { LiveCategoryOption, LiveCountryOption } from "@/lib/live-tv/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { FadeIn, FadeInStagger, StaggerItem } from "@/components/ui/motion";
import { LiveTvFilters } from "@/components/features/LiveTvFilters";
import { LiveChannelCard } from "@/components/features/LiveChannelCard";
import { LiveTvPlayer } from "@/components/features/LiveTvPlayer";

interface LiveChannelListItem {
  id: string;
  name: string;
  logo?: string | null;
  countryCode: string;
  categories: string[];
}

interface ChannelsResponse {
  items: LiveChannelListItem[];
  total: number;
  page: number;
  totalPages: number;
  categories: LiveCategoryOption[];
  countries: LiveCountryOption[];
  error?: string;
}

function ChannelSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-white/[0.06] dark:bg-zinc-900/90">
      <div className="aspect-[16/11] bg-gradient-to-br from-zinc-100 to-zinc-50 sm:aspect-[16/10] dark:from-zinc-900 dark:to-zinc-950" />
      <div className="space-y-2 border-t border-zinc-100 p-3.5 dark:border-white/[0.06]">
        <div className="h-4 w-3/4 rounded-md bg-zinc-200 dark:bg-white/[0.06]" />
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded-md bg-zinc-100 dark:bg-white/[0.04]" />
          <div className="h-5 w-9 rounded-md bg-zinc-100 dark:bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

export function LiveTvView() {
  const [canal] = useQueryState("canal", liveSearchParams.canal);
  const [country] = useQueryState("country", liveSearchParams.country);
  const [category] = useQueryState("category", liveSearchParams.category);
  const [hd] = useQueryState("hd", liveSearchParams.hd);
  const [page, setPage] = useQueryState("page", liveSearchParams.page);

  const [items, setItems] = useState<LiveChannelListItem[]>([]);
  const [categories, setCategories] = useState<LiveCategoryOption[]>([]);
  const [countries, setCountries] = useState<LiveCountryOption[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal, country, category, hd]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: String(page) });
      if (canal) params.set("q", canal);
      if (country) params.set("country", country);
      if (category) params.set("category", category);
      if (hd) params.set("hd", "true");

      try {
        const res = await fetch(`/api/live-tv/channels?${params}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as ChannelsResponse;

        if (!res.ok) throw new Error(data.error ?? "No se pudo cargar el catálogo en vivo");

        setItems(data.items ?? []);
        setCategories(data.categories ?? []);
        setCountries(data.countries ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "No se pudo cargar el catálogo en vivo.");
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [canal, country, category, hd, page]);

  return (
    <FadeIn className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader
        title="En Vivo"
        subtitle="Canales de televisión abierta, noticias y deportes en directo"
        count={loading ? undefined : total}
      />

      <LiveTvFilters categories={categories} countries={countries} />

      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <ChannelSkeleton key={index} />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <FadeInStagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((channel) => (
            <StaggerItem key={channel.id}>
              <LiveChannelCard
                channel={channel}
                compact
                onSelect={(id) => setActiveChannel({ id, name: channel.name })}
              />
            </StaggerItem>
          ))}
        </FadeInStagger>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="py-12 text-center text-sm text-zinc-500">
          No se encontraron canales con esos filtros.
        </p>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
            className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-gold-500/40 hover:text-gold-700 disabled:opacity-40 sm:px-4 dark:border-border-subtle dark:bg-transparent dark:text-zinc-300"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <span className="text-xs text-zinc-600 sm:text-sm dark:text-zinc-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-gold-500/40 hover:text-gold-700 disabled:opacity-40 sm:px-4 dark:border-border-subtle dark:bg-transparent dark:text-zinc-300"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {activeChannel && (
        <LiveTvPlayer
          channelId={activeChannel.id}
          channelName={activeChannel.name}
          onClose={() => setActiveChannel(null)}
          onSelectRelated={(id, name) => {
            setActiveChannel({ id, name });
          }}
        />
      )}
    </FadeIn>
  );
}
