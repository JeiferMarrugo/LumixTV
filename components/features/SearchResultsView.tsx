"use client";

import { useEffect, useState } from "react";
import { useQueryState } from "nuqs";
import { searchParams } from "@/lib/nuqs/parsers";
import type { ContentItem } from "@/lib/data";
import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import type { SearchResultsPayload } from "@/components/features/SearchResultsDropdown";
import { FadeIn, FadeInStagger, StaggerItem } from "@/components/ui/motion";

function ResultsGrid({
  title,
  items,
  totalLabel,
}: {
  title: string;
  items: ContentItem[];
  totalLabel?: string;
}) {
  if (!items.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
        {totalLabel && <span className="text-sm text-zinc-600 dark:text-zinc-500">{totalLabel}</span>}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => (
          <StaggerItem key={item.id}>
            <ContentCard item={item} />
          </StaggerItem>
        ))}
      </div>
    </section>
  );
}

function buildSubtitle(results: SearchResultsPayload & { source?: string }) {
  const parts: string[] = [];
  const catalogLabel =
    results.source === "vimeus" ? "disponibles en Vimeus" : "encontrados";

  if (results.movies.length) {
    parts.push(`${results.movies.length} películas ${catalogLabel}`);
  }

  if (results.series.length) {
    parts.push(`${results.series.length} series ${catalogLabel}`);
  }

  if (results.anime.length) {
    parts.push(`${results.anime.length} anime ${catalogLabel}`);
  }

  return parts.join(" · ") || "Películas, series y anime disponibles";
}

export function SearchResultsView() {
  const [q] = useQueryState("q", searchParams.q);
  const [results, setResults] = useState<SearchResultsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = q?.trim() ?? "";

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&full=1`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as SearchResultsPayload & {
          error?: string;
          source?: string;
        };

        if (!res.ok) throw new Error(data.error ?? "No se pudo buscar");

        if (!controller.signal.aborted) {
          setResults(data);
        }
      } catch (err) {
        if (!controller.signal.aborted && (err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Error al buscar");
          setResults(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={query ? `Resultados para “${query}”` : "Buscar"}
        subtitle={
          query
            ? loading
              ? "Buscando en tu catálogo Vimeus..."
              : results
                ? buildSubtitle(results)
                : "Películas, series y anime"
            : "Escribe en la barra superior para buscar contenido"
        }
      />

      {loading && (
        <div className="py-16">
          <StreamingLoader label="Buscando en películas, series y anime de Vimeus..." />
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && query.length >= 2 && results?.total === 0 && (
        <p className="py-12 text-center text-zinc-500">No hay resultados para esta búsqueda.</p>
      )}

      {!loading && results && results.total > 0 && (
        <FadeIn>
          <FadeInStagger className="space-y-10">
            <ResultsGrid
              title="Películas"
              items={results.movies}
              totalLabel={results.movies.length ? `(${results.movies.length})` : undefined}
            />
            <ResultsGrid
              title="Series"
              items={results.series}
              totalLabel={results.series.length ? `(${results.series.length})` : undefined}
            />
            <ResultsGrid
              title="Anime"
              items={results.anime}
              totalLabel={results.anime.length ? `(${results.anime.length})` : undefined}
            />
          </FadeInStagger>
        </FadeIn>
      )}

    </div>
  );
}
