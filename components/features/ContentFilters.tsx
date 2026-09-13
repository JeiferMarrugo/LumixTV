"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryState } from "nuqs";
import { Calendar, SlidersHorizontal, Sparkles, Tag } from "lucide-react";
import { searchParams } from "@/lib/nuqs/parsers";
import { YearCalendarPicker } from "@/components/ui/YearCalendarPicker";
import {
  ActiveFiltersBar,
  FilterChip,
  FilterChipGrid,
  FilterChipRow,
  FilterClearButton,
  FilterDivider,
  FilterFieldLabel,
  FilterPanel,
  FilterRatingPills,
  FilterSearch,
  FilterToolbar,
  FilterViewToggle,
} from "@/components/ui/filter-kit";
import { cn } from "@/lib/utils";

const DEFAULT_GENRES = ["Acción", "Drama", "Comedia", "Ciencia ficción", "Terror", "Animación"];
const currentYear = new Date().getFullYear();

interface ContentFiltersProps {
  genres?: string[];
  searchPlaceholder?: string;
}

export function ContentFilters({
  genres = DEFAULT_GENRES,
  searchPlaceholder = "Buscar por título...",
}: ContentFiltersProps) {
  const [genre, setGenre] = useQueryState("genre", searchParams.genre);
  const [year, setYear] = useQueryState("year", searchParams.year);
  const [minRating, setMinRating] = useQueryState("minRating", searchParams.minRating);
  const [view, setView] = useQueryState("view", searchParams.view);
  const [q, setQ] = useQueryState("q", searchParams.q);

  const [localQuery, setLocalQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const activeGenre = genre || "";
  const hasFilters = Boolean(
    localQuery.trim() || q?.trim() || activeGenre || year || minRating,
  );
  const activeFilterCount = [localQuery.trim() || q?.trim(), activeGenre, year, minRating].filter(
    Boolean,
  ).length;

  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalQuery(q || "");
    }
  }, [q]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSearchChange(value: string) {
    isTypingRef.current = true;
    setLocalQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void setQ(value.trim() || null);
      isTypingRef.current = false;
    }, 350);
  }

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    isTypingRef.current = false;
    setLocalQuery("");
    void setQ(null);
  }

  function clearAll() {
    clearSearch();
    setGenre("");
    setYear(null);
    setMinRating(null);
  }

  const activeFilterChips = [
    (localQuery.trim() || q?.trim()) && {
      key: "q",
      label: `"${(localQuery.trim() || q?.trim()) ?? ""}"`,
      onRemove: clearSearch,
    },
    activeGenre && {
      key: "genre",
      label: activeGenre,
      onRemove: () => setGenre(""),
    },
    year && {
      key: "year",
      label: String(year),
      onRemove: () => setYear(null),
    },
    minRating && {
      key: "minRating",
      label: `${minRating}+`,
      onRemove: () => setMinRating(null),
    },
  ].filter(Boolean) as { key: string; label: string; onRemove: (() => void) | null }[];

  const genreChips = (
    <>
      <FilterChip active={!activeGenre} onClick={() => setGenre("")}>
        Todos
      </FilterChip>
      {genres.map((g) => (
        <FilterChip key={g} active={activeGenre === g} onClick={() => setGenre(g)}>
          {g}
        </FilterChip>
      ))}
    </>
  );

  const refineControls = (
    <FilterToolbar>
      <div className="w-full min-w-[140px] sm:w-44">
        <FilterFieldLabel icon={Calendar}>Año</FilterFieldLabel>
        <YearCalendarPicker
          value={year}
          onChange={setYear}
          minYear={1900}
          maxYear={currentYear}
          placeholder="Cualquier año"
        />
      </div>

      <div>
        <FilterFieldLabel icon={Sparkles} className="sr-only">
          Rating mínimo
        </FilterFieldLabel>
        <FilterRatingPills value={minRating} onChange={setMinRating} />
      </div>

      <FilterViewToggle view={view === "table" ? "table" : "grid"} onChange={setView} />

      {hasFilters && <FilterClearButton onClick={clearAll} />}
    </FilterToolbar>
  );

  return (
    <div className="relative z-10 mb-5 sm:mb-6">
      {/* Móvil */}
      <div className="space-y-3 lg:hidden">
        <FilterSearch
          value={localQuery}
          onChange={handleSearchChange}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          onClear={clearSearch}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
              expanded || hasFilters
                ? "border-gold-500/35 bg-gold-500/10 text-gold-700 dark:text-gold-400"
                : "border-border bg-muted/50 text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300",
            )}
          >
            <SlidersHorizontal size={16} />
            Refinar
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
                {activeFilterCount}
              </span>
            )}
          </button>
          <FilterViewToggle view={view === "table" ? "table" : "grid"} onChange={setView} />
        </div>

        {expanded && (
          <FilterPanel>
            <div className="space-y-4 p-4">
              {refineControls}
              <FilterDivider />
              <div>
                <FilterFieldLabel icon={Tag}>Género</FilterFieldLabel>
                <FilterChipRow deps={[genres, activeGenre]} fadeFrom="from-zinc-900">
                  {genreChips}
                </FilterChipRow>
              </div>
            </div>
          </FilterPanel>
        )}
      </div>

      {/* Escritorio */}
      <FilterPanel className="hidden lg:block">
        <div className="space-y-4 p-5">
          <FilterSearch
            value={localQuery}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            onClear={clearSearch}
          />

          {refineControls}

          <FilterDivider />

          <div className="flex items-start gap-4">
            <FilterFieldLabel icon={Tag} inline className="mt-2">
              Género
            </FilterFieldLabel>
            <div className="min-w-0 flex-1">
              <FilterChipGrid>{genreChips}</FilterChipGrid>
            </div>
          </div>
        </div>
      </FilterPanel>

      <ActiveFiltersBar chips={activeFilterChips} onClearAll={hasFilters ? clearAll : undefined} />
    </div>
  );
}
