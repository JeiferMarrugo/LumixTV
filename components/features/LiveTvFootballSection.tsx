"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryState } from "nuqs";
import { RefreshCw, Trophy } from "lucide-react";
import { LiveTvChannelGrid } from "@/components/features/LiveTvChannelGrid";
import { LiveTvFilters } from "@/components/features/LiveTvFilters";
import { LiveTvResultsBar } from "@/components/features/LiveTvResultsBar";
import { LiveTvPlayer } from "@/components/features/LiveTvPlayer";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { isAllCountries, LIVE_COUNTRY_OPTIONS, normalizeCountryCode } from "@/lib/iptv/constants";
import type { LiveChannel } from "@/lib/iptv/types";
import { liveTvSearchParams } from "@/lib/nuqs/live-parsers";
import { cn } from "@/lib/utils";

interface LiveTvFootballSectionProps {
  autoFocus?: boolean;
}

export function LiveTvFootballSection({ autoFocus = true }: LiveTvFootballSectionProps) {
  const [country] = useQueryState("country", liveTvSearchParams.country);
  const [stream] = useQueryState("stream", liveTvSearchParams.stream);
  const [hd] = useQueryState("hd", liveTvSearchParams.hd);
  const [search] = useQueryState("search", liveTvSearchParams.search);

  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<LiveChannel | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const filterKeyRef = useRef("");

  useEffect(() => {
    if (!autoFocus) return;

    const controller = new AbortController();
    const filterKey = `${country}|${stream}|${hd}|${search}`;
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
        football: "1",
        page: String(page),
      });
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
          total?: number;
          hasNext?: boolean;
          error?: string;
        };

        if (controller.signal.aborted) return;

        if (!res.ok) {
          throw new Error(data.error ?? "Error al cargar canales deportivos");
        }

        setChannels((current) =>
          append ? [...current, ...(data.channels ?? [])] : (data.channels ?? []),
        );
        setTotal(data.total ?? 0);
        setHasNext(Boolean(data.hasNext));
      } catch (err) {
        if (controller.signal.aborted) return;
        if ((err as Error).name !== "AbortError") {
          setError("No se pudieron cargar los canales deportivos.");
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
  }, [autoFocus, country, stream, hd, search, page, reloadToken]);

  const countryLabel = isAllCountries(country)
    ? "Todos los países"
    : (LIVE_COUNTRY_OPTIONS.find((opt) => opt.code === country)?.name ?? country);

  return (
    <>
      <LiveTvFilters
        hideCategories
        searchPlaceholder="Buscar deportes en todos los países (ESPN, Win Sports, TyC...)"
      />

      {loading ? (
        <div className="py-16">
          <StreamingLoader label="Cargando canales deportivos..." />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
          <Trophy size={24} className="mx-auto mb-3 opacity-60" />
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setReloadToken((value) => value + 1);
            }}
            className="mt-4 rounded-full bg-gold-500/15 px-4 py-2 text-sm font-medium text-gold-400 ring-1 ring-gold-500/30"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <LiveTvResultsBar
            showing={channels.length}
            total={total}
            hint={countryLabel}
          />

          {channels.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-surface-raised px-4 py-16 text-center">
              <RefreshCw size={24} className="mx-auto mb-3 text-zinc-600" />
              <p className="text-sm text-zinc-400">
                No hay canales deportivos para {countryLabel}. Prueba 🌎 Todos, otro país o busca
                &quot;ESPN&quot; o &quot;Win Sports&quot;.
              </p>
            </div>
          ) : (
            <>
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
