"use client";

import { TmdbCatalogView } from "@/components/features/TmdbCatalogView";

export function PeliculasView() {
  return (
    <TmdbCatalogView
      endpoint="movies"
      title="Películas"
      subtitle="Explora nuestro catálogo de películas"
    />
  );
}
