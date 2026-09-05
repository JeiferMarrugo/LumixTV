import { SeriesView } from "@/components/features/SeriesView";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { Suspense } from "react";

function SeriesFallback() {
  return (
    <div className="px-8 py-8">
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
