import { SeriesView } from "@/components/features/SeriesView";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { Suspense } from "react";

function SeriesFallback() {
  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <StreamingLoader />
    </div>
  );
}

export default function SeriesPage() {
  return (
    <Suspense fallback={<SeriesFallback />}>
      <SeriesView />
    </Suspense>
  );
}
