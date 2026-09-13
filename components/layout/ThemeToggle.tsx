"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-xl bg-muted",
          compact ? "h-9 w-9" : "h-10 w-10",
        )}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex items-center justify-center rounded-xl border transition-all",
        "border-border bg-background/80 text-foreground backdrop-blur-sm",
        "hover:border-gold-500/35 hover:text-gold-600 dark:hover:text-gold-400",
        compact ? "h-9 w-9" : "h-10 w-10",
      )}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
    </button>
  );
}
