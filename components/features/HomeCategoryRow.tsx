"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { ContentItem } from "@/lib/data";
import type { HomeCategory } from "@/lib/home-categories";
import { ContentCard } from "@/components/ui/ContentCard";
import { cn } from "@/lib/utils";

interface HomeCategoryRowProps {
  category: HomeCategory;
}

export function HomeCategoryRow({ category }: HomeCategoryRowProps) {
  const [pages, setPages] = useState<ContentItem[][]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentItems = pages[pageIndex] ?? [];
  const canGoBack = pageIndex > 0;
  const seenIds = useMemo(() => pages.flat().map((item) => item.id), [pages]);

  const loadPage = useCallback(
    async (random: boolean) => {
      const params = new URLSearchParams({
        genre: category.genre,
        type: category.type,
        random: random ? "1" : "0",
      });

      if (random && seenIds.length > 0) {
        params.set("exclude", seenIds.join(","));
      }

      const res = await fetch(`/api/home/category?${params.toString()}`);
      const data = (await res.json()) as { items?: ContentItem[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo cargar la categoría");
      }

      return data.items ?? [];
    },
    [category.genre, category.type, seenIds],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      setPages([]);
      setPageIndex(0);

      try {
        const params = new URLSearchParams({
          genre: category.genre,
          type: category.type,
          random: "0",
        });

        const res = await fetch(`/api/home/category?${params.toString()}`);
        const data = (await res.json()) as { items?: ContentItem[]; error?: string };

        if (!res.ok) {
          throw new Error(data.error ?? "No se pudo cargar la categoría");
        }

        if (cancelled) return;

        const items = data.items ?? [];
        if (items.length > 0) {
          setPages([items]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [category.id, category.genre, category.type]);

  async function handleNext() {
    if (fetching) return;

    if (pageIndex < pages.length - 1) {
      setPageIndex((index) => index + 1);
      return;
    }

    setFetching(true);
    setError(null);

    try {
      const items = await loadPage(true);
      if (items.length === 0) return;

      setPages((prev) => [...prev, items]);
      setPageIndex((index) => index + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar más títulos");
    } finally {
      setFetching(false);
    }
  }

  function handlePrev() {
    if (pageIndex > 0) {
      setPageIndex((index) => index - 1);
    }
  }

  if (loading) {
    return (
      <section className="animate-pulse">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-40 rounded-lg bg-white/5" />
          <div className="flex gap-2">
            <div className="h-9 w-9 rounded-full bg-white/5" />
            <div className="h-9 w-9 rounded-full bg-white/5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-[2/3] rounded-2xl bg-white/5" />
          ))}
        </div>
      </section>
    );
  }

  if (currentItems.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate text-lg font-bold text-white">{category.title}</h2>
          {category.badge && (
            <span className="shrink-0 rounded bg-gold-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              {category.badge}
            </span>
          )}
          <span className="hidden text-xs text-zinc-500 sm:inline">
            Página {pageIndex + 1}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canGoBack || fetching}
            aria-label="Ver página anterior"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border transition-all",
              canGoBack
                ? "border-white/15 bg-white/5 text-white hover:border-gold-500/40 hover:bg-gold-500/10 hover:text-gold-400"
                : "cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-600",
            )}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={fetching}
            aria-label="Ver más títulos"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all hover:border-gold-500/40 hover:bg-gold-500/10 hover:text-gold-400 disabled:cursor-wait disabled:opacity-60"
          >
            {fetching ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${category.id}-${pageIndex}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          {currentItems.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p className="mt-3 text-xs text-zinc-500">{error}</p>
      )}
    </section>
  );
}
