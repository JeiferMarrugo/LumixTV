"use client";



import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import Image from "next/image";

import Hls from "hls.js";

import {

  Maximize,

  Minimize,

  Pause,

  Play,

  Radio,

  RotateCcw,

  Volume2,

  VolumeX,

  X,

} from "lucide-react";

import {
  LiveTvRelatedPanel,
  type RelatedLiveChannel,
} from "@/components/features/LiveTvRelatedPanel";
import {
  CONNECT_TIMEOUT_SEC,
  LiveTvConnectionOverlay,
} from "@/components/features/LiveTvConnectionOverlay";
import { LiveTvQualityMenu } from "@/components/features/LiveTvQualityMenu";
import { LiveTvVolumeControl } from "@/components/features/LiveTvVolumeControl";
import { PlayerGestureFeedback } from "@/components/features/PlayerGestureFeedback";
import { useImmersivePlayer } from "@/lib/hooks/use-immersive-player";
import { cn } from "@/lib/utils";



interface LiveSource {
  url: string;
  proxyUrl: string;
  needsProxy: boolean;
  quality?: string | null;
  online?: boolean;
}

function pickPlaybackUrl(source: LiveSource, forceProxy: boolean) {
  if (forceProxy || source.needsProxy) return source.proxyUrl;
  if (typeof window !== "undefined" && window.location.protocol === "https:" && source.url.startsWith("http:")) {
    return source.proxyUrl;
  }
  return source.url;
}



interface ChannelDetailResponse {

  channel: { id: string; name: string; logo?: string | null };

  sources: LiveSource[];

}



interface LiveTvPlayerProps {

  channelId: string;

  channelName: string;

  onClose: () => void;

  onSelectRelated?: (channelId: string, channelName: string) => void;

}



function ControlButton({

  onClick,

  label,

  children,

  className,

}: {

  onClick: () => void;

  label: string;

  children: ReactNode;

  className?: string;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      aria-label={label}

      className={cn(

        "flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md transition-all hover:scale-105 hover:border-gold-500/40 hover:bg-black/70 hover:text-gold-400 sm:h-12 sm:w-12",

        className,

      )}

    >

      {children}

    </button>

  );

}



