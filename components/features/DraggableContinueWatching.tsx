"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  GripVertical,
  Play,
  X,
} from "lucide-react";
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

function ScrollArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Anterior" : "Siguiente"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm backdrop-blur-sm transition-all hover:border-gold-500/40 hover:text-gold-700 disabled:pointer-events-none disabled:opacity-30 dark:border-white/10 dark:bg-black/80 dark:text-zinc-400 dark:hover:text-gold-500"
    >
      <Icon size={16} />
    </button>
  );
}

function DraggableItem({
  item,
  index,
  onReorder,
  onContinue,
  onRemove,
}: {
  item: ContinueWatchingItem;
  index: number;
  onReorder: (from: number, to: number) => void;
  onContinue: (item: ContinueWatchingItem) => void;
  onRemove: (item: ContinueWatchingItem) => void;
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
      className={`group relative w-[280px] shrink-0 cursor-grab overflow-hidden rounded-2xl border transition-all active:cursor-grabbing sm:w-[300px] ${
        isDragging
          ? "scale-[0.97] opacity-50"
          : "hover:-translate-y-1 hover:border-gold-500/30 hover:shadow-[0_16px_40px_rgba(212,160,23,0.12)]"
      } ${isOver ? "border-gold-500/50 ring-2 ring-gold-500/20" : "border-zinc-200 dark:border-white/[0.08]"}`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-overlay">
        <Image
          src={image}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="300px"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(item);
          }}
          className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/70 text-zinc-300 opacity-0 backdrop-blur-sm transition-all hover:border-red-500/40 hover:bg-red-950/80 hover:text-red-300 group-hover:opacity-100"
          aria-label={`Quitar ${item.title} de continuar viendo`}
        >
          <X size={14} />
        </button>

        <button
          type="button"
          onClick={() => onContinue(item)}
          className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold-500 text-black opacity-0 shadow-[0_0_24px_rgba(212,160,23,0.45)] transition-all group-hover:scale-100 group-hover:opacity-100 hover:bg-gold-400 scale-90"
          aria-label={`Continuar ${item.title}`}
        >
          <Play size={20} fill="currentColor" className="ml-0.5" />
        </button>

        <div className="absolute right-2 top-2 rounded-lg bg-black/60 p-1.5 text-zinc-500 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <GripVertical size={14} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8">
          <p className="truncate text-sm font-semibold text-white">{item.title}</p>
          {item.episode && (
            <p className="mt-0.5 truncate text-xs text-zinc-400">{item.episode}</p>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gold-500 shadow-[0_0_8px_rgba(212,160,23,0.6)]"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-surface-raised/90 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-xs text-zinc-500">{formatRelativeDate(item.watchedAt)}</p>
          <p className="text-xs font-medium text-gold-500/90">{item.progress}% visto</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onContinue(item)}
            className="rounded-lg border border-gold-500/30 px-3 py-1.5 text-xs font-semibold text-gold-700 transition-colors hover:border-gold-500/50 hover:bg-gold-500/10 dark:text-gold-400"
          >
            Continuar
          </button>
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-red-500/30 hover:text-red-600 dark:border-white/10 dark:text-zinc-500 dark:hover:text-red-300"
            aria-label={`Quitar ${item.title}`}
          >
            Quitar
          </button>
        </div>
      </div>
    </div>
  );
}

export function DraggableContinueWatching() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { continueWatching, reorderContinueWatching, startWatching, removeFromContinueWatching } =
    useAppStore();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollState();

    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [continueWatching.length, updateScrollState]);

  function scrollBy(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction === "left" ? -el.clientWidth * 0.75 : el.clientWidth * 0.75,
      behavior: "smooth",
    });
  }

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
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Clock size={18} className="text-gold-500" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Continuar viendo</h2>
            <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-700 dark:text-gold-400">
              {continueWatching.length}
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-500">Arrastra las tarjetas para reordenar</p>
        </div>

        {continueWatching.length > 1 && (
          <div className="hidden items-center gap-2 sm:flex">
            <ScrollArrow
              direction="left"
              disabled={!canScrollLeft}
              onClick={() => scrollBy("left")}
            />
            <ScrollArrow
              direction="right"
              disabled={!canScrollRight}
              onClick={() => scrollBy("right")}
            />
          </div>
        )}
      </div>

      <div className="relative">
        {canScrollLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent" />
        )}
        {canScrollRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent" />
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-2 pl-0.5 pr-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden [&>*]:snap-start"
        >
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
                router.push(contentHref(entry.id));
              }}
              onRemove={(entry) => removeFromContinueWatching(entry.id)}
            />
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
