import { Suspense } from "react";
import { SearchResultsView } from "@/components/features/SearchResultsView";
import { StreamingLoader } from "@/components/ui/StreamingLoader";

function SearchFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <StreamingLoader label="Cargando búsqueda..." />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchResultsView />
    </Suspense>
  );
}
