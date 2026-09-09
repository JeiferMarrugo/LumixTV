"use client";

import { CatalogGate } from "@/components/features/CatalogGate";

export function SeriesView() {
  return (
    <CatalogGate
      vimeusEndpoint="series"
      tmdbEndpoint="tv"
      title="Series"
      subtitle="Las mejores series para maratonear"
    />
  );
}
