"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveSource {
  proxyUrl: string;
  quality?: string | null;
}

interface RelatedChannel {
  id: string;
  name: string;
  logo?: string | null;
  countryCode: string;
}

interface ChannelDetailResponse {
  channel: { id: string; name: string; logo?: string | null };
  sources: LiveSource[];
  related: RelatedChannel[];
}

interface LiveTvPlayerProps {
  channelId: string;
  channelName: string;
  onClose: () => void;
  onSelectRelated?: (channelId: string) => void;
}

export function LiveTvPlayer({
  channelId,
  channelName,
  onClose,
  onSelectRelated,
}: LiveTvPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const [sources, setSources] = useState<LiveSource[]>([]);
  const [related, setRelated] = useState<RelatedChannel[]>([]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setShowControls(false), 3500);
  }, []);

  // Carga el catálogo de fuentes del canal.
  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function load() {
      setLoading(true);
      setFailed(false);
      setSourceIndex(0);

      try {
        const res = await fetch(`/api/live-tv/channels/${encodeURIComponent(channelId)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as ChannelDetailResponse & { error?: string };

        if (!mounted) return;
        if (!res.ok || !data.sources?.length) {
          setFailed(true);
          setLoading(false);
          return;
        }

        setSources(data.sources);
        setRelated(data.related ?? []);
      } catch (err) {
        if (!mounted) return;
        if ((err as Error).name !== "AbortError") setFailed(true);
        setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [channelId]);

  // Conecta el stream activo al elemento <video>.
  useEffect(() => {
    const video = videoRef.current;
    const source = sources[sourceIndex];
    if (!video || !source) return;

    setLoading(true);
    setFailed(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    function tryNextSource() {
      if (sourceIndex + 1 < sources.length) {
        setSourceIndex((index) => index + 1);
      } else {
        setFailed(true);
        setLoading(false);
      }
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source.proxyUrl;
      const onLoaded = () => setLoading(false);
      const onError = () => tryNextSource();
      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("error", onError);
      void video.play().catch(() => {});

      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("error", onError);
      };
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, backBufferLength: 30 });
      hlsRef.current = hls;

      hls.loadSource(source.proxyUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        void video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) tryNextSource();
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    setFailed(true);
    setLoading(false);
  }, [sources, sourceIndex]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function handleVolumeChange(value: number) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    video.muted = value === 0;
    setVolume(value);
    setMuted(value === 0);
  }

  function retry() {
    setSourceIndex(0);
    setFailed(false);
    setLoading(true);
  }

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

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-screen bg-black">
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden bg-black"
        onMouseMove={revealControls}
        onTouchStart={revealControls}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-contain"
          playsInline
          autoPlay
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        {loading && !failed && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <Loader2 size={36} className="animate-spin text-gold-400" />
          </div>
        )}

        {failed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black px-6 text-center">
            <p className="text-sm text-zinc-300">
              No se pudo reproducir <span className="text-white">{channelName}</span> en este
              momento.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={retry}
                className="flex items-center gap-2 rounded-lg border border-gold-500/30 px-4 py-2 text-sm text-gold-400 hover:bg-gold-500/10"
              >
                <RotateCcw size={14} />
                Reintentar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <div
          className={cn(
            "absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/90 via-black/50 to-transparent px-4 pb-6 pt-4 transition-opacity duration-300 sm:px-6",
            showControls || failed ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-600/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Vivo
              </span>
              <h2 className="truncate text-base font-semibold text-white sm:text-lg">
                {channelName}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-300 backdrop-blur-md transition-colors hover:border-red-500/40 hover:text-red-300"
              aria-label="Cerrar reproductor"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pb-5 pt-8 transition-opacity duration-300 sm:px-6",
            showControls || failed ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:border-gold-500/40 hover:text-gold-400"
              aria-label={playing ? "Pausar" : "Reproducir"}
            >
              {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:border-gold-500/40 hover:text-gold-400"
              aria-label={muted ? "Activar sonido" : "Silenciar"}
            >
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(event) => handleVolumeChange(Number(event.target.value))}
              className="volume-slider h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/15"
              aria-label="Volumen"
            />

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-md transition-colors hover:border-gold-500/40 hover:text-gold-400"
              aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>

          {related.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {related.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectRelated?.(item.id)}
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-gold-500/30 hover:text-gold-300"
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
