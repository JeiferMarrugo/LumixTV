import { PeliculasView } from "@/components/features/PeliculasView";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { Suspense } from "react";

function PeliculasFallback() {
  return (
    <div className="px-8 py-8">
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
