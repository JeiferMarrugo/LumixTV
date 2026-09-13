"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent as ReactTouchEvent,
} from "react";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Play, Tv } from "lucide-react";
import { cn } from "@/lib/utils";

const LOGO_FILTER =
  "drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 1px 4px rgba(0,0,0,0.65)) drop-shadow(0 0 10px rgba(0,0,0,0.35))";

export interface RelatedLiveChannel {
  id: string;
  name: string;
  logo?: string | null;
  countryCode: string;
  categories?: string[];
}

interface LiveTvRelatedPanelProps {
  related: RelatedLiveChannel[];
  groupLabel?: string | null;
  activeChannelId: string;
  onSelect: (channelId: string, channelName: string) => void;
  mode?: "mobile" | "desktop" | "both";
}

function formatRelatedSubtitle(relatedCount: number, groupLabel?: string | null) {
  if (groupLabel) {
    return `Otros canales de ${groupLabel} · ${relatedCount} sugerencia${relatedCount === 1 ? "" : "s"}`;
  }
  return `Misma categoría o país · ${relatedCount} sugerencia${relatedCount === 1 ? "" : "s"}`;
}

function RelatedCard({
  channel,
  active,
  onSelect,
  layout,
}: {
  channel: RelatedLiveChannel;
  active: boolean;
  onSelect: () => void;
  layout: "sheet" | "rail";
}) {
  const category = channel.categories?.[0];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full text-left transition-all",
        layout === "rail" ? "shrink-0 w-[132px] sm:w-[148px]" : "",
      )}
      aria-label={`Reproducir ${channel.name}`}
      aria-current={active ? "true" : undefined}
    >
      <article
        className={cn(
          "overflow-hidden rounded-xl border bg-gradient-to-b from-zinc-900/90 to-zinc-950",
          "transition-all duration-200 group-hover:border-gold-500/35 group-hover:shadow-[0_8px_24px_rgba(212,160,23,0.12)]",
          active
            ? "border-gold-500/50 ring-1 ring-gold-500/30"
            : "border-white/[0.08] group-hover:-translate-y-0.5",
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
          {channel.logo ? (
            <Image
              src={channel.logo}
              alt=""
              fill
              unoptimized
              className="object-contain p-2.5"
              style={{ filter: LOGO_FILTER }}
              sizes={layout === "rail" ? "148px" : "50vw"}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-600">
              <Tv size={layout === "rail" ? 28 : 24} />
            </div>
          )}

          {!active && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500/90 text-black shadow-lg">
                <Play size={16} fill="currentColor" />
              </span>
            </div>
          )}

          {active && (
            <div className="absolute left-2 top-2 rounded-md bg-gold-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
              En vivo
            </div>
          )}
        </div>

        <div className="space-y-1 p-2.5">
          <p className="line-clamp-2 text-xs font-semibold leading-snug text-white sm:text-[13px]">
            {channel.name}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium uppercase text-zinc-400">
              {channel.countryCode}
            </span>
            {category && (
              <span className="truncate rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-500">
                {category}
              </span>
            )}
          </div>
        </div>
      </article>
    </button>
  );
}

function MobileRelatedSheet({
  related,
  groupLabel,
  activeChannelId,
  onSelect,
}: LiveTvRelatedPanelProps) {
  const [open, setOpen] = useState(false);
  const dragRef = useRef<{ startY: number; startOpen: boolean } | null>(null);

  const toggle = useCallback(() => setOpen((value) => !value), []);

  const onHandleTouchStart = useCallback((event: ReactTouchEvent) => {
    dragRef.current = { startY: event.touches[0].clientY, startOpen: open };
  }, [open]);

  const onHandleTouchMove = useCallback((event: ReactTouchEvent) => {
    const session = dragRef.current;
    if (!session) return;
    const dy = session.startY - event.touches[0].clientY;
    if (!session.startOpen && dy > 28) setOpen(true);
    if (session.startOpen && dy < -28) setOpen(false);
  }, []);

  const onHandleTouchEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  if (related.length === 0) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-40 md:hidden",
        open ? "pb-0" : "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-950/95 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-[height] duration-300 ease-out",
          open ? "h-[min(72vh,520px)]" : "h-14",
        )}
        onTouchStart={(event) => event.stopPropagation()}
        onTouchEnd={(event) => event.stopPropagation()}
      >
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-label={open ? "Ocultar canales relacionados" : "Ver canales relacionados"}
          className="flex w-full shrink-0 cursor-grab flex-col items-center px-4 pt-2 active:cursor-grabbing"
          onClick={toggle}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggle();
            }
          }}
          onTouchStart={(event) => {
            event.stopPropagation();
            onHandleTouchStart(event);
          }}
          onTouchMove={(event) => {
            event.stopPropagation();
            onHandleTouchMove(event);
          }}
          onTouchEnd={(event) => {
            event.stopPropagation();
            onHandleTouchEnd();
          }}
        >
          <div className="mb-2 h-1 w-10 rounded-full bg-white/20" />
          <div className="flex w-full items-center justify-between gap-3 pb-2">
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold text-white">También en vivo</p>
              <p className="text-[11px] text-zinc-500">
                {groupLabel
                  ? `Otros de ${groupLabel} · desliza para ver más`
                  : `${related.length} canal${related.length === 1 ? "" : "es"} · desliza para ver más`}
              </p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-gold-400">
              {open ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </span>
          </div>
        </div>

        {open && (
          <div
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]"
            onTouchMove={(event) => event.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-2.5 pb-2">
              {related.map((item) => (
                <RelatedCard
                  key={item.id}
                  channel={item}
                  active={item.id === activeChannelId}
                  layout="sheet"
                  onSelect={() => {
                    onSelect(item.id, item.name);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DesktopRelatedRail({
  related,
  groupLabel,
  activeChannelId,
  onSelect,
}: LiveTvRelatedPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    const observer = new ResizeObserver(updateScrollButtons);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      observer.disconnect();
    };
  }, [related, updateScrollButtons]);

  const scrollRail = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.72, 300);
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  }, []);

  if (related.length === 0) return null;

  return (
    <div className="hidden w-full md:block">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            También en vivo
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">
            {formatRelatedSubtitle(related.length, groupLabel)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => scrollRail("left")}
            disabled={!canScrollLeft}
            aria-label="Ver canales anteriores"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/80 backdrop-blur-sm transition-colors",
              canScrollLeft
                ? "hover:border-gold-500/35 hover:text-gold-400"
                : "cursor-not-allowed opacity-30",
            )}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollRail("right")}
            disabled={!canScrollRight}
            aria-label="Ver más canales"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/80 backdrop-blur-sm transition-colors",
              canScrollRight
                ? "hover:border-gold-500/35 hover:text-gold-400"
                : "cursor-not-allowed opacity-30",
            )}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black/90 to-transparent"
          />
        )}
        {canScrollRight && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black/90 to-transparent"
          />
        )}

        <div
          ref={scrollRef}
          className="flex touch-pan-x gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-3.5"
        >
          {related.map((item) => (
            <RelatedCard
              key={item.id}
              channel={item}
              active={item.id === activeChannelId}
              layout="rail"
              onSelect={() => onSelect(item.id, item.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LiveTvRelatedPanel({
  mode = "both",
  ...props
}: LiveTvRelatedPanelProps) {
  return (
    <>
      {(mode === "both" || mode === "mobile") && <MobileRelatedSheet {...props} />}
      {(mode === "both" || mode === "desktop") && <DesktopRelatedRail {...props} />}
    </>
  );
}
