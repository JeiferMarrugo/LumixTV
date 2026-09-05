"use client";

import { useQueryState } from "nuqs";
import { searchParams } from "@/lib/nuqs/parsers";
import { LayoutGrid, Table2, X } from "lucide-react";

const DEFAULT_GENRES = ["Acción", "Drama", "Comedia", "Ciencia ficción", "Terror", "Animación"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 12 }, (_, i) => currentYear - i);

interface ContentFiltersProps {
  genres?: string[];
}

export function ContentFilters({ genres = DEFAULT_GENRES }: ContentFiltersProps) {
  const [genre, setGenre] = useQueryState("genre", searchParams.genre);
  const [year, setYear] = useQueryState("year", searchParams.year);
  const [minRating, setMinRating] = useQueryState("minRating", searchParams.minRating);
  const [view, setView] = useQueryState("view", searchParams.view);

  const hasFilters = genre || year || minRating;

  function clearAll() {
    setGenre(null);
    setYear(null);
    setMinRating(null);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select
        value={genre}
        onChange={(e) => setGenre(e.target.value || null)}
        className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-zinc-300 outline-none focus:border-gold-500/50"
      >
        <option value="">Todos los géneros</option>
        {genres.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        value={year ?? ""}
        onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
        className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-zinc-300 outline-none focus:border-gold-500/50"
      >
        <option value="">Todos los años</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <div className="flex gap-1">
        {[3, 4].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => setMinRating(minRating === rating ? null : rating)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              minRating === rating
                ? "bg-gold-500/20 text-gold-500"
                : "border border-border-subtle text-zinc-400 hover:text-white"
            }`}
          >
            {rating}+ ★
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-gold-500"
          >
            <X size={14} />
            Limpiar
          </button>
        )}

        <div className="flex rounded-lg border border-border-subtle p-0.5">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`rounded-md p-2 transition-colors ${
              view === "grid" ? "bg-gold-500/20 text-gold-500" : "text-zinc-500 hover:text-white"
            }`}
            aria-label="Vista grid"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded-md p-2 transition-colors ${
              view === "table" ? "bg-gold-500/20 text-gold-500" : "text-zinc-500 hover:text-white"
            }`}
            aria-label="Vista tabla"
          >
            <Table2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
