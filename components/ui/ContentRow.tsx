import type { ContentItem } from "@/lib/data";
import { ContentCard } from "@/components/ui/ContentCard";

interface ContentRowProps {
  title: string;
  subtitle?: string;
  items: ContentItem[];
  badge?: string;
}

export function ContentRow({ title, subtitle, items, badge }: ContentRowProps) {
  return (
    <section>
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
          {badge && (
            <span className="rounded bg-gold-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-500">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
