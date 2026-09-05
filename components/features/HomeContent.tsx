"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, Play } from "lucide-react";
import { featuredContent } from "@/lib/data";
import type { ContentItem } from "@/lib/data";
import type { TmdbFeatured } from "@/lib/tmdb/types";
import { contentHref } from "@/lib/content-id";
import { useAppStore } from "@/lib/store/use-app-store";
import { ContentRow } from "@/components/ui/ContentRow";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { DraggableContinueWatching } from "@/components/features/DraggableContinueWatching";
import { FadeIn } from "@/components/ui/motion";

export function HomeContent() {
  const router = useRouter();
  const startWatching = useAppStore((s) => s.startWatching);
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [series, setSeries] = useState<ContentItem[]>([]);
  const [featured, setFeatured] = useState<TmdbFeatured | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch("/api/tmdb/trending", { signal: controller.signal });
        const data = (await res.json()) as {
          movies?: ContentItem[];
          series?: ContentItem[];
          featured?: TmdbFeatured | null;
          error?: string;
        };

        if (!res.ok) throw new Error("No se pudieron cargar las tendencias");

        setMovies(data.movies ?? []);
        setSeries(data.series ?? []);
        setFeatured(data.featured ?? null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Error al cargar contenido");
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  const hero = featured ?? {
    id: undefined,
    title: featuredContent.title,
    description: featuredContent.description,
    genre: featuredContent.genre,
    year: featuredContent.year,
    rating: featuredContent.rating,
    image: featuredContent.image,
  };

  function handlePlay() {
    const id = featured?.id ?? movies[0]?.id;
    if (!id) return;
    startWatching({
      id,
      title: hero.title,
      image: hero.image,
    });
    router.push(`${contentHref(id)}?play=1`);
  }

  const heroId = featured?.id ?? movies[0]?.id;
  const detailHref = heroId ? contentHref(heroId) : null;

  return (
    <div>
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center bg-surface-raised">
            <StreamingLoader size="lg" label="Calentando el proyector..." />
          </div>
        ) : (
          <>
            <Image
              src={hero.image}
              alt={hero.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

            <FadeIn className="relative flex h-full items-end px-8 pb-16">
              <div className="max-w-xl">
                <div className="mb-4 flex gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {hero.genre}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {hero.year}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {hero.rating}
                  </span>
                </div>

                <h1 className="font-display text-5xl font-bold tracking-wide text-white">
                  {hero.title}
                </h1>

                <p className="mt-4 text-sm leading-relaxed text-zinc-300">{hero.description}</p>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handlePlay}
                    className="flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-gold-400"
                  >
                    <Play size={18} fill="currentColor" />
                    Reproducir
                  </button>
                  {detailHref ? (
                    <Link
                      href={detailHref}
                      className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    >
                      <Info size={18} />
                      Más Info
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white/50"
                    >
                      <Info size={18} />
                      Más Info
                    </button>
                  )}
                </div>
              </div>
            </FadeIn>
          </>
        )}
      </section>

      {error && (
        <p className="px-8 pt-6 text-center text-sm text-zinc-500">
          No se pudieron cargar las tendencias. Intenta de nuevo en un momento.
        </p>
      )}

      <div className="space-y-10 px-8 py-10">
        <DraggableContinueWatching />
        {!loading && movies.length > 0 && (
          <ContentRow title="Tendencias" items={movies} badge="TOP 10" />
        )}
        {!loading && series.length > 0 && (
          <ContentRow title="Series populares" items={series} />
        )}
      </div>
    </div>
  );
}
