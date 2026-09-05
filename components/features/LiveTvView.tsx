"use client";

import { Suspense, useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { Loader2, RefreshCw, Search, X } from "lucide-react";
import { LiveChannelCard } from "@/components/features/LiveChannelCard";
import { LiveTvPlayer } from "@/components/features/LiveTvPlayer";
import { PageHeader } from "@/components/ui/PageHeader";
import { FadeIn, FadeInStagger, StaggerItem } from "@/components/ui/motion";
import type { IptvCategory, LiveChannel } from "@/lib/iptv/types";
import { LIVE_COUNTRY_OPTIONS } from "@/lib/iptv/constants";
import { liveTvSearchParams } from "@/lib/nuqs/live-parsers";

function LiveTvContent() {
  const [country, setCountry] = useQueryState("country", liveTvSearchParams.country);
  const [category, setCategory] = useQueryState("category", liveTvSearchParams.category);
  const [search, setSearch] = useQueryState("q", liveTvSearchParams.q);

  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [categories, setCategories] = useState<IptvCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<LiveChannel | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ country });
      if (category) params.set("category", category);
      if (search) params.set("search", search);

      try {
        const res = await fetch(`/api/live-tv/channels?${params}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Error al cargar canales");

        const data = (await res.json()) as {
          channels: LiveChannel[];
          categories: IptvCategory[];
        };

        setChannels(data.channels);
        setCategories(data.categories);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("No se pudieron cargar los canales en vivo.");
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [country, category, search]);

  const hasFilters = Boolean(category || search);

  return (
    <FadeIn className="px-8 py-8">
      <PageHeader
        title="TV en Vivo"
        subtitle="Canales en directo vía IPTV-org"
        count={loading ? undefined : channels.length}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-zinc-300 outline-none focus:border-gold-500/50"
        >
          {LIVE_COUNTRY_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.flag} {opt.name}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value || null)}
          className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-zinc-300 outline-none focus:border-gold-500/50"
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value || null)}
            placeholder="Buscar canal..."
            className="w-full rounded-lg border border-border-subtle bg-surface-raised py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-gold-500/50"
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setCategory(null);
              setSearch(null);
            }}
            className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-gold-500"
          >
            <X size={14} />
            Limpiar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={32} className="animate-spin text-gold-500" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
          {error}
        </div>
      ) : channels.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface-raised px-4 py-16 text-center">
          <RefreshCw size={24} className="mx-auto mb-3 text-zinc-600" />
          <p className="text-sm text-zinc-400">No hay canales disponibles para estos filtros.</p>
        </div>
      ) : (
        <FadeInStagger className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {channels.map((channel) => (
            <StaggerItem key={channel.id}>
              <LiveChannelCard channel={channel} onPlay={setPlaying} />
            </StaggerItem>
          ))}
        </FadeInStagger>
      )}

      {playing && <LiveTvPlayer channel={playing} onClose={() => setPlaying(null)} />}
    </FadeIn>
  );
}

export function LiveTvView() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center px-8 py-24">
          <Loader2 size={32} className="animate-spin text-gold-500" />
        </div>
      }
    >
      <LiveTvContent />
    </Suspense>
  );
}
