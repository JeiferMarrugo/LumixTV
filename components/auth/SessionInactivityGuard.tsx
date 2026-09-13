"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { SESSION_IDLE_TIMEOUT_MS } from "@/lib/session-inactivity";
import { useAppStore } from "@/lib/store/use-app-store";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;
const MOUSEMOVE_THROTTLE_MS = 30_000;
const SESSION_REFRESH_MS = 5 * 60 * 1000;

export function SessionInactivityGuard() {
  const router = useRouter();
  const resetForUser = useAppStore((s) => s.resetForUser);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMouseMoveRef = useRef(0);
  const lastSessionRefreshRef = useRef(0);
  const signingOutRef = useRef(false);

  useEffect(() => {
    function clearIdleTimer() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    async function handleIdleTimeout() {
      if (signingOutRef.current) return;
      signingOutRef.current = true;

      try {
        resetForUser(null);
        await authClient.signOut();
      } catch {
        // Si falla el sign-out remoto, igual redirigimos al login.
      }

      router.replace("/login?alert=session_expired");
      router.refresh();
    }

    function scheduleIdleTimer() {
      clearIdleTimer();
      timeoutRef.current = setTimeout(() => {
        void handleIdleTimeout();
      }, SESSION_IDLE_TIMEOUT_MS);
    }

    function refreshServerSession() {
      const now = Date.now();
      if (now - lastSessionRefreshRef.current < SESSION_REFRESH_MS) return;
      lastSessionRefreshRef.current = now;
      void authClient.getSession();
    }

    function onActivity() {
      scheduleIdleTimer();
      refreshServerSession();
    }

    function onMouseMove() {
      const now = Date.now();
      if (now - lastMouseMoveRef.current < MOUSEMOVE_THROTTLE_MS) return;
      lastMouseMoveRef.current = now;
      scheduleIdleTimer();
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    scheduleIdleTimer();

    return () => {
      clearIdleTimer();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [router, resetForUser]);

  return null;
}
