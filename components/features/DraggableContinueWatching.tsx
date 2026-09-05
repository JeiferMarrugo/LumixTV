"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useRouter } from "next/navigation";
import { GripVertical, Play } from "lucide-react";
import { getContentById } from "@/lib/data";
import { contentHref } from "@/lib/content-id";
import { useAppStore, type ContinueWatchingItem } from "@/lib/store/use-app-store";
import { formatRelativeDate } from "@/lib/temporal/dates";
import { FadeIn } from "@/components/ui/motion";

function getItemImage(item: ContinueWatchingItem) {
  return (
    item.image ??
    getContentById(item.id)?.image ??
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80"
  );
}

function DraggableItem({
  item,
  index,
  onReorder,
  onContinue,
}: {
  item: ContinueWatchingItem;
  index: number;
  onReorder: (from: number, to: number) => void;
  onContinue: (item: ContinueWatchingItem) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const image = getItemImage(item);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return draggable({
      element: el,
      getInitialData: () => ({ index, id: item.id }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [index, item.id]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ index }),
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: ({ source }) => {
        setIsOver(false);
        const from = source.data.index as number;
        if (from !== index) onReorder(from, index);
      },
    });
  }, [index, onReorder]);

  return (
    <div
      ref={ref}
      className={`w-[220px] shrink-0 cursor-grab overflow-hidden rounded-2xl border bg-surface-raised shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all active:cursor-grabbing ${
        isDragging ? "scale-95 opacity-50" : "hover:-translate-y-0.5 hover:border-gold-500/20 hover:shadow-[0_12px_32px_rgba(212,160,23,0.1)]"
      } ${isOver ? "border-gold-500/50 ring-1 ring-gold-500/30" : "border-white/[0.06]"}`}
    >
      <div className="relative aspect-video overflow-hidden bg-surface-overlay">
        <Image
          src={image}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="220px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
          <div
            className="h-full bg-gold-500"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical size={16} className="mt-0.5 shrink-0 text-zinc-600" />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                {item.episode && (
                  <p className="text-xs text-zinc-500">{item.episode}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onContinue(item)}
                className="shrink-0 rounded-full bg-gold-500 p-2 text-black transition-colors hover:bg-gold-400"
                aria-label="Continuar"
              >
                <Play size={14} fill="currentColor" />
              </button>
            </div>

            <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gold-500"
                style={{ width: `${item.progress}%` }}
              />
            </div>

            <p className="mt-1.5 text-[10px] text-zinc-600">
              {formatRelativeDate(item.watchedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DraggableContinueWatching() {
  const router = useRouter();
  const { continueWatching, reorderContinueWatching, startWatching } = useAppStore();

  if (continueWatching.length === 0) {
    return null;
  }

  function handleReorder(from: number, to: number) {
    const items = [...continueWatching];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    reorderContinueWatching(items);
  }

  return (
    <FadeIn>
      <h2 className="mb-4 text-lg font-bold text-white">Continuar viendo</h2>
      <p className="mb-3 text-xs text-zinc-600">Arrastra para reordenar</p>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {continueWatching.map((item, index) => (
          <DraggableItem
            key={item.id}
            item={item}
            index={index}
            onReorder={handleReorder}
            onContinue={(entry) => {
              startWatching({
                id: entry.id,
                title: entry.title,
                image: entry.image,
                episode: entry.episode,
                progress: Math.min(entry.progress + 10, 95),
              });
              router.push(`${contentHref(entry.id)}?play=1`);
            }}
          />
        ))}
      </div>
    </FadeIn>
  );
}
