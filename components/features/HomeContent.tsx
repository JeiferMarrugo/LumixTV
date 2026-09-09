"use client";

import { useEffect, useState } from "react";
import type { TmdbFeatured } from "@/lib/tmdb/types";
import { HomeHero } from "@/components/features/HomeHero";
import { HomeCategoryRow } from "@/components/features/HomeCategoryRow";
import { HomeRecommendationSections } from "@/components/features/HomeRecommendationSections";
import { DraggableContinueWatching } from "@/components/features/DraggableContinueWatching";
import { HOME_CATEGORIES } from "@/lib/home-categories";

type FeaturedItem = TmdbFeatured & { id?: string };

function HeroSkeleton() {
  return (
    <section className="relative h-[min(78vh,820px)] min-h-[420px] overflow-hidden bg-black">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-950 via-zinc-900 to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-16 pt-24 sm:px-8">
        <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
        <div className="mt-4 h-10 w-2/3 max-w-xl animate-pulse rounded-lg bg-white/10 sm:h-14" />
        <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded bg-white/5" />
        <div className="mt-2 h-4 w-4/5 max-w-xl animate-pulse rounded bg-white/5" />
        <div className="mt-8 flex gap-3">
          <div className="h-11 w-36 animate-pulse rounded-lg bg-gold-500/20" />
          <div className="h-11 w-32 animate-pulse rounded-lg bg-white/10" />
        </div>
      </div>
    </section>
  );
}

export function HomeContent() {
  const [featuredList, setFeaturedList] = useState<FeaturedItem[]>([]);
  const [source, setSource] = useState<"catalog" | "tmdb">("tmdb");
  const [heroLoading, setHeroLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHero() {
      try {
        let res = await fetch("/api/vimeus/home", { signal: controller.signal });

        if (res.status === 503 || res.status === 502) {
          res = await fetch("/api/tmdb/trending", { signal: controller.signal });
          setSource("tmdb");
        } else {
          setSource("catalog");
        }

        const data = (await res.json()) as {
          featured?: FeaturedItem | null;
          featuredList?: FeaturedItem[];
          error?: string;
        };

        if (!res.ok) throw new Error("No se pudieron cargar las tendencias");
        if (controller.signal.aborted) return;

        const list =
          data.featuredList?.length
            ? data.featuredList
            : data.featured
              ? [data.featured]
              : [];

        setFeaturedList(list);
      } catch (err) {
        if (controller.signal.aborted) return;
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Error al cargar contenido");
        }
      } finally {
        if (!controller.signal.aborted) {
          setHeroLoading(false);
        }
      }
    }

    void loadHero();
    return () => controller.abort();
  }, []);

  return (
    <div>
      {heroLoading ? (
        <HeroSkeleton />
      ) : featuredList.length > 0 ? (
        <HomeHero featuredList={featuredList} source={source} />
      ) : (
        <section className="flex h-[40vh] min-h-[280px] items-center justify-center px-8">
          <p className="max-w-md text-center text-sm text-zinc-500">
            {error ?? "No hay contenido destacado disponible en este momento."}
          </p>
        </section>
      )}

      {error && featuredList.length > 0 && (
        <p className="px-8 pt-6 text-center text-sm text-zinc-500">
          Algunas secciones no se pudieron cargar. Intenta de nuevo en un momento.
        </p>
      )}

      <div className="space-y-10 px-6 py-10 sm:px-8">
        <DraggableContinueWatching />
        <HomeRecommendationSections />

        {HOME_CATEGORIES.map((category) => (
          <HomeCategoryRow key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
