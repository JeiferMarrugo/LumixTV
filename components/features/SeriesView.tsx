"use client";

import { TmdbCatalogView } from "@/components/features/TmdbCatalogView";

export function SeriesView() {
  return (
    <TmdbCatalogView
      endpoint="tv"
      title="Series"
      subtitle="Las mejores series para maratonear"
    />
  );
}
