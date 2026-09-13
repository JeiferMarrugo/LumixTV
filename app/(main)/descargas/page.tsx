import { Suspense } from "react";
import { DownloadsView } from "@/components/features/DownloadsView";
import { StreamingLoader } from "@/components/ui/StreamingLoader";

function DescargasFallback() {
  return (
    <div className="px-4 py-8 sm:px-8">
      <StreamingLoader />
    </div>
  );
}

export default function DescargasPage() {
  return (
    <Suspense fallback={<DescargasFallback />}>
      <DownloadsView />
    </Suspense>
  );
}
