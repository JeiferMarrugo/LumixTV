"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Maximize, Minimize, Radio, X } from "lucide-react";
import { RelatedChannelsStrip } from "@/components/features/RelatedChannelsStrip";
import { StreamSourcePicker } from "@/components/features/StreamSourcePicker";
import {
  LIVE_PLAYER_CYCLE_DELAY_MS,
  LIVE_PLAYER_MAX_CONNECT_MS,
  LIVE_PLAYER_PLAYBACK_TIMEOUT_MS,
  LIVE_PLAYER_SERVER_SWITCH_DELAY_MS,
  LIVE_PLAYER_SOURCE_TIMEOUT_MS,
  LIVE_STREAM_CANDIDATE_LIMIT,
} from "@/lib/iptv/constants";
import type { LiveChannel, LiveChannelSource, LiveStreamSourceGroup } from "@/lib/iptv/types";
import type { SourceStatus } from "@/components/ui/ServerPill";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { useFullscreen } from "@/lib/hooks/use-fullscreen";
import { cn } from "@/lib/utils";

interface LiveTvPlayerProps {
  channel: LiveChannel;
  onClose: () => void;
  onChannelChange?: (channel: LiveChannel) => void;
}

const MAX_SOURCES = LIVE_STREAM_CANDIDATE_LIMIT;
const MAX_HLS_ERRORS = 8;

/** Empieza conservador y deja que hls.js suba calidad según el ancho de banda. */
const HLS_CONFIG: Partial<Hls["config"]> = {
  enableWorker: true,
  lowLatencyMode: false,
  startFragPrefetch: true,
  backBufferLength: 30,
  maxBufferLength: 60,
  maxMaxBufferLength: 120,
  liveSyncDurationCount: 3,
  liveMaxLatencyDurationCount: 14,
  maxLiveSyncPlaybackRate: 1.25,
  startPosition: -1,
  startLevel: 0,
  capLevelToPlayerSize: true,
  testBandwidth: true,
  abrEwmaDefaultEstimate: 400_000,
  abrBandWidthFactor: 0.85,
  abrBandWidthUpFactor: 0.65,
  manifestLoadingMaxRetry: 4,
  levelLoadingMaxRetry: 4,
  fragLoadingMaxRetry: 6,
  manifestLoadingTimeOut: 25_000,
  levelLoadingTimeOut: 25_000,
  fragLoadingTimeOut: 30_000,
};

