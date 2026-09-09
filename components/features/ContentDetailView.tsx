"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Cast, Clock, Download, Play, Star, Tv } from "lucide-react";
import type { ContentDetail } from "@/lib/content-id";
import { useAppStore } from "@/lib/store/use-app-store";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { FadeIn } from "@/components/ui/motion";
import { CastToTvDialog } from "@/components/features/CastToTvDialog";
import { StreamPlayer } from "@/components/features/StreamPlayer";
import { DetailSelect } from "@/components/ui/DetailSelect";
import { triggerContentDownload } from "@/lib/download-client";

interface EpisodeOption {
  number: number;
  name: string;
}

interface ContentDetailViewProps {
  id: string;
  autoPlay?: boolean;
}

export function ContentDetailView({ id, autoPlay = false }: ContentDetailViewProps) {
  const searchParams = useSearchParams();
  const startWatching = useAppStore((s) => s.startWatching);
  const savedProgress = useAppStore((s) =>
    s.continueWatching.find((item) => item.id === id),
  );

  const [detail, setDetail] = useState<ContentDetail | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [playbackConfigured, setPlaybackConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [season, setSeason] = useState(() => {
    const value = Number(searchParams.get("season"));
    return Number.isFinite(value) && value > 0 ? value : 1;
  });
  const [episode, setEpisode] = useState(() => {
    const value = Number(searchParams.get("episode"));
    return Number.isFinite(value) && value > 0 ? value : 1;
  });
  const [episodes, setEpisodes] = useState<EpisodeOption[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [downloadAvailable, setDownloadAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCast, setShowCast] = useState(false);
  const [playUrl, setPlayUrl] = useState("");
  const [prefetchedEmbedUrl, setPrefetchedEmbedUrl] = useState<string | null>(null);

  const isSeries = detail?.type === "series" || detail?.type === "anime";
  const contentType: "movie" | "series" | "anime" =
    detail?.type === "anime" ? "anime" : detail?.type === "series" ? "series" : "movie";

  useEffect(() => {
    if (!detail) return;
    setPlayUrl(
      `${window.location.origin}/titulo/${encodeURIComponent(id)}?season=${season}&episode=${episode}&type=${contentType}&play=1`,
    );
  }, [id, detail, season, episode, contentType]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      setDetail(null);
      setTrailerKey(null);
      setPlaybackConfigured(false);

      try {
        const res = await fetch(`/api/content/${encodeURIComponent(id)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          detail?: ContentDetail;
          trailerKey?: string | null;
          playbackConfigured?: boolean;
          error?: string;
        };

        if (controller.signal.aborted) return;

        if (!res.ok) throw new Error("No se pudo cargar el contenido");

        setDetail(data.detail ?? null);
        setTrailerKey(data.trailerKey ?? null);
        setPlaybackConfigured(Boolean(data.playbackConfigured));
      } catch (err) {
        if (controller.signal.aborted) return;
        if ((err as Error).name !== "AbortError") {
          setError("No se pudo cargar este título.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!isSeries || !detail) return;

    const controller = new AbortController();

    async function loadEpisodes() {
      setLoadingEpisodes(true);

      try {
        const res = await fetch(
          `/api/content/${encodeURIComponent(id)}/season?season=${season}`,
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        const data = (await res.json()) as { episodes?: EpisodeOption[] };
        const list = data.episodes ?? [];
        setEpisodes(list);
        setEpisode((current) =>
          list.some((ep) => ep.number === current) ? current : (list[0]?.number ?? 1),
        );
      } catch {
        if (!controller.signal.aborted) {
          setEpisodes([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingEpisodes(false);
        }
      }
    }

    void loadEpisodes();
    return () => controller.abort();
  }, [id, isSeries, detail, season]);

  useEffect(() => {
    if (!playbackConfigured || !detail) {
      setDownloadAvailable(false);
      return;
    }

    const controller = new AbortController();

    async function checkDownload() {
      try {
        const params = new URLSearchParams({
          season: String(season),
          episode: String(episode),
          type: contentType,
        });

        const res = await fetch(
          `/api/content/${encodeURIComponent(id)}/download?${params}`,
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        const data = (await res.json()) as { available?: boolean };
        setDownloadAvailable(Boolean(data.available));
      } catch {
        if (!controller.signal.aborted) setDownloadAvailable(false);
      }
    }

    void checkDownload();
    return () => controller.abort();
  }, [id, playbackConfigured, detail, season, episode, contentType]);

  useEffect(() => {
    if (!playbackConfigured || !detail) {
      setPrefetchedEmbedUrl(null);
      return;
    }

    const controller = new AbortController();

    async function prefetchEmbed() {
      try {
        const params = new URLSearchParams({
          season: String(season),
          episode: String(episode),
          type: contentType,
        });

        const res = await fetch(
          `/api/content/${encodeURIComponent(id)}/embed?${params}`,
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        const data = (await res.json()) as { embedUrl?: string | null };
        setPrefetchedEmbedUrl(data.embedUrl ?? null);
      } catch {
        if (!controller.signal.aborted) setPrefetchedEmbedUrl(null);
      }
    }

    void prefetchEmbed();
    return () => controller.abort();
  }, [id, playbackConfigured, detail, season, episode, contentType]);

  function buildWatchPayload(progress = savedProgress?.progress ?? 5) {
    if (!detail) return null;

    const watchContentType: "movie" | "series" | "anime" =
      detail.type === "anime" ? "anime" : detail.type === "series" ? "series" : "movie";
    const seriesLike = watchContentType === "series" || watchContentType === "anime";

    return {
      id: detail.id,
      title: detail.title,
      image: detail.poster,
      genre: detail.genre,
      contentType: watchContentType,
      progress,
      season: seriesLike ? season : undefined,
      episodeNumber: seriesLike ? episode : undefined,
      episode: seriesLike ? `T${season} E${episode}` : undefined,
    };
  }

  useEffect(() => {
    const payload = buildWatchPayload();
    if (!loading && payload && detail && autoPlay && playbackConfigured && prefetchedEmbedUrl) {
      startWatching(payload);
      setPlaying(true);
    } else if (!loading && payload && detail && autoPlay && !playbackConfigured && trailerKey) {
      startWatching(payload);
      setShowTrailer(true);
    }
  }, [
    loading,
    detail,
    autoPlay,
    trailerKey,
    playbackConfigured,
    prefetchedEmbedUrl,
    startWatching,
    savedProgress?.progress,
  ]);

  function handlePlay() {
    if (!detail) return;

    const payload = buildWatchPayload();
    if (payload) startWatching(payload);

    if (playbackConfigured) {
      setShowTrailer(false);
      setPlaying(true);
      return;
    }

    if (trailerKey) {
      setPlaying(false);
      setShowTrailer(true);
      return;
    }

    setPlaying(true);
  }

  function handleTrailer() {
    if (!trailerKey) return;
    setPlaying(false);
    setShowTrailer(true);
  }

  async function handleDownload() {
    if (downloading) return;

    setDownloading(true);
    try {
      await triggerContentDownload(id, {
        season,
        episode,
        type: contentType,
      });
    } catch {
      window.alert("No se pudo iniciar la descarga. Intenta de nuevo en unos segundos.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4.25rem)] items-center justify-center bg-black">
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

  const playLabel = playbackConfigured
    ? savedProgress
      ? "Continuar"
      : "Reproducir"
    : trailerKey
      ? savedProgress
        ? "Continuar tráiler"
        : "Ver tráiler"
      : savedProgress
        ? "Continuar"
        : "Reproducir";

  return (
    <div>
      <section className="relative min-h-[480px] overflow-hidden sm:min-h-[520px]">
        <Image
          src={detail.backdrop}
          alt={detail.title}
          fill
          priority
          className="object-cover brightness-[1.06] saturate-[1.08] contrast-[1.03]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/45 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,160,23,0.06),transparent_55%)]" />

        <FadeIn className="relative mx-auto flex max-w-6xl gap-8 px-8 py-10">
          <Link
            href="/"
            className="absolute left-8 top-8 flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-gold-400"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>

          <div className="relative mt-10 h-64 w-44 shrink-0 overflow-hidden rounded-2xl border border-gold-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.55),0_0_0_1px_rgba(212,160,23,0.12)] ring-1 ring-white/10 sm:h-72 sm:w-48">
            <Image
              src={detail.poster}
              alt={detail.title}
              fill
              className="object-cover brightness-[1.04] saturate-[1.06]"
              sizes="192px"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
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

            {isSeries && playbackConfigured && detail.seasons ? (
              <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-zinc-900/90 via-zinc-950/95 to-black p-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-md sm:p-5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent" />
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                  <DetailSelect
                    label="Temporada"
                    value={String(season)}
                    onChange={(value) => setSeason(Number(value))}
                    options={Array.from({ length: detail.seasons }, (_, index) => {
                      const number = index + 1;
                      return {
                        value: String(number),
                        label: `Temporada ${number}`,
                        badge: `T${number}`,
                      };
                    })}
                  />

                  <DetailSelect
                    label="Episodio"
                    value={String(episode)}
                    onChange={(value) => setEpisode(Number(value))}
                    disabled={episodes.length === 0}
                    loading={loadingEpisodes}
                    menuMinWidth={300}
                    className="min-w-[min(100%,18rem)] flex-[1.6]"
                    options={episodes.map((ep) => ({
                      value: String(ep.number),
                      label: ep.name,
                      badge: `E${ep.number}`,
                    }))}
                  />

                  <button
                    type="button"
                    onClick={handlePlay}
                    className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 px-6 text-sm font-bold text-black shadow-[0_8px_24px_rgba(212,160,23,0.28)] transition-all hover:from-gold-400 hover:to-gold-300 lg:w-auto lg:min-w-[10.5rem]"
                  >
                    <Play size={18} fill="currentColor" />
                    {playLabel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePlay}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 px-6 py-3 text-sm font-bold text-black shadow-[0_8px_24px_rgba(212,160,23,0.28)] transition-all hover:from-gold-400 hover:to-gold-300"
                >
                  <Play size={18} fill="currentColor" />
                  {playLabel}
                </button>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {playbackConfigured && downloadAvailable && (
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={downloading}
                  className="flex items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-5 py-3 text-sm font-semibold text-gold-400 transition-colors hover:border-gold-500/50 hover:bg-gold-500/15 disabled:opacity-60"
                >
                  <Download size={16} />
                  {downloading ? "Preparando..." : "Descargar"}
                </button>
              )}

              {playbackConfigured && (
                <button
                  type="button"
                  onClick={() => setShowCast(true)}
                  className="flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-gold-500/40 hover:text-white"
                >
                  <Cast size={16} />
                  Enviar al TV
                </button>
              )}

              {trailerKey && playbackConfigured && (
                <button
                  type="button"
                  onClick={handleTrailer}
                  className="rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-gold-500/40 hover:text-white"
                >
                  Ver tráiler
                </button>
              )}

              {savedProgress && (
                <span className="flex items-center text-xs text-zinc-500">
                  Progreso: {savedProgress.progress}%
                </span>
              )}
            </div>

            {!playbackConfigured && !trailerKey && (
              <p className="mt-4 max-w-2xl text-xs leading-relaxed text-zinc-500">
                La reproducción completa aún no está disponible para este título.
              </p>
            )}
          </div>
        </FadeIn>
      </section>

      {playing && playbackConfigured && detail && (
        <StreamPlayer
          contentId={id}
          title={detail.title}
          initialEmbedUrl={prefetchedEmbedUrl}
          contentType={contentType}
          season={isSeries ? season : undefined}
          episode={isSeries ? episode : undefined}
          onClose={() => setPlaying(false)}
        />
      )}

      <CastToTvDialog
        open={showCast && Boolean(playUrl)}
        onClose={() => setShowCast(false)}
        title={detail.title}
        playUrl={playUrl}
      />

      {showTrailer && trailerKey && (
        <section className="border-t border-white/5 bg-black px-8 py-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">Tráiler oficial</h2>
              <button
                type="button"
                onClick={() => setShowTrailer(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cerrar
              </button>
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
          </div>
        </section>
      )}

      {playing && !playbackConfigured && !showTrailer && (
        <section className="border-t border-white/5 px-8 py-10 text-center">
          <p className="text-sm text-zinc-500">
            Guardado en Continuar viendo. La reproducción no está disponible por ahora.
          </p>
        </section>
      )}
    </div>
  );
}
