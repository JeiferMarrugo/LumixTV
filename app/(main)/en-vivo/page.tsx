import { Suspense } from "react";
import { LiveTvView } from "@/components/features/LiveTvView";
import { StreamingLoader } from "@/components/ui/StreamingLoader";

function EnVivoFallback() {
  return (
    <div className="px-8 py-8">
      <StreamingLoader />
    </div>
  );
}

export default function EnVivoPage() {
  return (
    <Suspense fallback={<EnVivoFallback />}>
      <LiveTvView />
    </Suspense>
  );
}
