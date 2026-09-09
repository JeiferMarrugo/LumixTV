"use client";

import { CatalogGate } from "@/components/features/CatalogGate";

export function PeliculasView() {
  return (
    <CatalogGate
      vimeusEndpoint="movies"
      tmdbEndpoint="movies"
      title="Películas"
      subtitle="Explora nuestro catálogo de películas"
    />
  );
}
