"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, Radio, X } from "lucide-react";
import type { LiveChannel, LiveStreamPlayback } from "@/lib/iptv/types";

interface LiveTvPlayerProps {
  channel: LiveChannel;
  onClose: () => void;
}

export function LiveTvPlayer({ channel, onClose }: LiveTvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let mounted = true;
    abortRef.current = new AbortController();

    async function start() {
      try {
        const res = await fetch(
          `/api/live-tv/stream?channelId=${encodeURIComponent(channel.id)}`,
          { signal: abortRef.current!.signal },
        );

        if (!res.ok) throw new Error("Stream no disponible");

        const { stream } = (await res.json()) as { stream: LiveStreamPlayback };

        if (!mounted || !video) return;

        if (Hls.isSupported()) {
          const hls = new Hls({
            xhrSetup(xhr) {
              if (stream.referrer) xhr.setRequestHeader("Referer", stream.referrer);
              if (stream.userAgent) xhr.setRequestHeader("User-Agent", stream.userAgent);
            },
          });

          hlsRef.current = hls;
          hls.loadSource(stream.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setReady(true);
            void video.play().catch(() => setFailed(true));
          });
          hls.on(Hls.Events.ERROR, () => setFailed(true));
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream.url;
          setReady(true);
          void video.play().catch(() => setFailed(true));
        } else {
          setFailed(true);
        }
      } catch {
        if (mounted) setFailed(true);
      }
    }

    void start();

    return () => {
      mounted = false;
      abortRef.current?.abort();
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [channel.id, onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Cerrar reproductor"
      />

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-surface-raised shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600/20 text-red-400">
              <Radio size={18} />
            </span>
            <div>
              <p className="font-semibold text-white">{channel.name}</p>
              <p className="text-xs text-zinc-500">
                En vivo
                {channel.quality ? ` · ${channel.quality}` : ""}
                {channel.label ? ` · ${channel.label}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-surface-overlay hover:text-white"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative aspect-video bg-black">
          <video ref={videoRef} controls playsInline className="h-full w-full" />
          {!ready && !failed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 size={32} className="animate-spin text-gold-500" />
            </div>
          )}
          {failed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-sm text-zinc-400">
              No se pudo reproducir este canal. Puede estar geo-bloqueado o fuera de línea.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
