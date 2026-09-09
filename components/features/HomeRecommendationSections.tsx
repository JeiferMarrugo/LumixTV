"use client";

import { useEffect, useState } from "react";
import type { ContentItem } from "@/lib/data";
import { ContentRow } from "@/components/ui/ContentRow";
import { StreamingLoader } from "@/components/ui/StreamingLoader";

interface RecommendationSection {
  title: string;
  subtitle?: string | null;
  items: ContentItem[];
}

export function HomeRecommendationSections() {
  const [forYou, setForYou] = useState<RecommendationSection | null>(null);
  const [popular, setPopular] = useState<RecommendationSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/recommendations");
        const data = (await res.json()) as {
          forYou?: RecommendationSection;
          popular?: RecommendationSection;
          error?: string;
        };

        if (!res.ok || cancelled) return;

        if (data.forYou?.items?.length) setForYou(data.forYou);
        if (data.popular?.items?.length) setPopular(data.popular);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-28 items-center justify-center">
        <StreamingLoader size="sm" label="Preparando recomendaciones..." />
      </div>
    );
  }

  if (!forYou && !popular) return null;

  return (
    <>
      {forYou && forYou.items.length > 0 && (
        <ContentRow
          title={forYou.title}
          subtitle={forYou.subtitle ?? undefined}
          items={forYou.items}
          badge="PARA TI"
        />
      )}
      {popular && popular.items.length > 0 && (
        <ContentRow
          title={popular.title}
          subtitle={popular.subtitle ?? undefined}
          items={popular.items}
          badge="TOP"
        />
      )}
    </>
  );
}
