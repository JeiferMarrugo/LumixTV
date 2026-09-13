"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryState } from "nuqs";
import { Globe2, Radio, SlidersHorizontal, Tag } from "lucide-react";
import { liveSearchParams } from "@/lib/nuqs/live-parsers";
import type { LiveCategoryOption, LiveCountryOption } from "@/lib/live-tv/types";
import { DetailSelect } from "@/components/ui/DetailSelect";
import {
  ActiveFiltersBar,
  FilterChip,
  FilterChipGrid,
  FilterChipRow,
  FilterClearButton,
  FilterDivider,
  FilterFieldLabel,
  FilterPanel,
  FilterSearch,
  FilterToolbar,
} from "@/components/ui/filter-kit";
import { cn } from "@/lib/utils";

interface LiveTvFiltersProps {
  categories: LiveCategoryOption[];
  countries: LiveCountryOption[];
}

function CategoryChips({
  categories,
  category,
  onSelect,
}: {
  categories: LiveCategoryOption[];
  category: string;
  onSelect: (value: string) => void;
}) {
  return (
    <>
      <FilterChip active={!category} onClick={() => onSelect("")}>
        Todas
      </FilterChip>
      {categories.map((c) => (
        <FilterChip key={c.id} active={category === c.id} onClick={() => onSelect(c.id)}>
          {c.name}
          <span className="ml-1.5 text-[10px] opacity-60">{c.count}</span>
        </FilterChip>
      ))}
    </>
  );
}

export function LiveTvFilters({ categories, countries }: LiveTvFiltersProps) {
  const [canal, setCanal] = useQueryState("canal", liveSearchParams.canal);
  const [country, setCountry] = useQueryState("country", liveSearchParams.country);
  const [category, setCategory] = useQueryState("category", liveSearchParams.category);
  const [hd, setHd] = useQueryState("hd", liveSearchParams.hd);

  const [localQuery, setLocalQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalQuery(canal || "");
    }
  }, [canal]);

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
      void setCanal(value.trim() || null);
      isTypingRef.current = false;
    }, 350);
  }

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    isTypingRef.current = false;
    setLocalQuery("");
    void setCanal(null);
  }

  const hasFilters = Boolean(localQuery.trim() || country || category || hd);
  const activeFilterCount = [localQuery.trim(), country, category, hd].filter(Boolean).length;

  function clearAll() {
    clearSearch();
    setCountry("");
    setCategory("");
    setHd(false);
  }

  const countryOptions = [
    { value: "", label: "Todos los países" },
    ...countries.map((c) => ({
      value: c.code,
      label: `${c.flag ? `${c.flag} ` : ""}${c.name} (${c.count})`,
      badge: c.code,
    })),
  ];

  const activeFilterChips = [
    localQuery.trim() && { key: "canal", label: `"${localQuery.trim()}"`, onRemove: clearSearch },
    country && {
      key: "country",
      label: countries.find((c) => c.code === country)?.name ?? country,
      onRemove: () => setCountry(""),
    },
    category && {
      key: "category",
      label: categories.find((c) => c.id === category)?.name ?? category,
      onRemove: () => setCategory(""),
    },
    hd && { key: "hd", label: "Solo HD", onRemove: () => setHd(false) },
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[];

  const hdToggle = (
    <button
      type="button"
      onClick={() => setHd(!hd)}
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all",
        hd
          ? "border-gold-500/40 bg-gradient-to-r from-gold-500/20 to-amber-500/10 text-gold-700 shadow-[0_4px_20px_rgba(212,160,23,0.15)] dark:text-gold-300"
          : "border-border bg-muted/60 text-muted-foreground hover:border-gold-500/30 hover:text-foreground dark:border-white/[0.08] dark:bg-black/35 dark:text-zinc-400 dark:hover:text-zinc-200",
      )}
    >
      <Radio size={15} />
      Solo HD
    </button>
  );

  const toolbar = (
    <FilterToolbar>
      <div className="w-full min-w-[160px] sm:w-56">
        <DetailSelect
          label="País"
          value={country || ""}
          onChange={(value) => setCountry(value || "")}
          options={countryOptions}
          menuMinWidth={280}
        />
      </div>
      {hdToggle}
      {hasFilters && <FilterClearButton onClick={clearAll} />}
    </FilterToolbar>
  );

  const categorySection = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
      <FilterFieldLabel icon={Tag} inline className="lg:mt-2">
        Categoría
      </FilterFieldLabel>
      <div className="min-w-0 flex-1">
        <div className="lg:hidden">
          <FilterChipRow deps={[categories, category]}>
            <CategoryChips
              categories={categories}
              category={category || ""}
              onSelect={(value) => setCategory(value)}
            />
          </FilterChipRow>
        </div>
        <div className="hidden lg:block">
          <FilterChipGrid>
            <CategoryChips
              categories={categories}
              category={category || ""}
              onSelect={(value) => setCategory(value)}
            />
          </FilterChipGrid>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative z-10 mb-5 sm:mb-6">
      <div className="space-y-3 lg:hidden">
        <FilterSearch
          value={localQuery}
          onChange={handleSearchChange}
          placeholder="Buscar canal en vivo..."
          aria-label="Buscar canal por nombre"
          onClear={clearSearch}
        />

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
            expanded || hasFilters
              ? "border-gold-500/35 bg-gold-500/10 text-gold-700 dark:text-gold-400"
              : "border-border bg-muted/50 text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300",
          )}
        >
          <SlidersHorizontal size={16} />
          Filtros
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
              {activeFilterCount}
            </span>
          )}
        </button>

        {expanded && (
          <FilterPanel>
            <div className="space-y-4 p-4">
              {toolbar}
              <FilterDivider />
              {categorySection}
            </div>
          </FilterPanel>
        )}
      </div>

      <FilterPanel className="hidden lg:block">
        <div className="space-y-4 p-5">
          <FilterSearch
            value={localQuery}
            onChange={handleSearchChange}
            placeholder="Buscar canal en vivo..."
            aria-label="Buscar canal por nombre"
            onClear={clearSearch}
          />

          {toolbar}

          <FilterDivider />

          {categorySection}
        </div>
      </FilterPanel>

      <ActiveFiltersBar chips={activeFilterChips} onClearAll={hasFilters ? clearAll : undefined} />
    </div>
  );
}
