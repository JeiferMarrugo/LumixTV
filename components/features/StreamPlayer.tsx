"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cast, Download, Loader2, Maximize, Minimize, Settings2, X } from "lucide-react";
import { CastToTvDialog } from "@/components/features/CastToTvDialog";
import { cn } from "@/lib/utils";
import { triggerContentDownload } from "@/lib/download-client";

interface StreamPlayerProps {
  contentId: string;
  title: string;
  initialEmbedUrl?: string | null;
  contentType?: "movie" | "series" | "anime";
  season?: number;
  episode?: number;
  onClose: () => void;
}

function buildStreamParams(
  contentType: "movie" | "series" | "anime",
  season: number,
  episode: number,
) {
  return new URLSearchParams({
    season: String(season),
    episode: String(episode),
    type: contentType === "anime" ? "anime" : contentType === "series" ? "series" : "movie",
  });
}

export function StreamPlayer({
  contentId,
  title,
  initialEmbedUrl = null,
  contentType = "movie",
  season = 1,
  episode = 1,
  onClose,
}: StreamPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  const [embedUrl, setEmbedUrl] = useState<string | null>(initialEmbedUrl);
  const [failed, setFailed] = useState(false);
  const [downloadAvailable, setDownloadAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCast, setShowCast] = useState(false);

  const isSeries = contentType === "series" || contentType === "anime";

  const playUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = buildStreamParams(contentType, season, episode);
    return `${window.location.origin}/titulo/${encodeURIComponent(contentId)}?${params.toString()}&play=1`;
  }, [contentId, contentType, season, episode]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (!showSettings) setShowControls(false);
    }, 3500);
  }, [showSettings]);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function load() {
      setFailed(false);
      if (!initialEmbedUrl) setEmbedUrl(null);

      try {
        const params = buildStreamParams(contentType, season, episode);
        const [streamRes, downloadRes] = await Promise.all([
          initialEmbedUrl
            ? Promise.resolve(null)
            : fetch(`/api/content/${encodeURIComponent(contentId)}/stream?${params}`, {
                signal: controller.signal,
              }),
          fetch(`/api/content/${encodeURIComponent(contentId)}/download?${params}`, {
            signal: controller.signal,
          }),
        ]);

        if (controller.signal.aborted || !mounted) return;

        if (streamRes) {
          const data = (await streamRes.json()) as {
            configured?: boolean;
            embedUrl?: string | null;
          };

          if (!streamRes.ok || !data.configured || !data.embedUrl) {
            setFailed(true);
            return;
          }

          setEmbedUrl(data.embedUrl);
        } else if (!initialEmbedUrl) {
          setFailed(true);
          return;
        }

        const downloadData = (await downloadRes.json()) as { available?: boolean };
        setDownloadAvailable(Boolean(downloadData.available));
      } catch (err) {
        if (controller.signal.aborted || !mounted) return;
        if ((err as Error).name !== "AbortError") setFailed(true);
      }
    }

    void load();

    return () => {
      mounted = false;
      controller.abort();
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [contentId, contentType, season, episode, initialEmbedUrl]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (showCast) setShowCast(false);
        else if (showSettings) setShowSettings(false);
        else onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, showCast, showSettings]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen();
    }

    revealControls();
  }

  async function handleDownload() {
    if (downloading || !downloadAvailable) return;

    setDownloading(true);
    try {
      await triggerContentDownload(contentId, {
        season,
        episode,
        type: contentType,
      });
    } catch {
      window.alert("No se pudo iniciar la descarga.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 h-[100dvh] w-screen bg-black">
        <div
          ref={containerRef}
          className="relative h-full w-full overflow-hidden bg-black"
          onMouseMove={revealControls}
          onTouchStart={revealControls}
        >
          <div
            className={cn(
              "absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/90 via-black/50 to-transparent px-4 pb-6 pt-4 transition-opacity duration-300 sm:px-6",
              showControls || failed || showSettings
                ? "opacity-100"
                : "opacity-0 pointer-events-none",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-white sm:text-lg">
                  {title}
                </h2>
                {isSeries && (
                  <p className="text-xs text-zinc-400">
                    Temporada {season} · Episodio {episode}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCast(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-300 backdrop-blur-md transition-colors hover:border-gold-500/40 hover:text-gold-400"
                  title="Enviar al televisor"
                  aria-label="Enviar al televisor"
                >
                  <Cast size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-300 backdrop-blur-md transition-colors hover:border-gold-500/40 hover:text-gold-400"
                  title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                  aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>

                {downloadAvailable && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettings((value) => !value);
                      revealControls();
                    }}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border bg-black/40 backdrop-blur-md transition-colors",
                      showSettings
                        ? "border-gold-500/50 text-gold-400"
                        : "border-white/10 text-zinc-300 hover:border-gold-500/40 hover:text-gold-400",
                    )}
                    title="Opciones"
                    aria-label="Opciones del reproductor"
                  >
                    <Settings2 size={16} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-300 backdrop-blur-md transition-colors hover:border-red-500/40 hover:text-red-300"
                  aria-label="Cerrar reproductor"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {showSettings && downloadAvailable && (
            <div className="absolute right-4 top-[4.5rem] z-40 w-72 overflow-hidden rounded-2xl border border-gold-500/20 bg-surface-raised/95 shadow-2xl backdrop-blur-xl sm:right-6">
              <div className="border-b border-white/5 px-4 py-3">
                <p className="text-sm font-semibold text-white">Descarga</p>
              </div>
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={downloading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-500/25 bg-gold-500/10 px-4 py-2.5 text-sm font-semibold text-gold-400 transition-colors hover:border-gold-500/45 hover:bg-gold-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {downloading ? "Preparando..." : "Descargar archivo"}
                </button>
              </div>
            </div>
          )}

          <div className="relative h-full w-full">
            {embedUrl && (
              <iframe
                src={embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="origin"
                className="absolute inset-0 h-full w-full border-0"
              />
            )}

            {failed && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black px-6 text-center">
                <p className="text-sm text-zinc-300">No se pudo iniciar la reproducción.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gold-500/30 px-4 py-2 text-sm text-gold-400 hover:bg-gold-500/10"
                >
                  Volver al detalle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CastToTvDialog
        open={showCast}
        onClose={() => setShowCast(false)}
        title={title}
        playUrl={playUrl}
      />
    </>
  );
}
