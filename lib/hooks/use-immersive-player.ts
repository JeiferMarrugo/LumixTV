"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
} from "react";

export interface GestureFeedback {
  type: "volume" | "brightness";
  value: number;
}

interface UseImmersivePlayerOptions {
  videoRef?: RefObject<HTMLVideoElement | null>;
  /** Volumen del elemento video (En Vivo). En iframe no aplica. */
  enableVolume?: boolean;
  onInteraction?: () => void;
  onVolumeGesture?: (volume: number) => void;
}

interface TouchSession {
  startY: number;
  lastY: number;
  zone: "left" | "right";
}

async function lockLandscapeOrientation() {
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: "landscape" | "portrait") => Promise<void>;
    };
    if (orientation?.lock) {
      await orientation.lock("landscape");
    }
  } catch {
    /* iOS / desktop pueden bloquearlo */
  }
}

function unlockLandscapeOrientation() {
  try {
    screen.orientation?.unlock?.();
  } catch {
    /* ignore */
  }
}

export function useImmersivePlayer({
  videoRef,
  enableVolume = true,
  onInteraction,
  onVolumeGesture,
}: UseImmersivePlayerOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchSessionRef = useRef<TouchSession | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [gestureFeedback, setGestureFeedback] = useState<GestureFeedback | null>(null);

  const showFeedback = useCallback((type: GestureFeedback["type"], value: number) => {
    setGestureFeedback({ type, value });
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setGestureFeedback(null), 850);
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      const el = containerRef.current;
      const active = Boolean(el && document.fullscreenElement === el);
      setIsFullscreen(active);
      if (!active) unlockLandscapeOrientation();
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
      unlockLandscapeOrientation();
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        unlockLandscapeOrientation();
      } else {
        await el.requestFullscreen();
        await lockLandscapeOrientation();
      }
    } catch {
      /* navegador no soporta fullscreen */
    }

    onInteraction?.();
  }, [onInteraction]);

  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
      unlockLandscapeOrientation();
    } catch {
      /* ignore */
    }
  }, []);

  const resolveTouchZone = useCallback((clientX: number) => {
    const width = containerRef.current?.clientWidth ?? window.innerWidth;
    const ratio = clientX / width;
    if (ratio < 0.38) return "left" as const;
    if (ratio > 0.62) return "right" as const;
    return null;
  }, []);

  const onTouchStart = useCallback(
    (event: ReactTouchEvent) => {
      if (event.touches.length !== 1) return;
      const zone = resolveTouchZone(event.touches[0].clientX);
      if (!zone) {
        touchSessionRef.current = null;
        return;
      }
      if (zone === "right" && !enableVolume) return;

      touchSessionRef.current = {
        zone,
        startY: event.touches[0].clientY,
        lastY: event.touches[0].clientY,
      };
    },
    [enableVolume, resolveTouchZone],
  );

  const onTouchEnd = useCallback(() => {
    touchSessionRef.current = null;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onTouchMove(event: TouchEvent) {
      const session = touchSessionRef.current;
      if (!session || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const dy = session.lastY - touch.clientY;
      if (Math.abs(dy) < 2) return;

      event.preventDefault();
      session.lastY = touch.clientY;

      const delta = dy * 0.008;

      if (session.zone === "right" && enableVolume && videoRef?.current) {
        const video = videoRef.current;
        const next = Math.min(1, Math.max(0, video.volume + delta));
        video.volume = next;
        video.muted = next === 0;
        showFeedback("volume", next);
        onVolumeGesture?.(next);
        onInteraction?.();
        return;
      }

      if (session.zone === "left") {
        setBrightness((current) => {
          const next = Math.min(1, Math.max(0.2, current + delta));
          showFeedback("brightness", next);
          onInteraction?.();
          return next;
        });
      }
    }

    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [enableVolume, onInteraction, onVolumeGesture, showFeedback, videoRef]);

  const mediaStyle = {
    filter: brightness === 1 ? undefined : `brightness(${brightness})`,
  };

  return {
    containerRef,
    isFullscreen,
    toggleFullscreen,
    exitFullscreen,
    brightness,
    mediaStyle,
    gestureFeedback,
    onTouchStart,
    onTouchEnd,
  };
}
