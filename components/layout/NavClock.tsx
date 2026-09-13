"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const timeFormatter = new Intl.DateTimeFormat("es-CO", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

interface NavClockProps {
  compact?: boolean;
  className?: string;
}

export function NavClock({ compact = false, className }: NavClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-xl bg-muted",
          compact ? "h-9 w-20" : "h-10 w-28",
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        "flex select-none flex-col justify-center rounded-xl border border-border bg-background/80 px-2 backdrop-blur-sm sm:px-3",
        compact ? "h-9 min-w-[4.75rem] sm:min-w-[5.5rem]" : "h-10 min-w-[5.5rem] sm:min-w-[6.75rem]",
        className,
      )}
    >
      <time
        dateTime={now.toISOString()}
        className="text-center text-[11px] font-semibold tabular-nums leading-none text-foreground sm:text-sm"
      >
        {timeFormatter.format(now)}
      </time>
      {!compact && (
        <span className="mt-0.5 text-center text-[10px] capitalize leading-none text-muted-foreground">
          {dateFormatter.format(now)}
        </span>
      )}
    </div>
  );
}
