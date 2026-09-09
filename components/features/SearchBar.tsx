"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { searchParams } from "@/lib/nuqs/parsers";
import { Search, X } from "lucide-react";
import {
  SearchResultsDropdown,
  type SearchResultsPayload,
} from "@/components/features/SearchResultsDropdown";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  autoFocus?: boolean;
  onClose?: () => void;
  className?: string;
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function SearchInput({ autoFocus = false, onClose, className }: SearchInputProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useQueryState("q", searchParams.q);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultsPayload | null>(null);

  const trimmedQuery = query?.trim() ?? "";
  const debouncedQuery = useDebouncedValue(trimmedQuery, 320);
  const hasQuery = Boolean(trimmedQuery);
  const showDropdown = focused && debouncedQuery.length >= 2;

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=6`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as SearchResultsPayload;

        if (!controller.signal.aborted) {
          setResults(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (document.activeElement === inputRef.current) {
          setQuery(null);
          setResults(null);
          inputRef.current?.blur();
          onClose?.();
        }
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setFocused(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [onClose, setQuery]);

  function handleClear() {
    setQuery(null);
    setResults(null);
    onClose?.();
    inputRef.current?.blur();
  }

  function closeDropdown() {
    setFocused(false);
    onClose?.();
  }

  function goToSearchPage() {
    if (!trimmedQuery) return;
    router.push(`/buscar?q=${encodeURIComponent(trimmedQuery)}`);
    closeDropdown();
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className={cn("group/search relative w-full", className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within/search:text-gold-500/80"
      />
      <input
        ref={inputRef}
        type="text"
        role="searchbox"
        autoComplete="off"
        enterKeyHint="search"
        aria-label="Buscar películas, series o anime"
        aria-expanded={showDropdown}
        aria-controls="search-results-dropdown"
        value={query ?? ""}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value.trim() ? value : null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            goToSearchPage();
          }
        }}
        onBlur={() => {
          if (!trimmedQuery) onClose?.();
        }}
        placeholder="Buscar películas, series o anime..."
        className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-10 pr-20 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-gold-500/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-gold-500/15"
      />

      <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1.5">
        {(hasQuery || onClose) && (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={hasQuery ? "Borrar búsqueda" : "Cerrar búsqueda"}
          >
            <X size={14} />
          </button>
        )}
        <kbd className="hidden rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 lg:inline-block">
          Ctrl K
        </kbd>
      </div>

      {showDropdown && (
        <div id="search-results-dropdown">
          <SearchResultsDropdown
            results={results}
            loading={loading}
            query={debouncedQuery}
            onSelect={closeDropdown}
          />
        </div>
      )}
    </div>
  );
}

function SearchInputFallback() {
  return <div className="h-10 w-full animate-pulse rounded-xl bg-white/[0.04]" />;
}

interface ExpandableSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "field" | "trigger";
  className?: string;
}

export function ExpandableSearch({
  open,
  onOpenChange,
  variant = "field",
  className,
}: ExpandableSearchProps) {
  const [query, setQuery] = useQueryState("q", searchParams.q);
  const previousQuery = useRef(query);

  useEffect(() => {
    const trimmed = query?.trim() ?? "";

    if (trimmed) {
      onOpenChange(true);
    } else if (previousQuery.current?.trim() && !trimmed) {
      onOpenChange(false);
    }

    previousQuery.current = query;
  }, [query, onOpenChange]);

  function handleClose() {
    setQuery(null);
    onOpenChange(false);
  }

  if (variant === "trigger") {
    if (open) return null;

    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        aria-label="Abrir búsqueda"
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors hover:border-gold-500/30 hover:text-gold-400",
          className,
        )}
      >
        <Search size={18} />
      </button>
    );
  }

  if (!open) return null;

  return (
    <div className={cn("relative w-full", className)}>
      <Suspense fallback={<SearchInputFallback />}>
        <SearchInput autoFocus onClose={handleClose} />
      </Suspense>
    </div>
  );
}

export function SearchBar({ embedded = false }: { embedded?: boolean }) {
  return (
    <Suspense fallback={<SearchInputFallback />}>
      <SearchInput className={embedded ? undefined : "max-w-xl"} />
    </Suspense>
  );
}
