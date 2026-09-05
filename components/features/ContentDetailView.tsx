"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Play, Star, Tv } from "lucide-react";
import type { ContentDetail } from "@/lib/content-id";
import { useAppStore } from "@/lib/store/use-app-store";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { FadeIn } from "@/components/ui/motion";

interface ContentDetailViewProps {
  id: string;
  autoPlay?: boolean;
}

export function ContentDetailView({ id, autoPlay = false }: ContentDetailViewProps) {
  const startWatching = useAppStore((s) => s.startWatching);
  const savedProgress = useAppStore((s) =>
    s.continueWatching.find((item) => item.id === id),
  );

  const [detail, setDetail] = useState<ContentDetail | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(autoPlay);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/content/${encodeURIComponent(id)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          detail?: ContentDetail;
          trailerKey?: string | null;
          error?: string;
        };

        if (!res.ok) throw new Error("No se pudo cargar el contenido");

        setDetail(data.detail ?? null);
        setTrailerKey(data.trailerKey ?? null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("No se pudo cargar este título.");
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!loading && detail && autoPlay) {
      startWatching({
        id: detail.id,
        title: detail.title,
        image: detail.poster,
        progress: savedProgress?.progress ?? 5,
      });
      if (trailerKey) setPlaying(true);
    }
  }, [loading, detail, autoPlay, trailerKey, startWatching, savedProgress?.progress]);

  function handlePlay() {
    if (!detail) return;

    startWatching({
      id: detail.id,
      title: detail.title,
      image: detail.poster,
      progress: savedProgress?.progress ?? 5,
    });

    if (trailerKey) {
      setPlaying(true);
      return;
    }

    setPlaying(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <StreamingLoader label="Abriendo la cartelera..." />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-zinc-400">{error ?? "Contenido no encontrado."}</p>
        <Link
          href="/"
          className="rounded-lg border border-border-subtle px-4 py-2 text-sm text-zinc-300 hover:border-gold-500/50"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const typeLabel =
    detail.type === "series" ? "Serie" : detail.type === "anime" ? "Anime" : "Película";

  return (
    <div>
      <section className="relative min-h-[420px] overflow-hidden">
        <Image
          src={detail.backdrop}
          alt={detail.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <FadeIn className="relative mx-auto flex max-w-6xl gap-8 px-8 py-10">
          <Link
            href="/"
            className="absolute left-8 top-8 flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-gold-400"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>

          <div className="relative mt-10 h-64 w-44 shrink-0 overflow-hidden rounded-2xl border border-gold-500/20 shadow-[0_16px_48px_rgba(0,0,0,0.5)] sm:h-72 sm:w-48">
            <Image
              src={detail.poster}
              alt={detail.title}
              fill
              className="object-cover"
              sizes="192px"
            />
          </div>

          <div className="mt-10 min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-gold-500/15 px-3 py-1 text-xs font-semibold text-gold-400">
                {typeLabel}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                {detail.year}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-gold-400">
                <Star size={12} className="fill-gold-400" />
                {detail.rating.toFixed(1)}
              </span>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-wide text-white sm:text-5xl">
              {detail.title}
            </h1>

            {detail.tagline && (
              <p className="mt-2 text-sm italic text-zinc-400">{detail.tagline}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {detail.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400">
              {detail.runtime ? (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {detail.runtime} min
                </span>
              ) : null}
              {detail.seasons ? (
                <span className="flex items-center gap-1.5">
                  <Tv size={14} />
                  {detail.seasons} temporada{detail.seasons > 1 ? "s" : ""}
                  {detail.episodes ? ` · ${detail.episodes} eps.` : ""}
                </span>
              ) : null}
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-300">
              {detail.overview}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePlay}
                className="flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-gold-400"
              >
                <Play size={18} fill="currentColor" />
                {trailerKey
                  ? savedProgress
                    ? "Continuar tráiler"
                    : "Ver tráiler"
                  : savedProgress
                    ? "Continuar"
                    : "Reproducir"}
              </button>
              {savedProgress && (
                <span className="flex items-center text-xs text-zinc-500">
                  Progreso: {savedProgress.progress}%
                </span>
              )}
            </div>

            {!trailerKey && (
              <p className="mt-4 max-w-2xl text-xs leading-relaxed text-zinc-500">
                Por ahora puedes ver la ficha y el tráiler cuando esté disponible. La
                reproducción completa de la película o serie llegará en una próxima
                actualización.
              </p>
            )}
          </div>
        </FadeIn>
      </section>

      {playing && trailerKey && (
        <section className="border-t border-white/5 bg-black px-8 py-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">Tráiler oficial</h2>
              <span className="rounded-full bg-gold-500/15 px-3 py-1 text-xs font-medium text-gold-400">
                Vista previa
              </span>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-gold-500/20 bg-black shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                title={`Tráiler de ${detail.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <p className="mt-3 text-center text-xs text-zinc-500">
              Estás viendo el tráiler oficial. La película o serie completa aún no está
              disponible en LumixTV.
            </p>
          </div>
        </section>
      )}

      {playing && !trailerKey && (
        <section className="border-t border-white/5 px-8 py-10 text-center">
          <p className="text-sm text-zinc-500">
            Guardado en Continuar viendo. Este título no tiene tráiler disponible por ahora.
          </p>
        </section>
      )}
    </div>
  );
}