function formatHlsLevel(height?: number, bitrate?: number) {
  if (height && height > 0) return `${height}p`;
  if (bitrate && bitrate > 0) return `${Math.round(bitrate / 1000)}k`;
  return null;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function LiveTvPlayer({ channel, onClose, onChannelChange }: LiveTvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(0);
  const manualSourceRef = useRef<number | null>(null);

  const [activeChannel, setActiveChannel] = useState(channel);
  const [relatedFamily, setRelatedFamily] = useState<string | null>(null);
  const [relatedChannels, setRelatedChannels] = useState<LiveChannel[]>([]);
  const [ready, setReady] = useState(false);
  const [totalSources, setTotalSources] = useState(0);
  const [connectedSource, setConnectedSource] = useState<number | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [streamQuality, setStreamQuality] = useState<string | null>(null);
  const [streamGroups, setStreamGroups] = useState<LiveStreamSourceGroup[]>([]);
  const [expandedSource, setExpandedSource] = useState<LiveChannelSource | null>(null);
  const [optionsReady, setOptionsReady] = useState(false);
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatus[]>([]);
  const { containerRef, isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();

  useEffect(() => {
    setActiveChannel(channel);
    setFailed(false);
    setStreamQuality(null);
  }, [channel]);

  const switchChannel = useCallback(
    (next: LiveChannel) => {
      setActiveChannel(next);
      setReady(false);
      setFailed(false);
      setStreamQuality(null);
      setConnectedSource(null);
      setBuffering(false);
      setExpandedSource(null);
      setOptionsReady(false);
      setRetryKey((current) => current + 1);
      onChannelChange?.(next);
    },
    [onChannelChange],
  );

  useEffect(() => {
    const controller = new AbortController();
    setOptionsReady(false);
    setStreamGroups([]);
    setExpandedSource(null);

    async function loadStreamOptions() {
      try {
        const res = await fetch(
          `/api/live-tv/stream-options?channelId=${encodeURIComponent(activeChannel.id)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          total?: number;
          groups?: LiveStreamSourceGroup[];
        };

        if (controller.signal.aborted) return;

        const total = data.total ?? 0;
        setStreamGroups(data.groups ?? []);
        setTotalSources(total);
        setSourceStatuses(Array.from({ length: total }, () => "pending" as SourceStatus));
        setOptionsReady(true);
      } catch {
        if (!controller.signal.aborted) {
          setStreamGroups([]);
          setTotalSources(0);
          setSourceStatuses([]);
          setOptionsReady(true);
        }
      }
    }

    void loadStreamOptions();
    return () => controller.abort();
  }, [activeChannel.id]);

  useEffect(() => {
    const loadingIndex = sourceStatuses.findIndex((status) => status === "loading");
    if (loadingIndex < 0) return;

    const group = streamGroups.find((item) =>
      item.streams.some((stream) => stream.index === loadingIndex),
    );

    if (group && group.streams.length > 1) {
      setExpandedSource(group.source);
    }
  }, [sourceStatuses, streamGroups]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRelated() {
      try {
        const res = await fetch(
          `/api/live-tv/related?channelId=${encodeURIComponent(activeChannel.id)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          family?: string | null;
          channels?: LiveChannel[];
        };

        if (controller.signal.aborted) return;

        setRelatedFamily(data.family ?? null);
        setRelatedChannels(data.channels ?? []);
      } catch {
        if (!controller.signal.aborted) {
          setRelatedFamily(null);
          setRelatedChannels([]);
        }
      }
    }

    void loadRelated();
    return () => controller.abort();
  }, [activeChannel.id]);

  const destroyPlayer = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.removeAttribute("src");
      video.load();
    }
  }, []);

  const patchSourceStatus = useCallback((index: number, status: SourceStatus) => {
    setSourceStatuses((current) => {
      const next = [...current];
      next[index] = status;
      return next;
    });
  }, []);

  const resetSourceStatuses = useCallback((count: number) => {
    setSourceStatuses(Array.from({ length: count }, () => "pending" as SourceStatus));
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!optionsReady) return;

    const maybeVideo = videoRef.current;
    if (!maybeVideo) return;
    const videoEl: HTMLVideoElement = maybeVideo;

    const sessionId = sessionRef.current + 1;
    sessionRef.current = sessionId;

    let mounted = true;
    setFailed(false);
    setStreamQuality(null);
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    function isActive() {
      return mounted && sessionId === sessionRef.current && !signal.aborted;
    }

    async function trySource(
      afterSource: number,
      maxSources: number,
    ): Promise<{
      ok: boolean;
      sourceIndex?: number;
      alternativeCount?: number;
      cycle?: boolean;
    }> {
      if (!isActive()) return { ok: false };

      destroyPlayer();
      setReady(false);

      let streamRes: Response;
      try {
        streamRes = await fetch(
          `/api/live-tv/stream?channelId=${encodeURIComponent(activeChannel.id)}&after=${afterSource}`,
          { signal },
        );
      } catch (error) {
        if (signal.aborted || (error as Error).name === "AbortError") {
          return { ok: false };
        }
        throw error;
      }

      const data = (await streamRes.json()) as {
        stream?: { url: string };
        sourceIndex?: number;
        alternativeCount?: number;
        exhausted?: boolean;
      };

      const alternativeCount = data.alternativeCount ?? 0;

      if (!streamRes.ok || !isActive()) {
        if (typeof data.sourceIndex === "number") {
          patchSourceStatus(data.sourceIndex, "failed");
        }
        return {
          ok: false,
          alternativeCount,
          sourceIndex: data.sourceIndex,
          cycle: Boolean(data.exhausted),
        };
      }

      const sourceIndex = data.sourceIndex ?? afterSource + 1;
      patchSourceStatus(sourceIndex, "loading");

      const playUrl = data.stream?.url;
      if (!playUrl || !isActive()) {
        patchSourceStatus(sourceIndex, "failed");
        return { ok: false, alternativeCount, sourceIndex };
      }

      const played = await new Promise<boolean>((resolve) => {
        let settled = false;
        let errorCount = 0;
        let playbackStartTimer: number | null = null;
        let gotManifest = false;

        const cleanupListeners = () => {
          videoEl.removeEventListener("playing", onPlaybackStart);
          videoEl.removeEventListener("canplay", onCanPlay);
          if (playbackStartTimer !== null) window.clearTimeout(playbackStartTimer);
        };

        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          cleanupListeners();
          if (!ok) destroyPlayer();
          resolve(ok);
        };

        const markConnected = () => {
          if (!isActive()) {
            finish(false);
            return;
          }

          setReady(true);
          setBuffering(false);
          setConnectedSource(sourceIndex);
          patchSourceStatus(sourceIndex, "connected");
          finish(true);
        };

        const onPlaybackStart = () => markConnected();

        const onCanPlay = () => {
          if (videoEl.readyState >= 3 && videoEl.buffered.length > 0) {
            markConnected();
          }
        };

        const schedulePlaybackTimeout = () => {
          if (playbackStartTimer !== null) window.clearTimeout(playbackStartTimer);
          playbackStartTimer = window.setTimeout(
            () => finish(false),
            LIVE_PLAYER_PLAYBACK_TIMEOUT_MS,
          );
        };

        const timeoutId = window.setTimeout(
          () => finish(false),
          LIVE_PLAYER_SOURCE_TIMEOUT_MS,
        );

        videoEl.addEventListener("playing", onPlaybackStart, { once: true });
        videoEl.addEventListener("canplay", onCanPlay);

        if (Hls.isSupported()) {
          const hls = new Hls(HLS_CONFIG);

          hlsRef.current = hls;
          hls.loadSource(playUrl);
          hls.attachMedia(videoEl);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!isActive()) {
              finish(false);
              return;
            }

            gotManifest = true;
            if (hls.levels.length > 0) {
              const startLevel = Math.min(hls.currentLevel >= 0 ? hls.currentLevel : 0, hls.levels.length - 1);
              const level = hls.levels[startLevel];
              const label = formatHlsLevel(level.height, level.bitrate);
              if (label) setStreamQuality(label);
            }
            schedulePlaybackTimeout();
            void videoEl.play().catch(() => {
              // Autoplay bloqueado: el usuario puede pulsar play.
            });
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
            const level = hls.levels[data.level];
            const label = formatHlsLevel(level?.height, level?.bitrate);
            if (label) setStreamQuality(label);
          });

          hls.on(Hls.Events.FRAG_LOADED, () => {
            if (gotManifest && videoEl.buffered.length > 0) {
              schedulePlaybackTimeout();
            }
          });

          hls.on(Hls.Events.ERROR, (_, errorData) => {
            const httpCode = errorData.response?.code;

            if (errorData.fatal) {
              if (errorData.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
                return;
              }
              if (errorData.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
                errorCount += 1;
                if (errorCount >= MAX_HLS_ERRORS) finish(false);
                return;
              }
              errorCount += 1;
              if (errorCount >= MAX_HLS_ERRORS || httpCode === 403 || httpCode === 404) {
                finish(false);
              }
              return;
            }

            errorCount += 1;
            if (errorCount >= MAX_HLS_ERRORS) finish(false);
          });
        } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
          videoEl.src = playUrl;
          videoEl.onloadedmetadata = () => {
            if (!isActive()) {
              finish(false);
              return;
            }

            schedulePlaybackTimeout();
            void videoEl.play().catch(() => {
              // Autoplay bloqueado en Safari/iOS.
            });
          };
          videoEl.onerror = () => finish(false);
        } else {
          finish(false);
        }
      });

      if (!played && isActive()) {
        patchSourceStatus(sourceIndex, "failed");
      }

      return { ok: played, alternativeCount, sourceIndex };
    }

    async function start() {
      try {
      let maxSources = MAX_SOURCES;
      let afterSource = manualSourceRef.current !== null ? manualSourceRef.current - 1 : -1;
      const manualOnly = manualSourceRef.current !== null;
      manualSourceRef.current = null;
      const startedAt = Date.now();

      if (manualOnly) {
        const result = await trySource(afterSource, maxSources);
        if (!isActive()) return;
        if (result.alternativeCount && result.alternativeCount > 0) {
          maxSources = Math.min(result.alternativeCount, MAX_SOURCES);
          setTotalSources(maxSources);
        }
        if (!result.ok && isActive()) {
          setBuffering(false);
        }
        return;
      }

      while (isActive()) {
        if (Date.now() - startedAt >= LIVE_PLAYER_MAX_CONNECT_MS) {
          destroyPlayer();
          setFailed(true);
          return;
        }

        const result = await trySource(afterSource, maxSources);

        if (!isActive()) return;
        if (result.ok) return;

        if (Date.now() - startedAt >= LIVE_PLAYER_MAX_CONNECT_MS) {
          destroyPlayer();
          setFailed(true);
          return;
        }

        if (result.alternativeCount && result.alternativeCount > 0) {
          maxSources = Math.min(result.alternativeCount, MAX_SOURCES);
          setTotalSources(maxSources);
        }

        const nextIndex =
          typeof result.sourceIndex === "number" ? result.sourceIndex : afterSource + 1;
        const reachedEnd = result.cycle || nextIndex >= maxSources - 1;

        if (reachedEnd) {
          afterSource = -1;
          resetSourceStatuses(maxSources);
          await sleep(LIVE_PLAYER_CYCLE_DELAY_MS);
        } else {
          afterSource = nextIndex;
          await sleep(LIVE_PLAYER_SERVER_SWITCH_DELAY_MS);
        }
      }
      } catch (error) {
        if (!signal.aborted && (error as Error).name !== "AbortError") {
          console.error("LiveTvPlayer connection error:", error);
        }
      }
    }

    void start().catch(() => {
      // Cancelación intencional al cerrar o cambiar de canal.
    });

    return () => {
      mounted = false;
      sessionRef.current += 1;
      abortRef.current?.abort();
      destroyPlayer();
    };
  }, [activeChannel.id, retryKey, optionsReady, destroyPlayer, patchSourceStatus, resetSourceStatuses]);

  const handleRetry = useCallback(() => {
    setFailed(false);
    setStreamQuality(null);
    setReady(false);
    setConnectedSource(null);
    setBuffering(false);
    setExpandedSource(null);
    setSourceStatuses(Array.from({ length: totalSources }, () => "pending" as SourceStatus));
    setRetryKey((current) => current + 1);
  }, [totalSources]);

  const switchToSource = useCallback(
    (index: number) => {
      if (index === connectedSource) return;

      manualSourceRef.current = index;
      sessionRef.current += 1;
      abortRef.current?.abort();
      setFailed(false);
      setReady(false);
      setStreamQuality(null);
      setConnectedSource(null);
      setBuffering(true);
      setSourceStatuses((current) =>
        current.map((status, i) => {
          if (i === index) return "loading";
          if (status === "connected") return "pending";
          return status;
        }),
      );
      setRetryKey((current) => current + 1);
    },
    [connectedSource],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready) return;

    function onPlaying() {
      setBuffering(false);
    }

    function onWaiting() {
      setBuffering(true);
    }

    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onWaiting);
    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onWaiting);
    };
  }, [ready, activeChannel.id]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (document.fullscreenElement) {
          void exitFullscreen();
          return;
        }
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [exitFullscreen, onClose]);

  const showStreamPicker =
    !failed &&
    streamGroups.length > 0 &&
    (streamGroups.length > 1 || streamGroups.some((group) => group.streams.length > 1));
  const showRelatedStrip = relatedFamily && relatedChannels.length > 0;

  return (
    <div className="group/player fixed inset-0 z-50 flex flex-col bg-black">
      <div
        className={cn(
          "absolute left-0 right-0 top-0 z-30 bg-gradient-to-b from-black via-black/80 to-transparent px-5 pb-10 pt-5 transition-opacity duration-500 sm:px-8",
          ready && !isFullscreen && "pointer-events-none opacity-0 group-hover/player:pointer-events-auto group-hover/player:opacity-100",
          isFullscreen && "pointer-events-none opacity-0",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                En vivo
              </span>
              {activeChannel.verified && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Verificado
                </span>
              )}
              {(streamQuality ?? activeChannel.quality) && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  {streamQuality ?? activeChannel.quality}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/15 ring-1 ring-red-500/25">
                <Radio size={18} className="text-red-400" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-white sm:text-xl">{activeChannel.name}</h2>
                {activeChannel.label && (
                  <p className="truncate text-xs text-zinc-500">{activeChannel.label}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="rounded-full border border-white/10 bg-black/50 p-2.5 text-zinc-400 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
              aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-black/50 p-2.5 text-zinc-400 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {showStreamPicker && (
          <div className="mt-5">
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              {ready ? "Fuentes disponibles" : "Conectando señal..."}
            </p>
            <StreamSourcePicker
              groups={streamGroups}
              sourceStatuses={sourceStatuses}
              expandedSource={expandedSource}
              interactive={ready}
              onExpand={setExpandedSource}
              onSelect={switchToSource}
            />
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 bg-black"
        onDoubleClick={() => void toggleFullscreen()}
      >
        <video
          ref={videoRef}
          controls
          playsInline
          className="h-full w-full object-contain"
        />

        {failed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 px-6 backdrop-blur-sm">
            <div className="max-w-sm text-center">
              <p className="text-lg font-semibold text-white">No se pudo conectar</p>
              <p className="mt-2 text-sm text-zinc-400">
                No encontramos señal para {activeChannel.name}. Puedes reintentar o probar otro canal.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-full border border-gold-500/40 bg-gold-500/10 px-5 py-2.5 text-sm font-semibold text-gold-400 transition-colors hover:bg-gold-500/20"
                >
                  Reintentar
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Volver a canales
                </button>
              </div>
            </div>
          </div>
        )}

        {!failed && (!ready || buffering) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-[2px]">
            <StreamingLoader
              label={buffering ? "Cargando señal..." : "Conectando al canal..."}
              size="sm"
            />
          </div>
        )}

        {isFullscreen && (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-black/60 p-2.5 text-zinc-300 opacity-70 backdrop-blur-sm transition-opacity hover:opacity-100"
            aria-label="Salir de pantalla completa"
          >
            <Minimize size={20} />
          </button>
        )}
      </div>

      {showRelatedStrip && !isFullscreen && (
        <RelatedChannelsStrip
          family={relatedFamily}
          channels={relatedChannels}
          activeChannelId={activeChannel.id}
          onSelect={switchChannel}
        />
      )}
    </div>
  );
}
