"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Film, Sparkles, Star, Tv } from "lucide-react";
import type { ContentItem } from "@/lib/data";
import { contentHref } from "@/lib/content-id";
import { cn } from "@/lib/utils";

export interface SearchResultsPayload {
  query: string;
  movies: ContentItem[];
  series: ContentItem[];
  anime: ContentItem[];
  total: number;
  totals?: {
    movies: number;
    series: number;
    anime: number;
  };
  meta?: {
    moviesFetched?: number;
    moviesTotal?: number;
    tvFetched?: number;
    tvTotal?: number;
    hasMoreMovies?: boolean;
    hasMoreTv?: boolean;
  };
  source?: "vimeus" | "tmdb";
}

const TYPE_META = {
  movie: { label: "Película", icon: Film, tone: "text-sky-700 bg-sky-500/10 border-sky-500/25 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20" },
  series: { label: "Serie", icon: Tv, tone: "text-violet-700 bg-violet-500/10 border-violet-500/25 dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/20" },
  anime: { label: "Anime", icon: Sparkles, tone: "text-pink-700 bg-pink-500/10 border-pink-500/25 dark:text-pink-400 dark:bg-pink-500/10 dark:border-pink-500/20" },
} as const;

function ResultRow({ item, onSelect }: { item: ContentItem; onSelect?: () => void }) {
  const router = useRouter();
  const meta = TYPE_META[item.type === "anime" ? "anime" : item.type === "movie" ? "movie" : "series"];
  const Icon = meta.icon;
  const href = contentHref(item.id);

  return (
    <button
      type="button"
      onClick={() => {
        onSelect?.();
        router.push(href);
      }}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
    >
      <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md bg-zinc-200 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-white/10">
        <Image src={item.image} alt={item.title} fill className="object-cover" sizes="32px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{item.title}</p>
        <p className="truncate text-xs text-zinc-600 dark:text-zinc-500">
          {item.year} · {item.genre}
        </p>
      </div>
      <span
        className={cn(
          "hidden shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex",
          meta.tone,
        )}
      >
        <Icon size={10} />
        {meta.label}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-gold-700 dark:text-gold-500">
        <Star size={11} className="fill-gold-500 text-gold-500" />
        {item.rating}
      </span>
    </button>
  );
}

function ResultSection({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: ContentItem[];
  onSelect?: () => void;
}) {
  if (!items.length) return null;

  return (
    <div className="py-1">
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        {title}
      </p>
      {items.map((item) => (
        <ResultRow key={item.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}

interface SearchResultsDropdownProps {
  results: SearchResultsPayload | null;
  loading: boolean;
  query: string;
  onSelect?: () => void;
  className?: string;
}

export function SearchResultsDropdown({
  results,
  loading,
  query,
  onSelect,
  className,
}: SearchResultsDropdownProps) {
  const router = useRouter();

  if (query.trim().length < 2) return null;

  const hasResults = Boolean(results?.total);

  return (
    <div
      className={cn(
        "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[100] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl",
        "dark:border-white/10 dark:bg-zinc-950/98 dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)]",
        className,
      )}
    >
      {loading && (
        <div className="px-4 py-6 text-center text-sm text-zinc-600 dark:text-zinc-500">Buscando...</div>
      )}

      {!loading && hasResults && results && (
        <div className="max-h-[min(70vh,420px)] overflow-y-auto py-1">
          <ResultSection title="Películas" items={results.movies} onSelect={onSelect} />
          <ResultSection title="Series" items={results.series} onSelect={onSelect} />
          <ResultSection title="Anime" items={results.anime} onSelect={onSelect} />

          <div className="border-t border-zinc-100 px-3 py-2.5 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                onSelect?.();
                router.push(`/buscar?q=${encodeURIComponent(results.query)}`);
              }}
              className="block w-full rounded-lg px-2 py-2 text-center text-xs font-semibold text-gold-700 transition-colors hover:bg-gold-500/10 dark:text-gold-400"
            >
              Ver todos los resultados
            </button>
          </div>
        </div>
      )}

      {!loading && !hasResults && (
        <div className="px-4 py-6 text-center text-sm text-zinc-600 dark:text-zinc-500">
          No encontramos resultados para &ldquo;{query.trim()}&rdquo;
        </div>
      )}
    </div>
  );
}
