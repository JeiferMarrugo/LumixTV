import { CatalogGate } from "@/components/features/CatalogGate";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { Suspense } from "react";

function AnimeFallback() {
  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <StreamingLoader />
    </div>
  );
}

export default function AnimePage() {
  return (
    <Suspense fallback={<AnimeFallback />}>
      <CatalogGate
        vimeusEndpoint="animes"
        tmdbEndpoint="tv"
        title="Anime"
        subtitle="Tu destino para el mejor anime"
        vimeusOnly
      />
    </Suspense>
  );
}
