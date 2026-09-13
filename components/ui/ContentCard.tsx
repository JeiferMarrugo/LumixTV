"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Star } from "lucide-react";
import type { ContentItem } from "@/lib/data";
import { contentHref } from "@/lib/content-id";

interface ContentCardProps {
  item: ContentItem;
}

export function ContentCard({ item }: ContentCardProps) {
  const router = useRouter();
  const href = contentHref(item.id);

  function handlePlay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push(contentHref(item.id));
  }

  return (
    <Link href={href} className="group block text-zinc-900 dark:text-zinc-100">
      <article>
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-border bg-muted shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-gold-500/30 group-hover:shadow-[0_16px_40px_rgba(212,160,23,0.12)] dark:border-white/[0.06] dark:bg-surface-overlay dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover brightness-[1.03] saturate-[1.05] transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 200px"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-70" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />

          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button
              type="button"
              onClick={handlePlay}
              className="rounded-full bg-gold-500 p-3.5 text-black shadow-lg transition-transform hover:scale-110"
              aria-label={`Reproducir ${item.title}`}
            >
              <Play size={22} fill="currentColor" />
            </button>
          </div>

          <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border border-gold-500/25 bg-background/90 px-2.5 py-1 text-xs font-bold text-gold-700 backdrop-blur-md dark:border-gold-500/20 dark:bg-black/60 dark:text-gold-400">
            <Star size={11} className="fill-gold-400 text-gold-400" />
            {item.rating.toFixed(1)}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <h3 className="mt-3 truncate text-sm font-semibold tracking-wide text-zinc-900 transition-colors group-hover:text-gold-700 dark:text-zinc-100 dark:group-hover:text-gold-400">
          {item.title}
        </h3>
        <div className="mt-2 flex gap-2">
          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] text-zinc-600 dark:border-white/5 dark:bg-white/[0.04] dark:text-zinc-400">
            {item.genre}
          </span>
          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] text-zinc-600 dark:border-white/5 dark:bg-white/[0.04] dark:text-zinc-400">
            {item.year}
          </span>
        </div>
      </article>
    </Link>
  );
}
