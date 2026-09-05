import { mockAnime } from "@/lib/data";
import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { FadeIn, FadeInStagger, StaggerItem } from "@/components/ui/motion";

export default function AnimePage() {
  return (
    <FadeIn className="px-8 py-8">
      <PageHeader
        title="Anime"
        subtitle="Tu destino para el mejor anime"
        count={mockAnime.length}
      />
      <FadeInStagger className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {mockAnime.map((anime) => (
          <StaggerItem key={anime.id}>
            <ContentCard item={anime} />
          </StaggerItem>
        ))}
      </FadeInStagger>
    </FadeIn>
  );
}
