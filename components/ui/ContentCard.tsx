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
  const href = item.type === "live" ? "/live-tv" : contentHref(item.id);

  function handlePlay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (item.type === "live") {
      router.push("/live-tv");
      return;
    }
    router.push(contentHref(item.id));
  }

  return (
    <Link href={href} className="group block">
      <article>
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-overlay shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-gold-500/25 group-hover:shadow-[0_16px_40px_rgba(212,160,23,0.12)]">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover brightness-[1.03] saturate-[1.05] transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 200px"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-70" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />

          {item.type !== "live" && (
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
          )}

          <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border border-gold-500/20 bg-black/60 px-2.5 py-1 text-xs font-bold text-gold-400 backdrop-blur-md">
            <Star size={11} className="fill-gold-400 text-gold-400" />
            {item.rating.toFixed(1)}
          </div>

          {item.type === "live" && (
            <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-600/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              En Vivo
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <h3 className="mt-3 truncate text-sm font-semibold tracking-wide text-white transition-colors group-hover:text-gold-400">
          {item.title}
        </h3>
        <div className="mt-2 flex gap-2">
          <span className="rounded-full border border-white/5 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-zinc-400">
            {item.genre}
          </span>
          <span className="rounded-full border border-white/5 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-zinc-500">
            {item.year}
          </span>
        </div>
      </article>
    </Link>
  );
}
