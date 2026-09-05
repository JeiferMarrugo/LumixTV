import { ContentDetailView } from "@/components/features/ContentDetailView";

interface TitlePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ play?: string }>;
}

export default async function TitlePage({ params, searchParams }: TitlePageProps) {
  const { id } = await params;
  const { play } = await searchParams;

  return (
    <ContentDetailView
      id={decodeURIComponent(id)}
      autoPlay={play === "1"}
    />
  );
}
