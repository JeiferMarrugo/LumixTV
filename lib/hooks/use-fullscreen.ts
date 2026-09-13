"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useFullscreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullscreenChange() {
      const el = containerRef.current;
      const active = document.fullscreenElement;
      setIsFullscreen(Boolean(el && (active === el || el.contains(active))));
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        try {
          screen.orientation?.unlock?.();
        } catch {
          /* ignore */
        }
      } else {
        await el.requestFullscreen();
        try {
          const orientation = screen.orientation as ScreenOrientation & {
            lock?: (o: "landscape" | "portrait") => Promise<void>;
          };
          await orientation?.lock?.("landscape");
        } catch {
          /* ignore */
        }
      }
    } catch {
      // Browser blocked or unsupported
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
  }, []);

  return { containerRef, isFullscreen, toggleFullscreen, exitFullscreen };
}
