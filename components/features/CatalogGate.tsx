"use client";

import { useEffect, useState } from "react";
import { TmdbCatalogView } from "@/components/features/TmdbCatalogView";
import { VimeusCatalogView } from "@/components/features/VimeusCatalogView";
import { StreamingLoader } from "@/components/ui/StreamingLoader";

interface CatalogGateProps {
  vimeusEndpoint: "movies" | "series" | "animes";
  tmdbEndpoint: "movies" | "tv";
  title: string;
  subtitle: string;
  vimeusOnly?: boolean;
}

export function CatalogGate({
  vimeusEndpoint,
  tmdbEndpoint,
  title,
  subtitle,
  vimeusOnly = false,
}: CatalogGateProps) {
  const [useVimeus, setUseVimeus] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function check() {
      try {
        const res = await fetch("/api/vimeus/status", { signal: controller.signal });
        const data = (await res.json()) as { apiConfigured?: boolean };
        if (!controller.signal.aborted) {
          setUseVimeus(Boolean(data.apiConfigured));
        }
      } catch {
        if (!controller.signal.aborted) {
          setUseVimeus(false);
        }
      }
    }

    void check();
    return () => controller.abort();
  }, []);

  if (useVimeus === null) {
    return (
      <div className="px-8 py-16">
        <StreamingLoader label="Cargando catálogo..." />
      </div>
    );
  }

  if (useVimeus) {
    return (
      <VimeusCatalogView
        endpoint={vimeusEndpoint}
        title={title}
        subtitle={subtitle}
      />
    );
  }

  if (vimeusOnly) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-sm text-zinc-400">
          El catálogo de anime no está disponible en este momento.
        </p>
      </div>
    );
  }

  return (
    <TmdbCatalogView endpoint={tmdbEndpoint} title={title} subtitle={subtitle} />
  );
}
