"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Info, Play, Sparkles, Star } from "lucide-react";
import type { TmdbFeatured } from "@/lib/tmdb/types";
import { contentHref } from "@/lib/content-id";
import { isPlaceholderHeroDescription, isValidHeroYear } from "@/lib/hero-utils";
import { cn } from "@/lib/utils";

type FeaturedItem = TmdbFeatured & { id?: string };

const ROTATION_MS = 7000;

interface HomeHeroProps {
  featuredList: FeaturedItem[];
  source: "catalog" | "tmdb";
}

function HeroBadge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "gold" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        variant === "gold" &&
          "border border-gold-500/35 bg-gold-500/12 text-gold-300 shadow-[0_0_20px_rgba(212,160,23,0.12)]",
        variant === "default" &&
          "border border-white/12 bg-white/[0.06] text-zinc-200 backdrop-blur-sm",
        variant === "muted" && "border border-white/8 bg-black/30 text-zinc-400",
      )}
    >
      {children}
    </span>
  );
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
  const hasRealDescription = !isPlaceholderHeroDescription(featured.description);

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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/95 via-black/55 to-black/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-24 pt-28 sm:px-10 lg:px-16 lg:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${featured.id}-content`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <HeroBadge variant="gold">{featured.genre}</HeroBadge>
              {isValidHeroYear(featured.year) && (
                <HeroBadge variant="muted">{featured.year}</HeroBadge>
              )}
              {featured.quality && <HeroBadge variant="default">{featured.quality}</HeroBadge>}
              {showRating && (
                <HeroBadge variant="default">
                  <Star size={11} className="mr-1 fill-gold-400 text-gold-400" />
                  {ratingValue.toFixed(1)}
                </HeroBadge>
              )}
              {source === "catalog" && (
                <HeroBadge variant="default">
                  <Sparkles size={11} className="mr-1 text-gold-400" />
                  Destacado
                </HeroBadge>
              )}
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-[1.06] tracking-tight text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.65)] sm:text-5xl lg:text-[3.5rem]">
              {featured.title}
            </h1>

            {featured.tagline && (
              <p className="mt-3 max-w-xl text-base italic leading-snug text-gold-300/90 sm:text-lg">
                “{featured.tagline}”
              </p>
            )}

            <div className="mt-6 max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-500/70 to-transparent" />
              <div className="px-5 py-4 sm:px-6 sm:py-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Sinopsis
                </p>
                <p
                  className={cn(
                    "text-[15px] leading-[1.7] sm:text-base",
                    hasRealDescription ? "text-zinc-200" : "text-zinc-400",
                  )}
                >
                  {hasRealDescription
                    ? featured.description
                    : "Explora este título en LumixTV y disfrútalo en streaming."}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {featured.id && (
                <button
                  type="button"
                  onClick={() => handleGoToDetail(featured)}
                  className="group inline-flex min-w-[148px] items-center justify-center gap-2.5 rounded-xl bg-gold-500 px-6 py-3.5 text-sm font-bold text-black shadow-[0_8px_32px_rgba(212,160,23,0.35)] transition-all hover:bg-gold-400 hover:shadow-[0_12px_36px_rgba(212,160,23,0.45)]"
                >
                  <Play size={18} fill="currentColor" />
                  Ver ahora
                </button>
              )}
              {featured.id && (
                <Link
                  href={contentHref(featured.id)}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/10"
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
