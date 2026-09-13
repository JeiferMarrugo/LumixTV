import { PeliculasView } from "@/components/features/PeliculasView";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { Suspense } from "react";

function PeliculasFallback() {
  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <StreamingLoader />
    </div>
  );
}

export default function PeliculasPage() {
  return (
    <Suspense fallback={<PeliculasFallback />}>
      <PeliculasView />
    </Suspense>
  );
}
