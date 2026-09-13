"use client";

import { Sun, Volume2, VolumeX } from "lucide-react";
import type { GestureFeedback } from "@/lib/hooks/use-immersive-player";
import { cn } from "@/lib/utils";

interface PlayerGestureFeedbackProps {
  feedback: GestureFeedback | null;
}

export function PlayerGestureFeedback({ feedback }: PlayerGestureFeedbackProps) {
  if (!feedback) return null;

  const isVolume = feedback.type === "volume";
  const percent = Math.round(feedback.value * 100);
  const muted = isVolume && feedback.value === 0;

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-1/2 z-40 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200",
        isVolume ? "right-6 sm:right-10" : "left-6 sm:left-10",
      )}
    >
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 shadow-xl backdrop-blur-md">
        {isVolume ? (
          muted ? (
            <VolumeX size={22} className="text-gold-400" />
          ) : (
            <Volume2 size={22} className="text-gold-400" />
          )
        ) : (
          <Sun size={22} className="text-gold-400" />
        )}

        <div className="h-24 w-1.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="w-full rounded-full bg-gradient-to-t from-gold-600 to-gold-400 transition-all duration-75"
            style={{ height: `${percent}%`, marginTop: `${100 - percent}%` }}
          />
        </div>

        <span className="text-[11px] font-semibold tabular-nums text-white">{percent}%</span>
      </div>
    </div>
  );
}
