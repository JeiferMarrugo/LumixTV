"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type LucideIcon,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, Search, Table2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Panel shell ─── */

export function FilterPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "border border-white/[0.07]",
        "bg-gradient-to-br from-zinc-900/95 via-zinc-950/98 to-black",
        "shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "backdrop-blur-md",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"
        aria-hidden
      />
      {children}
    </div>
  );
}

/* ─── Labels ─── */

export function FilterFieldLabel({
  icon: Icon,
  children,
  inline = false,
  className,
}: {
  icon?: LucideIcon;
  children: ReactNode;
  inline?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500",
        inline ? "mb-0 mr-3 shrink-0 self-center" : "mb-2.5",
        className,
      )}
    >
      {Icon && <Icon size={12} className="text-gold-500/80" />}
      {children}
    </span>
  );
}

/* ─── Search ─── */

export function FilterSearch({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label": string;
  onClear?: () => void;
}) {
  return (
    <div className="group/search relative">
      <Search
        size={17}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within/search:text-gold-400"
      />
      <input
        type="text"
        role="searchbox"
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-12 w-full rounded-xl border border-white/[0.08] bg-black/35 py-2 pl-11 pr-11",
          "text-sm text-white placeholder-zinc-600",
          "outline-none transition-all duration-200",
          "focus:border-gold-500/35 focus:bg-black/50 focus:shadow-[0_0_0_3px_rgba(212,160,23,0.08)]",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={onClear ?? (() => onChange(""))}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Limpiar búsqueda"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* ─── Chips ─── */

export function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-gradient-to-r from-gold-500 to-amber-400 text-black shadow-[0_4px_16px_rgba(212,160,23,0.28)]"
          : "border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-gold-500/25 hover:bg-white/[0.06] hover:text-zinc-100",
        className,
      )}
    >
      {children}
    </button>
  );
}

function FilterScrollArrow({
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
      aria-label={direction === "left" ? "Ver anteriores" : "Ver más"}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        "border border-white/[0.08] bg-black/30 text-zinc-400",
        "transition-all hover:border-gold-500/30 hover:text-gold-400",
        "disabled:pointer-events-none disabled:opacity-25",
      )}
    >
      <Icon size={16} />
    </button>
  );
}

export function FilterChipRow({
  children,
  deps = [],
  fadeFrom = "from-zinc-950",
}: {
  children: ReactNode;
  deps?: unknown[];
  fadeFrom?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
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
  }, [updateScrollState, deps]);

  function scrollBy(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction === "left" ? -el.clientWidth * 0.75 : el.clientWidth * 0.75,
      behavior: "smooth",
    });
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <FilterScrollArrow
        direction="left"
        disabled={!canScrollLeft}
        onClick={() => scrollBy("left")}
      />

      <div className="relative min-w-0 flex-1">
        {canScrollLeft && (
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r to-transparent",
              fadeFrom,
            )}
          />
        )}
        {canScrollRight && (
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l to-transparent",
              fadeFrom,
            )}
          />
        )}

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scroll-smooth pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
      </div>

      <FilterScrollArrow
        direction="right"
        disabled={!canScrollRight}
        onClick={() => scrollBy("right")}
      />
    </div>
  );
}

/* ─── View toggle ─── */

export function FilterViewToggle({
  view,
  onChange,
}: {
  view: "grid" | "table";
  onChange: (view: "grid" | "table") => void;
}) {
  return (
    <div className="flex shrink-0 rounded-xl border border-white/[0.08] bg-black/30 p-1">
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "rounded-lg p-2.5 transition-all",
          view === "grid"
            ? "bg-gold-500/20 text-gold-400 shadow-inner"
            : "text-zinc-500 hover:text-zinc-200",
        )}
        aria-label="Vista grid"
        title="Cuadrícula"
      >
        <LayoutGrid size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "rounded-lg p-2.5 transition-all",
          view === "table"
            ? "bg-gold-500/20 text-gold-400 shadow-inner"
            : "text-zinc-500 hover:text-zinc-200",
        )}
        aria-label="Vista tabla"
        title="Tabla"
      >
        <Table2 size={16} />
      </button>
    </div>
  );
}

/* ─── Active filters bar ─── */

export type ActiveFilterChip = {
  key: string;
  label: string;
  onRemove?: (() => void) | null;
};

export function ActiveFiltersBar({
  chips,
  onClearAll,
}: {
  chips: ActiveFilterChip[];
  onClearAll?: () => void;
}) {
  if (chips.length === 0) return null;

  const removable = chips.some((chip) => chip.onRemove);

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 pt-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-600">
        Activos
      </span>
      {chips.map((chip) =>
        chip.onRemove ? (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            className="group flex items-center gap-1.5 rounded-full border border-gold-500/20 bg-gold-500/8 px-3 py-1 text-xs font-medium text-gold-400/95 transition-colors hover:border-gold-500/35 hover:bg-gold-500/12"
          >
            {chip.label}
            <X size={11} className="opacity-50 group-hover:opacity-100" />
          </button>
        ) : (
          <span
            key={chip.key}
            className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-400"
          >
            {chip.label}
          </span>
        ),
      )}
      {removable && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="ml-1 text-xs text-zinc-600 transition-colors hover:text-gold-400"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}

export function FilterDivider() {
  return <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />;
}

export function FilterClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-gold-400"
    >
      <X size={12} />
      Limpiar
    </button>
  );
}
