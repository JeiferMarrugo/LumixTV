"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryState } from "nuqs";
import { Globe, SlidersHorizontal, Tag } from "lucide-react";
import type { IptvCategory } from "@/lib/iptv/types";
import { LIVE_COUNTRY_OPTIONS } from "@/lib/iptv/constants";
import { liveTvSearchParams } from "@/lib/nuqs/live-parsers";
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
  categories?: IptvCategory[];
  hideCategories?: boolean;
  searchPlaceholder?: string;
}

export function LiveTvFilters({
  categories = [],
  hideCategories = false,
  searchPlaceholder = "Buscar canal por nombre (ESPN, Win Sports, TyC...)",
}: LiveTvFiltersProps) {
  const [country, setCountry] = useQueryState("country", liveTvSearchParams.country);
  const [category, setCategory] = useQueryState("category", liveTvSearchParams.category);
  const [stream, setStream] = useQueryState("stream", liveTvSearchParams.stream);
  const [hd, setHd] = useQueryState("hd", liveTvSearchParams.hd);
  const [search, setSearch] = useQueryState("search", liveTvSearchParams.search);

  const [localQuery, setLocalQuery] = useState(search || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const workingOnly = stream !== "all";

  useEffect(() => {
    setLocalQuery(search || "");
  }, [search]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSearchChange(value: string) {
    setLocalQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value.trim() || null);
    }, 350);
  }

  const activeCategory = category || "";
  const hasFilters = Boolean(localQuery.trim() || activeCategory || !workingOnly || hd);

  const countryLabel =
    LIVE_COUNTRY_OPTIONS.find((opt) => opt.code === country)?.name ?? country;

  function clearAll() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalQuery("");
    setSearch(null);
    setCategory(null);
    setStream(null);
    setHd(null);
  }

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocalQuery("");
    setSearch(null);
  }

  const activeFilterChips = [
    {
      key: "country",
      label: countryLabel,
      onRemove: null as (() => void) | null,
    },
    localQuery.trim() && {
      key: "q",
      label: `"${localQuery.trim()}"`,
      onRemove: clearSearch,
    },
    activeCategory && {
      key: "category",
      label: categories.find((cat) => cat.id === activeCategory)?.name ?? activeCategory,
      onRemove: () => setCategory(null),
    },
    !workingOnly && {
      key: "stream",
      label: "Incluye sin señal",
      onRemove: () => setStream(null),
    },
    hd && {
      key: "hd",
      label: "HD+",
      onRemove: () => setHd(null),
    },
  ].filter(Boolean) as { key: string; label: string; onRemove: (() => void) | null }[];

  return (
    <div className="relative z-10 mb-6">
      <FilterPanel>
        <div className="p-4 sm:p-5">
          <FilterSearch
            value={localQuery}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            aria-label="Buscar canal"
            onClear={clearSearch}
          />

          <FilterDivider />

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <FilterFieldLabel icon={SlidersHorizontal} inline>
                Señal
              </FilterFieldLabel>
              <div className="min-w-0 flex-1">
                <FilterChipRow deps={[workingOnly, hd]}>
                  <FilterChip
                    active={workingOnly}
                    onClick={() => void setStream(workingOnly ? "all" : null)}
                  >
                    Solo activos
                  </FilterChip>
                  <FilterChip
                    active={Boolean(hd)}
                    onClick={() => void setHd(hd ? null : true)}
                  >
                    HD+
                  </FilterChip>
                </FilterChipRow>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <FilterFieldLabel icon={Globe} inline>
                País
              </FilterFieldLabel>
              <div className="min-w-0 flex-1">
                <FilterChipRow deps={[country]}>
                  {LIVE_COUNTRY_OPTIONS.map((opt) => (
                    <FilterChip
                      key={opt.code}
                      active={country === opt.code}
                      onClick={() => setCountry(opt.code)}
                    >
                      {opt.flag} {opt.name}
                    </FilterChip>
                  ))}
                </FilterChipRow>
              </div>
            </div>

            {!hideCategories && categories.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <FilterFieldLabel icon={Tag} inline>
                  Categoría
                </FilterFieldLabel>
                <div className="min-w-0 flex-1">
                  <FilterChipRow deps={[categories, activeCategory]}>
                    <FilterChip active={!activeCategory} onClick={() => setCategory(null)}>
                      Todas
                    </FilterChip>
                    {categories.map((cat) => (
                      <FilterChip
                        key={cat.id}
                        active={activeCategory === cat.id}
                        onClick={() => setCategory(cat.id)}
                      >
                        {cat.name}
                      </FilterChip>
                    ))}
                  </FilterChipRow>
                </div>
              </div>
            )}

            {hasFilters && (
              <div className="flex justify-end">
                <FilterClearButton onClick={clearAll} />
              </div>
            )}
          </div>
        </div>
      </FilterPanel>

      <ActiveFiltersBar chips={activeFilterChips} onClearAll={hasFilters ? clearAll : undefined} />
    </div>
  );
}
