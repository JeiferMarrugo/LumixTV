"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { useQueryState } from "nuqs";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { searchParams } from "@/lib/nuqs/parsers";
import { contentFiltersSchema } from "@/lib/validations/content";
import type { ContentItem } from "@/lib/data";
import { ContentCard } from "@/components/ui/ContentCard";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContentFilters } from "@/components/features/ContentFilters";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { FadeIn, FadeInStagger, StaggerItem } from "@/components/ui/motion";

interface TmdbCatalogViewProps {
  endpoint: "movies" | "tv";
  title: string;
  subtitle: string;
}

const columns: LegacyColumnDef<ContentItem>[] = [
  {
    accessorKey: "title",
    header: "Título",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-7 overflow-hidden rounded">
          <Image
            src={row.original.image}
            alt={row.original.title}
            fill
            className="object-cover"
            sizes="28px"
          />
        </div>
        <span className="font-medium text-white">{row.original.title}</span>
      </div>
    ),
  },
  { accessorKey: "genre", header: "Género" },
  { accessorKey: "year", header: "Año" },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ getValue }) => (
      <span className="flex items-center gap-1 text-gold-500">
        <Star size={12} className="fill-gold-500" />
        {getValue<number>()}
      </span>
    ),
  },
];

export function TmdbCatalogView({ endpoint, title, subtitle }: TmdbCatalogViewProps) {
  const [q] = useQueryState("q", searchParams.q);
  const [genre] = useQueryState("genre", searchParams.genre);
  const [year] = useQueryState("year", searchParams.year);
  const [minRating] = useQueryState("minRating", searchParams.minRating);
  const [view] = useQueryState("view", searchParams.view);

  const [items, setItems] = useState<ContentItem[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = contentFiltersSchema.safeParse({
    q: q || undefined,
    genre: genre || undefined,
    year: year ?? undefined,
    minRating: minRating ?? undefined,
    view,
  }).data ?? { view: "grid" as const };

  useEffect(() => {
    setPage(1);
  }, [q, genre, year, minRating]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ page: String(page) });
      if (filters.q) params.set("q", filters.q);
      if (filters.genre) params.set("genre", filters.genre);
      if (filters.year) params.set("year", String(filters.year));
      if (filters.minRating) params.set("minRating", String(filters.minRating));

      try {
        const res = await fetch(`/api/tmdb/${endpoint}?${params}`, {
          signal: controller.signal,
        });

        const data = (await res.json()) as {
          items?: ContentItem[];
          genres?: string[];
          totalPages?: number;
          totalResults?: number;
          error?: string;
        };

        if (!res.ok) throw new Error("No se pudo cargar el catálogo");

        setItems(data.items ?? []);
        if (data.genres?.length) setGenres(data.genres);
        setTotalPages(data.totalPages ?? 1);
        setTotalResults(data.totalResults ?? 0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el catálogo.",
          );
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [endpoint, page, filters.q, filters.genre, filters.year, filters.minRating]);

  return (
    <FadeIn className="px-8 py-8">
      <PageHeader
        title={title}
        subtitle={subtitle}
        count={loading ? undefined : totalResults}
      />

      <ContentFilters genres={genres} />

      {loading && <StreamingLoader className="py-16" label="" size="sm" />}

      {error && !loading && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          No se pudo cargar el catálogo. Intenta de nuevo en un momento.
        </div>
      )}

      {!loading && !error && items.length > 0 && view === "table" ? (
        <DataTable data={items} columns={columns} />
      ) : !loading && !error && items.length > 0 ? (
        <FadeInStagger className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <StaggerItem key={item.id}>
              <ContentCard item={item} />
            </StaggerItem>
          ))}
        </FadeInStagger>
      ) : null}

      {!loading && !error && items.length === 0 && (
        <p className="py-12 text-center text-zinc-500">
          No se encontraron resultados con esos filtros.
        </p>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-lg border border-border-subtle px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-gold-500/50 disabled:opacity-40"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </FadeIn>
  );
}
