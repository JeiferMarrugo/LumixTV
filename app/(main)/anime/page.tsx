import { CatalogGate } from "@/components/features/CatalogGate";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { Suspense } from "react";

function AnimeFallback() {
  return (
    <div className="px-8 py-8">
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
