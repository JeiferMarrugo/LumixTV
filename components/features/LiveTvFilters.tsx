"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryState } from "nuqs";
import { Globe2, Radio } from "lucide-react";
import { liveSearchParams } from "@/lib/nuqs/live-parsers";
import type { LiveCategoryOption, LiveCountryOption } from "@/lib/live-tv/types";
import { DetailSelect } from "@/components/ui/DetailSelect";
import {
  ActiveFiltersBar,
  FilterChip,
  FilterChipRow,
  FilterClearButton,
  FilterDivider,
  FilterFieldLabel,
  FilterPanel,
  FilterSearch,
} from "@/components/ui/filter-kit";

interface LiveTvFiltersProps {
  categories: LiveCategoryOption[];
  countries: LiveCountryOption[];
}

export function LiveTvFilters({ categories, countries }: LiveTvFiltersProps) {
  const [q, setQ] = useQueryState("q", liveSearchParams.q);
  const [country, setCountry] = useQueryState("country", liveSearchParams.country);
  const [category, setCategory] = useQueryState("category", liveSearchParams.category);
  const [hd, setHd] = useQueryState("hd", liveSearchParams.hd);

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

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalQuery("");
    setQ(null);
  }

  const hasFilters = Boolean(localQuery.trim() || country || category || hd);

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
    localQuery.trim() && { key: "q", label: `"${localQuery.trim()}"`, onRemove: clearSearch },
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

  return (
    <div className="relative z-10 mb-6">
      <FilterPanel>
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <FilterSearch
                value={localQuery}
                onChange={handleSearchChange}
                placeholder="Buscar canal por nombre..."
                aria-label="Buscar canal por nombre"
                onClear={clearSearch}
              />
            </div>

            <div className="flex items-end gap-3">
              <DetailSelect
                label="País"
                value={country || ""}
                onChange={(value) => setCountry(value || "")}
                options={countryOptions}
                menuMinWidth={260}
              />

              <button
                type="button"
                onClick={() => setHd(!hd)}
                className={
                  hd
                    ? "flex h-12 shrink-0 items-center gap-2 rounded-xl border border-gold-500/40 bg-gold-500/15 px-4 text-sm font-semibold text-gold-400 transition-all"
                    : "flex h-12 shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/35 px-4 text-sm text-zinc-400 transition-all hover:border-gold-500/25 hover:text-zinc-200"
                }
              >
                <Radio size={15} />
                Solo HD
              </button>
            </div>
          </div>

          <FilterDivider />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <FilterFieldLabel icon={Globe2} inline>
              Categoría
            </FilterFieldLabel>
            <div className="min-w-0 flex-1">
              <FilterChipRow deps={[categories, category]}>
                <FilterChip active={!category} onClick={() => setCategory("")}>
                  Todas
                </FilterChip>
                {categories.map((c) => (
                  <FilterChip
                    key={c.id}
                    active={category === c.id}
                    onClick={() => setCategory(c.id)}
                  >
                    {c.name} · {c.count}
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
