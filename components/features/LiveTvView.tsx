"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useQueryState } from "nuqs";
import { RefreshCw, Radio, Trophy } from "lucide-react";
import { LiveTvChannelGrid } from "@/components/features/LiveTvChannelGrid";
import { LiveTvFilters } from "@/components/features/LiveTvFilters";
import { LiveTvResultsBar } from "@/components/features/LiveTvResultsBar";
import { LiveTvFootballSection } from "@/components/features/LiveTvFootballSection";
import { LiveTvPlayer } from "@/components/features/LiveTvPlayer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { FadeIn } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import { isAllCountries, normalizeCountryCode } from "@/lib/iptv/constants";
import type { IptvCategory, LiveChannel } from "@/lib/iptv/types";
import { liveTvSearchParams } from "@/lib/nuqs/live-parsers";

type LiveSection = "channels" | "football";

function LiveTvTabs({
  section,
  onChange,
}: {
  section: LiveSection;
  onChange: (section: LiveSection) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5">
      <button
        type="button"
        onClick={() => onChange("channels")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          section === "channels"
            ? "bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/30"
            : "bg-white/[0.04] text-zinc-400 hover:text-white",
        )}
      >
        <Radio size={14} />
        Canales TV
      </button>
      <button
        type="button"
        onClick={() => onChange("football")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          section === "football"
            ? "bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/30"
            : "bg-white/[0.04] text-zinc-400 hover:text-white",
        )}
      >
        <Trophy size={14} />
        Fútbol en vivo
      </button>
    </div>
  );
}

function LiveTvChannelsSection() {
  const [country] = useQueryState("country", liveTvSearchParams.country);
  const [category] = useQueryState("category", liveTvSearchParams.category);
  const [stream] = useQueryState("stream", liveTvSearchParams.stream);
  const [hd] = useQueryState("hd", liveTvSearchParams.hd);
  const [search] = useQueryState("search", liveTvSearchParams.search);

  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [categories, setCategories] = useState<IptvCategory[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<LiveChannel | null>(null);
  const filterKeyRef = useRef("");

  useEffect(() => {
    const controller = new AbortController();
    const filterKey = `${country}|${category}|${stream}|${hd}|${search}`;
    const filtersChanged = filterKeyRef.current !== filterKey;
    filterKeyRef.current = filterKey;

    if (filtersChanged) {
      setPage(1);
      if (page !== 1) return;
    }

    const append = page > 1 && !filtersChanged;

    async function load() {
      if (append) setLoadingMore(true);
      else setLoading(true);

      setError(null);

      const params = new URLSearchParams({
        country: normalizeCountryCode(country),
        page: String(page),
      });
      if (category) params.set("category", category);
      if (stream === "all") params.set("stream", "all");
      if (hd) params.set("hd", "1");
      if (search) params.set("search", search);

      try {
        const res = await fetch(`/api/live-tv/channels?${params}`, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const data = (await res.json()) as {
          channels?: LiveChannel[];
          categories?: IptvCategory[];
          total?: number;
          hasNext?: boolean;
          error?: string;
        };

        if (controller.signal.aborted) return;

        if (!res.ok) {
          throw new Error(data.error ?? "Error al cargar canales");
        }

        setChannels((current) =>
          append ? [...current, ...(data.channels ?? [])] : (data.channels ?? []),
        );
        setCategories(data.categories ?? []);
        setTotal(data.total ?? 0);
        setHasNext(Boolean(data.hasNext));
      } catch (err) {
        if (controller.signal.aborted) return;
        if ((err as Error).name !== "AbortError") {
          setError("No se pudieron cargar los canales en vivo.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [country, category, stream, hd, search, page]);

  return (
    <>
      <LiveTvFilters categories={categories} />

      {loading ? (
        <div className="py-16">
          <StreamingLoader label="Cargando canales en vivo..." />
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
        <>
          <LiveTvResultsBar
            showing={channels.length}
            total={total}
            hint={
              stream !== "all"
                ? "Solo señal activa · desactiva el filtro para ver offline/bloqueados"
                : isAllCountries(country) && !search && !category
                  ? "Usa la búsqueda o elige un país para acotar resultados"
                  : undefined
            }
          />

          <LiveTvChannelGrid channels={channels} onPlay={setPlaying} />

          {hasNext && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => setPage((current) => current + 1)}
                className={cn(
                  "rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                  "bg-gold-500/15 text-gold-400 ring-1 ring-gold-500/30 hover:bg-gold-500/25",
                  loadingMore && "opacity-60",
                )}
              >
                {loadingMore ? "Cargando..." : "Cargar más canales"}
              </button>
            </div>
          )}
        </>
      )}

      {playing && (
        <LiveTvPlayer
          channel={playing}
          onClose={() => setPlaying(null)}
          onChannelChange={setPlaying}
        />
      )}

    </>
  );
}

function LiveTvContent() {
  const [sectionParam, setSectionParam] = useQueryState("section", liveTvSearchParams.section);
  const section: LiveSection = sectionParam === "football" ? "football" : "channels";

  return (
    <FadeIn className="px-8 py-8">
      <PageHeader
        title="En Vivo"
        subtitle={
          section === "football"
            ? "Deportes en directo — fútbol, ligas y más"
            : "Televisión en directo de todo el mundo"
        }
      />

      <LiveTvTabs
        section={section}
        onChange={(next) => void setSectionParam(next === "channels" ? null : next)}
      />

      {section === "football" ? <LiveTvFootballSection /> : <LiveTvChannelsSection />}
    </FadeIn>
  );
}

export function LiveTvView() {
  return (
    <Suspense
      fallback={
        <div className="px-8 py-16">
          <StreamingLoader label="Cargando en vivo..." />
        </div>
      }
    >
      <LiveTvContent />
    </Suspense>
  );
}
