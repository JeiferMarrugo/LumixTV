"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Info, Play, Star } from "lucide-react";
import type { TmdbFeatured } from "@/lib/tmdb/types";
import { contentHref } from "@/lib/content-id";
import { cn } from "@/lib/utils";

type FeaturedItem = TmdbFeatured & { id?: string };

const ROTATION_MS = 7000;

interface HomeHeroProps {
  featuredList: FeaturedItem[];
  source: "catalog" | "tmdb";
}

export function HomeHero({ featuredList, source }: HomeHeroProps) {
  const router = useRouter();
  const [activeFeatured, setActiveFeatured] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const featured = featuredList[activeFeatured] ?? null;
  const total = featuredList.length;

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      setActiveFeatured((index + total) % total);
      setProgress(0);
    },
    [total],
  );

  useEffect(() => {
    if (total <= 1 || paused) return;

    const started = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - started;
      setProgress(Math.min(1, elapsed / ROTATION_MS));
      if (elapsed < ROTATION_MS) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    const timer = window.setTimeout(() => {
      setActiveFeatured((current) => (current + 1) % total);
      setProgress(0);
    }, ROTATION_MS);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [activeFeatured, total, paused]);

  const handleGoToDetail = useCallback(
    (item: FeaturedItem) => {
      if (!item.id) return;
      router.push(contentHref(item.id));
    },
    [router],
  );

  if (!featured) return null;

  const ratingValue = Number.parseFloat(featured.rating);
  const showRating = Number.isFinite(ratingValue) && ratingValue > 0;

  return (
    <section
      className="relative isolate min-h-[560px] h-[min(88vh,920px)] overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={featured.id ?? featured.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: 1.04 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.8, ease: "easeOut" },
            scale: { duration: ROTATION_MS / 1000, ease: "linear" },
          }}
          className="absolute inset-0"
        >
          <Image
            src={featured.image}
            alt={featured.title}
            fill
            priority={activeFeatured === 0}
            quality={100}
            unoptimized
            className="object-cover object-center brightness-[1.05] saturate-[1.08]"
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-black/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/92 via-black/40 to-black/5" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-24 pt-28 sm:px-10 lg:px-16 lg:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${featured.id}-content`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
              <span className="font-semibold uppercase tracking-[0.18em] text-gold-400">
                {featured.genre}
              </span>
              <span className="text-zinc-600">·</span>
              <span>{featured.year}</span>
              {showRating && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span className="inline-flex items-center gap-1 text-zinc-300">
                    <Star size={13} className="fill-gold-400 text-gold-400" />
                    {ratingValue.toFixed(1)}
                  </span>
                </>
              )}
              {!showRating && featured.rating && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span>{featured.rating}</span>
                </>
              )}
              {source === "catalog" && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500">Destacado</span>
                </>
              )}
            </p>

            <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
              {featured.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-[1.05rem]">
              {featured.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {featured.id && (
                <button
                  type="button"
                  onClick={() => handleGoToDetail(featured)}
                  className="group inline-flex min-w-[148px] items-center justify-center gap-2.5 rounded-lg bg-gold-500 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-gold-400"
                >
                  <Play size={18} fill="currentColor" />
                  Ver ahora
                </button>
              )}
              {featured.id && (
                <Link
                  href={contentHref(featured.id)}
                  className="inline-flex items-center gap-2.5 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <Info size={18} />
                  Más info
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {total > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-6 sm:px-10 lg:px-16">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {featuredList.map((item, index) => (
                <button
                  key={item.id ?? `${item.title}-${index}`}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Ver destacado ${index + 1}: ${item.title}`}
                  className={cn(
                    "relative h-1 overflow-hidden rounded-full transition-all duration-300",
                    index === activeFeatured ? "w-10 bg-white/20" : "w-1.5 bg-white/30 hover:bg-white/50",
                  )}
                >
                  {index === activeFeatured && (
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-gold-500"
                      style={{ width: `${Math.max(progress * 100, 8)}%` }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="mr-1 hidden text-xs tabular-nums text-zinc-500 sm:inline">
                {activeFeatured + 1} / {total}
              </span>
              <button
                type="button"
                onClick={() => goTo(activeFeatured - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:border-gold-500/30 hover:text-gold-400"
                aria-label="Anterior destacado"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => goTo(activeFeatured + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:border-gold-500/30 hover:text-gold-400"
                aria-label="Siguiente destacado"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