export function LiveTvPlayer({

  channelId,

  channelName,

  onClose,

  onSelectRelated,

}: LiveTvPlayerProps) {

  const videoRef = useRef<HTMLVideoElement>(null);

  const hlsRef = useRef<Hls | null>(null);

  const hideTimerRef = useRef<number | null>(null);



  const [channelLogo, setChannelLogo] = useState<string | null>(null);

  const [sources, setSources] = useState<LiveSource[]>([]);

  const [related, setRelated] = useState<RelatedLiveChannel[]>([]);

  const [sourceIndex, setSourceIndex] = useState(0);

  const [loading, setLoading] = useState(true);

  const [buffering, setBuffering] = useState(false);

  const [failed, setFailed] = useState(false);

  const [playing, setPlaying] = useState(true);

  const [muted, setMuted] = useState(false);

  const [volume, setVolume] = useState(1);

  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [connectionSeconds, setConnectionSeconds] = useState(0);

  const activeQuality = sources[sourceIndex]?.quality;



  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (!showQualityMenu) setShowControls(false);
    }, 4000);
  }, [showQualityMenu]);

  const {
    containerRef,
    isFullscreen,
    toggleFullscreen,
    mediaStyle,
    gestureFeedback,
    onTouchStart,
    onTouchEnd,
  } = useImmersivePlayer({
    videoRef,
    enableVolume: true,
    onInteraction: revealControls,
    onVolumeGesture: (value) => {
      setVolume(value);
      setMuted(value === 0);
    },
  });

  useEffect(() => {

    const controller = new AbortController();

    let mounted = true;



    async function load() {

      setLoading(true);

      setFailed(false);

      setSourceIndex(0);
      setShowQualityMenu(false);
      setChannelLogo(null);



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

        setChannelLogo(data.channel.logo ?? null);

        console.info(
          `%c[LUMIXTV En Vivo]%c ${data.channel.name}`,
          "color:#d4a017;font-weight:bold",
          "color:inherit",
          {
            channelId: data.channel.id,
            fuentes: data.sources.map((source, index) => ({
              indice: index,
              urlDirecta: source.url,
              urlProxy: source.proxyUrl,
              calidad: source.quality ?? "—",
              online: source.online ?? false,
              requiereProxy: source.needsProxy,
            })),
          },
        );

      } catch (err) {

        if (!mounted) return;

        if ((err as Error).name !== "AbortError") {

          setFailed(true);

          setLoading(false);

        }

      }

    }



    void load();

    return () => {

      mounted = false;

      controller.abort();

    };

  }, [channelId]);



  useEffect(() => {

    const controller = new AbortController();



    async function loadRelated() {

      try {

        const res = await fetch(

          `/api/live-tv/channels/${encodeURIComponent(channelId)}/related`,

          { signal: controller.signal },

        );

        const data = (await res.json()) as { items?: RelatedLiveChannel[] };

        if (res.ok) setRelated(data.items ?? []);

      } catch {

        /* opcional */

      }

    }



    void loadRelated();

    return () => controller.abort();

  }, [channelId]);



  useEffect(() => {

    const video = videoRef.current;

    const source = sources[sourceIndex];

    if (!video || !source) return;

    const playbackUrl = pickPlaybackUrl(source, Boolean(source.needsProxy));

    console.info(
      `%c[LUMIXTV En Vivo]%c Reproduciendo fuente ${sourceIndex + 1}/${sources.length}`,
      "color:#d4a017;font-weight:bold",
      "color:inherit",
      {
        canal: channelName,
        urlDirecta: source.url,
        urlReproduccion: playbackUrl,
        calidad: source.quality ?? "—",
        online: source.online ?? false,
      },
    );

    setLoading(true);

    setBuffering(false);

    setFailed(false);



    if (hlsRef.current) {

      hlsRef.current.destroy();

      hlsRef.current = null;

    }



    let forceProxy = Boolean(source.needsProxy);

    function tryNextSource() {
      if (sourceIndex + 1 < sources.length) {
        setSourceIndex((index) => index + 1);
      } else {
        setFailed(true);
        setLoading(false);
        setBuffering(false);
      }
    }

    function handlePlaybackFailure() {
      if (!forceProxy) {
        forceProxy = true;
        return true;
      }
      tryNextSource();
      return false;
    }

    const onWaiting = () => setBuffering(true);

    const onPlaying = () => {

      setBuffering(false);

      setLoading(false);

    };



    video.addEventListener("waiting", onWaiting);

    video.addEventListener("playing", onPlaying);



    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = pickPlaybackUrl(source, forceProxy);

      const onLoaded = () => setLoading(false);

      const onError = () => {
        if (handlePlaybackFailure()) {
          video.src = source.proxyUrl;
          void video.play().catch(() => {});
          return;
        }
      };

      video.addEventListener("loadedmetadata", onLoaded);

      video.addEventListener("error", onError);

      void video.play().catch(() => {});



      return () => {

        video.removeEventListener("loadedmetadata", onLoaded);

        video.removeEventListener("error", onError);

        video.removeEventListener("waiting", onWaiting);

        video.removeEventListener("playing", onPlaying);

      };

    }



    if (Hls.isSupported()) {

      const hls = new Hls({

        enableWorker: true,

        lowLatencyMode: true,

        backBufferLength: 30,

        manifestLoadingTimeOut: 20000,

        manifestLoadingMaxRetry: 3,

        levelLoadingTimeOut: 20000,

        fragLoadingTimeOut: 20000,

        fragLoadingMaxRetry: 4,
      });

      hlsRef.current = hls;



      hls.loadSource(pickPlaybackUrl(source, forceProxy));
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        void video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (handlePlaybackFailure()) {
          hls.loadSource(source.proxyUrl);
          return;
        }
      });



      return () => {

        hls.destroy();

        hlsRef.current = null;

        video.removeEventListener("waiting", onWaiting);

        video.removeEventListener("playing", onPlaying);

      };

    }



    setFailed(true);

    setLoading(false);



    return () => {

      video.removeEventListener("waiting", onWaiting);

      video.removeEventListener("playing", onPlaying);

    };

  }, [sources, sourceIndex, channelName]);

  useEffect(() => {
    if (!loading || failed) {
      setConnectionSeconds(0);
      return;
    }

    setConnectionSeconds(0);
    const startedAt = Date.now();

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setConnectionSeconds(elapsed);

      if (elapsed >= CONNECT_TIMEOUT_SEC) {
        window.clearInterval(interval);

        if (sourceIndex + 1 < sources.length) {
          console.warn(
            `[LUMIXTV En Vivo] Sin conexión en ${CONNECT_TIMEOUT_SEC}s — probando fuente ${sourceIndex + 2}/${sources.length}`,
          );
          setSourceIndex((index) => index + 1);
          return;
        }

        setFailed(true);
        setLoading(false);
        setBuffering(false);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [loading, failed, sourceIndex, sources.length]);

  useEffect(() => {

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (showQualityMenu) {
        setShowQualityMenu(false);
        return;
      }
      onClose();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);

  }, [onClose, showQualityMenu]);



  useEffect(() => {

    document.body.style.overflow = "hidden";

    return () => {

      document.body.style.overflow = "";

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

    revealControls();

  }



  function toggleMute() {

    const video = videoRef.current;

    if (!video) return;

    video.muted = !video.muted;

    setMuted(video.muted);

    revealControls();

  }



  function handleVolumeChange(value: number) {

    const video = videoRef.current;

    if (!video) return;

    video.volume = value;

    video.muted = value === 0;

    setVolume(value);

    setMuted(value === 0);

    revealControls();

  }



  function retry() {

    setSourceIndex(0);

    setFailed(false);

    setLoading(true);

  }



  return (

    <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col bg-black">

      <div

        ref={containerRef}

        className="relative min-h-0 flex-1 overflow-hidden bg-[#050505]"

        onMouseMove={revealControls}

        onTouchStart={(event) => {
          revealControls();
          onTouchStart(event);
        }}

        onTouchEnd={onTouchEnd}

        onClick={revealControls}

      >
        <PlayerGestureFeedback feedback={gestureFeedback} />

        <div

          aria-hidden

          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,160,23,0.08),transparent_55%)]"

        />



        <div className="absolute inset-0 h-full w-full" style={mediaStyle}>
          <video
            ref={videoRef}
            className="h-full w-full bg-black object-contain md:object-cover"
            playsInline
            autoPlay
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        </div>



        {loading && !failed && (
          <LiveTvConnectionOverlay
            mode="connecting"
            seconds={connectionSeconds}
            quality={activeQuality}
            sourceIndex={sourceIndex}
            totalSources={sources.length || 1}
          />
        )}

        {buffering && !loading && !failed && (
          <LiveTvConnectionOverlay
            mode="buffering"
            seconds={0}
            quality={activeQuality}
            sourceIndex={sourceIndex}
            totalSources={sources.length || 1}
          />
        )}



        {failed && (

          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/90 px-6 text-center backdrop-blur-sm">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">

              <Radio size={24} className="text-red-400" />

            </div>

            <div>

              <p className="text-base font-semibold text-white">Señal no disponible</p>

              <p className="mt-2 max-w-sm text-sm text-zinc-400">

                No pudimos reproducir <span className="text-zinc-200">{channelName}</span>.

                Prueba otro canal o reintenta en unos segundos.

              </p>

            </div>

            <div className="flex flex-wrap justify-center gap-3">

              <button

                type="button"

                onClick={retry}

                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 px-5 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90"

              >

                <RotateCcw size={15} />

                Reintentar

              </button>

              <button

                type="button"

                onClick={onClose}

                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"

              >

                Cerrar

              </button>

            </div>

          </div>

        )}



        <div

          className={cn(

            "absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/95 via-black/60 to-transparent px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))] transition-opacity duration-300 sm:px-6",

            showControls || failed || showQualityMenu ? "opacity-100" : "pointer-events-none opacity-0",

          )}

        >

          <div className="mx-auto flex w-full max-w-none items-center justify-between gap-3 lg:px-2">

            <div className="flex min-w-0 items-center gap-3">

              {channelLogo && (

                <div className="relative hidden h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-700 sm:block">

                  <Image

                    src={channelLogo}

                    alt=""

                    fill

                    unoptimized

                    className="object-contain p-1.5"

                    sizes="40px"

                  />

                </div>

              )}

              <div className="min-w-0">

                <div className="mb-1 flex items-center gap-2">

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-600/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">

                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />

                    En vivo

                  </span>

                  {activeQuality && (

                    <span className="hidden rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] text-zinc-400 sm:inline">

                      {activeQuality}

                    </span>

                  )}

                </div>

                <h2 className="truncate text-lg font-semibold text-white sm:text-xl">

                  {channelName}

                </h2>

              </div>

            </div>



            <ControlButton onClick={onClose} label="Cerrar reproductor" className="shrink-0">

              <X size={18} />

            </ControlButton>

          </div>

        </div>



        <div

          className={cn(

            "absolute inset-x-0 z-30 bg-gradient-to-t from-black/95 via-black/55 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 transition-opacity duration-300 sm:px-6",
            related.length > 0 && !isFullscreen ? "bottom-14 md:bottom-0" : "bottom-0",

            showControls || failed || showQualityMenu ? "opacity-100" : "pointer-events-none opacity-0",

          )}

        >

          <div className="mx-auto w-full max-w-none px-0 lg:px-2">

            <div className="flex items-center gap-2.5 sm:gap-3">

              <ControlButton onClick={togglePlay} label={playing ? "Pausar" : "Reproducir"}>

                {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}

              </ControlButton>



              <ControlButton
                onClick={toggleMute}
                label={muted ? "Activar sonido" : "Silenciar"}
                className="sm:hidden"
              >
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </ControlButton>

              <LiveTvVolumeControl
                volume={volume}
                muted={muted}
                onToggleMute={toggleMute}
                onVolumeChange={handleVolumeChange}
              />



              <div className="flex-1" />

              <LiveTvQualityMenu
                sources={sources}
                activeIndex={sourceIndex}
                open={showQualityMenu}
                onToggle={() => {
                  setShowQualityMenu((value) => !value);
                  revealControls();
                }}
                onSelect={(index) => {
                  setSourceIndex(index);
                  setShowQualityMenu(false);
                  setFailed(false);
                  setLoading(true);
                  revealControls();
                }}
              />

              <ControlButton

                onClick={() => void toggleFullscreen()}

                label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}

              >

                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}

              </ControlButton>

            </div>



          </div>

          {related.length > 0 && !isFullscreen && (
            <div className="mx-auto mt-4 hidden w-full border-t border-white/[0.06] pt-4 md:block">
              <LiveTvRelatedPanel
                mode="desktop"
                related={related}
                activeChannelId={channelId}
                onSelect={(id, name) => onSelectRelated?.(id, name)}
              />
            </div>
          )}

        </div>

        {related.length > 0 && !isFullscreen && (
          <LiveTvRelatedPanel
            mode="mobile"
            related={related}
            activeChannelId={channelId}
            onSelect={(id, name) => onSelectRelated?.(id, name)}
          />
        )}

      </div>

    </div>

  );

}


