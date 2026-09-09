import { ContentDetailView } from "@/components/features/ContentDetailView";
import { StreamingLoader } from "@/components/ui/StreamingLoader";
import { Suspense } from "react";

interface TitlePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ play?: string }>;
}

function TitleFallback() {
  return (
    <div className="flex min-h-[calc(100vh-4.25rem)] items-center justify-center bg-black">
      <StreamingLoader label="Abriendo la cartelera..." />
    </div>
  );
}

export default async function TitlePage({ params, searchParams }: TitlePageProps) {
  const { id } = await params;
  const { play } = await searchParams;

  return (
    <Suspense fallback={<TitleFallback />}>
      <ContentDetailView
        id={decodeURIComponent(id)}
        autoPlay={play === "1"}
      />
    </Suspense>
  );
}
