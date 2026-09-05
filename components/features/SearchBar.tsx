"use client";

import { useQueryState } from "nuqs";
import { searchParams } from "@/lib/nuqs/parsers";
import { Search } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useQueryState("q", searchParams.q);

  return (
    <div className="relative max-w-xl flex-1">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value || null)}
        placeholder="Buscar películas, series o reparto..."
        className="w-full rounded-full border border-border-subtle bg-surface-raised py-2.5 pl-11 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30"
      />
    </div>
  );
}
