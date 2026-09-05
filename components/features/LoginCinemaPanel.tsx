"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import type { LoginCinemaMovie } from "@/lib/tmdb/types";

const FALLBACK_MOVIES: LoginCinemaMovie[] = [
  {
    id: "fallback-1",
    title: "Cine inmersivo",
    poster:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=85&auto=format&fit=crop",
    backdrop:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=85&auto=format&fit=crop",
  },
  {
    id: "fallback-2",
    title: "Blockbuster",
    poster:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=85&auto=format&fit=crop",
    backdrop:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=85&auto=format&fit=crop",
  },
  {
    id: "fallback-3",
    title: "Noche de película",
    poster:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=85&auto=format&fit=crop",
    backdrop:
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&q=85&auto=format&fit=crop",
  },
  {
    id: "fallback-4",
    title: "Pantalla grande",
    poster:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&q=85&auto=format&fit=crop",
    backdrop:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&q=85&auto=format&fit=crop",
  },
];

const FLOATING_LAYOUT = [
  { className: "left-[8%] top-[18%] h-36 w-24 sm:h-44 sm:w-28", depth: 0.72, delay: 0 },
  { className: "right-[10%] top-[22%] h-32 w-20 sm:h-40 sm:w-24", depth: 0.78, delay: 0.4 },
  { className: "left-[14%] bottom-[20%] h-28 w-20 sm:h-36 sm:w-24", depth: 0.65, delay: 0.8 },
  { className: "right-[16%] bottom-[18%] h-40 w-28 sm:h-48 sm:w-32", depth: 0.85, delay: 1.1 },
  { className: "left-[38%] top-[8%] h-24 w-16 sm:h-28 sm:w-20", depth: 0.55, delay: 0.2 },
  { className: "right-[32%] bottom-[10%] h-24 w-16 sm:h-32 sm:w-20", depth: 0.6, delay: 1.4 },
];

interface LoginCinemaPanelProps {
  movies?: LoginCinemaMovie[];
}

export function LoginCinemaPanel({ movies = [] }: LoginCinemaPanelProps) {
  const catalog = movies.length >= 4 ? movies : FALLBACK_MOVIES;
  const featured = useMemo(() => catalog.slice(0, 4), [catalog]);
  const floating = useMemo(() => {
    const pool = catalog.length >= 10 ? catalog.slice(4, 10) : catalog;
    return FLOATING_LAYOUT.map((layout, index) => ({
      ...layout,
      movie: pool[index % pool.length],
    }));
  }, [catalog]);

  const [active, setActive] = useState(0);
  const current = featured[active] ?? featured[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % featured.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [featured.length]);

  return (
    <div className="relative hidden min-h-screen overflow-hidden bg-black lg:block">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={current.backdrop}
            alt={current.title}
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />

      <div className="relative z-10 flex h-full flex-col p-8 xl:p-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 backdrop-blur-sm transition-colors hover:border-gold-500/40 hover:text-gold-400"
            aria-label="Volver al inicio"
          >
            <ArrowLeft size={18} />
          </Link>
          <Logo size="sm" align="left" />
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          {floating.map((poster, index) => (
            <motion.div
              key={`${poster.movie.id}-${index}`}
              className={`absolute overflow-hidden rounded-xl border border-white/15 shadow-2xl ${poster.className}`}
              initial={{ opacity: 0, y: 40, scale: poster.depth }}
              animate={{
                opacity: 1,
                y: [0, -12, 0],
                scale: [poster.depth, poster.depth + 0.12, poster.depth],
              }}
              transition={{
                opacity: { duration: 0.8, delay: poster.delay },
                y: {
                  duration: 5 + index * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: poster.delay,
                },
                scale: {
                  duration: 5 + index * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: poster.delay,
                },
              }}
              style={{ zIndex: Math.round(poster.depth * 20) }}
            >
              <Image
                src={poster.movie.poster}
                alt={poster.movie.title}
                fill
                className="object-cover"
                sizes="200px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </motion.div>
          ))}

          <motion.div
            className="relative z-20 h-[340px] w-[230px] overflow-hidden rounded-2xl border-2 border-gold-500/30 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:h-[380px] sm:w-[260px]"
            animate={{ y: [0, -10, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.06 }}
                transition={{ duration: 0.9 }}
                className="absolute inset-0"
              >
                <Image
                  src={current.poster}
                  alt={current.title}
                  fill
                  className="object-cover"
                  sizes="260px"
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-400">
                En tendencia
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-medium text-white">{current.title}</p>
            </div>
          </motion.div>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Miles de películas y series te esperan en LumixTV
        </p>
      </div>
    </div>
  );
}
