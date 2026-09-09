"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryState } from "nuqs";
import { Calendar, Tag } from "lucide-react";
import { searchParams } from "@/lib/nuqs/parsers";
import { YearCalendarPicker } from "@/components/ui/YearCalendarPicker";
import {
  ActiveFiltersBar,
  FilterChip,
  FilterChipRow,
  FilterClearButton,
  FilterDivider,
  FilterFieldLabel,
  FilterPanel,
  FilterSearch,
  FilterViewToggle,
} from "@/components/ui/filter-kit";

const DEFAULT_GENRES = ["Acción", "Drama", "Comedia", "Ciencia ficción", "Terror", "Animación"];
const currentYear = new Date().getFullYear();

const SEARCH_PLACEHOLDERS = {
  movies: "Buscar películas por título...",
  series: "Buscar series por título...",
  anime: "Buscar anime por título...",
} as const;

type CatalogCategory = keyof typeof SEARCH_PLACEHOLDERS;

interface ContentFiltersProps {
  genres?: string[];
  category?: CatalogCategory;
}

export function ContentFilters({
  genres = DEFAULT_GENRES,
  category = "movies",
}: ContentFiltersProps) {
  const [genre, setGenre] = useQueryState("genre", searchParams.genre);
  const [year, setYear] = useQueryState("year", searchParams.year);
  const [view, setView] = useQueryState("view", searchParams.view);
  const [q, setQ] = useQueryState("q", searchParams.q);

  const [localQuery, setLocalQuery] = useState(q || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalQuery(q || "");
  }, [q]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSearchChange(value: string) {
    setLocalQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQ(value.trim() || null);
    }, 350);
  }

  const activeGenre = genre || "";
  const hasFilters = Boolean(localQuery.trim() || activeGenre || year);

  function clearAll() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalQuery("");
    setQ(null);
    setGenre("");
    setYear(null);
  }

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalQuery("");
    setQ(null);
  }

  const activeFilterChips = [
    localQuery.trim() && {
      key: "q",
      label: `"${localQuery.trim()}"`,
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
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[];

  return (
    <div className="relative z-10 mb-6">
      <FilterPanel>
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <FilterSearch
                value={localQuery}
                onChange={handleSearchChange}
                placeholder={SEARCH_PLACEHOLDERS[category]}
                aria-label={SEARCH_PLACEHOLDERS[category]}
                onClear={clearSearch}
              />
            </div>

            <div className="flex items-end gap-3">
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

              <FilterViewToggle
                view={view === "table" ? "table" : "grid"}
                onChange={setView}
              />
            </div>
          </div>

          <FilterDivider />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <FilterFieldLabel icon={Tag} inline>
              Género
            </FilterFieldLabel>
            <div className="min-w-0 flex-1">
              <FilterChipRow deps={[genres, activeGenre]}>
                <FilterChip active={!activeGenre} onClick={() => setGenre("")}>
                  Todos
                </FilterChip>
                {genres.map((g) => (
                  <FilterChip key={g} active={activeGenre === g} onClick={() => setGenre(g)}>
                    {g}
                  </FilterChip>
                ))}
              </FilterChipRow>
            </div>

            {hasFilters && <FilterClearButton onClick={clearAll} />}
          </div>
        </div>
      </FilterPanel>

      <ActiveFiltersBar chips={activeFilterChips} onClearAll={clearAll} />
    </div>
  );
}
