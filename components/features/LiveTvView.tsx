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

export function LiveTvView() {
  const [q] = useQueryState("q", liveSearchParams.q);
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
  }, [q, country, category, hd]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: String(page) });
      if (q) params.set("q", q);
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
  }, [q, country, category, hd, page]);

  return (
    <FadeIn className="px-8 py-8">
      <PageHeader
        title="En Vivo"
        subtitle="Canales de televisión abierta, noticias y deportes en directo"
        count={loading ? undefined : total}
      />

      <LiveTvFilters categories={categories} countries={countries} />

      {loading && <StreamingLoader className="py-16" label="" size="sm" />}

      {error && !loading && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <FadeInStagger className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((channel) => (
            <StaggerItem key={channel.id}>
              <LiveChannelCard
                channel={channel}
                onSelect={(id) => setActiveChannel({ id, name: channel.name })}
              />
            </StaggerItem>
          ))}
        </FadeInStagger>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="py-12 text-center text-zinc-500">
          No se encontraron canales con esos filtros.
        </p>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
            className="flex items-center gap-1 rounded-lg border border-border-subtle px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-gold-500/50 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <span className="text-sm text-zinc-500">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex items-center gap-1 rounded-lg border border-border-subtle px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-gold-500/50 disabled:opacity-40"
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
          onSelectRelated={(id) => {
            const related = items.find((item) => item.id === id);
            setActiveChannel({ id, name: related?.name ?? id });
          }}
        />
      )}
    </FadeIn>
  );
}
