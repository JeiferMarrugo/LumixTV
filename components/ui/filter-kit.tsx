"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Search,
  Table2,
  X,
  type LucideIcon,
} from "lucide-react";
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
        "border border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
        "dark:border-white/[0.07] dark:bg-gradient-to-br dark:from-zinc-900/95 dark:via-zinc-950/98 dark:to-black",
        "dark:shadow-[0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)]",
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
        "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
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
  size = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  "aria-label": string;
  onClear?: () => void;
  size?: "default" | "compact";
}) {
  const compact = size === "compact";

  return (
    <div className="group/search relative">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-focus-within/search:opacity-100",
          "bg-gradient-to-r from-gold-500/10 via-transparent to-gold-500/5",
        )}
      />
      <Search
        size={compact ? 16 : 18}
        className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/search:text-gold-500 dark:group-focus-within/search:text-gold-400"
      />
      <input
        type="text"
        role="searchbox"
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "relative w-full rounded-2xl border py-2 pl-11 pr-11",
          "text-sm text-foreground placeholder:text-muted-foreground",
          "outline-none transition-all duration-200",
          "border-border bg-muted/40 shadow-sm",
          "focus:border-gold-500/50 focus:bg-background focus:shadow-[0_0_0_3px_rgba(212,160,23,0.12)]",
          "dark:border-white/[0.09] dark:bg-gradient-to-br dark:from-zinc-900/80 dark:via-black/60 dark:to-black/80",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:focus:bg-black/70 dark:focus:shadow-[0_0_0_3px_rgba(212,160,23,0.1),0_8px_32px_rgba(0,0,0,0.35)]",
          compact ? "h-11 pl-10" : "h-[3.25rem] pl-12 text-[15px]",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={onClear ?? (() => onChange(""))}
          className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-border bg-muted/80 text-muted-foreground transition-colors hover:border-gold-500/30 hover:text-foreground dark:border-white/10 dark:bg-white/[0.06] dark:hover:text-white"
          aria-label="Limpiar búsqueda"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function FilterToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-2.5 sm:gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FilterRatingPills({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const options = [
    { value: null, label: "Rating" },
    { value: 7, label: "7+" },
    { value: 8, label: "8+" },
    { value: 9, label: "9+" },
  ] as const;

  return (
    <div className="flex rounded-xl border border-border bg-muted/50 p-1 dark:border-white/[0.08] dark:bg-black/30">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              active
                ? "bg-gold-500/20 text-gold-700 shadow-inner dark:text-gold-300"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function FilterChipGrid({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
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
        "shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-gradient-to-r from-gold-500 to-amber-400 text-black shadow-[0_4px_16px_rgba(212,160,23,0.28)]"
          : "border border-zinc-200 bg-zinc-100 text-zinc-700 hover:border-gold-500/35 hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100",
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
        "border border-border bg-muted/60 text-muted-foreground",
        "transition-all hover:border-gold-500/30 hover:text-gold-600 dark:border-white/[0.08] dark:bg-black/30 dark:text-zinc-400 dark:hover:text-gold-400",
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
  fadeFrom = "from-background dark:from-zinc-950",
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
    <div className="flex shrink-0 rounded-xl border border-border bg-muted/50 p-1 dark:border-white/[0.08] dark:bg-black/30">
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "rounded-lg p-2.5 transition-all",
          view === "grid"
            ? "bg-gold-500/20 text-gold-700 shadow-inner dark:text-gold-400"
            : "text-muted-foreground hover:text-foreground",
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
            ? "bg-gold-500/20 text-gold-700 shadow-inner dark:text-gold-400"
            : "text-muted-foreground hover:text-foreground",
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
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Activos
      </span>
      {chips.map((chip) =>
        chip.onRemove ? (
          <button
            key={chip.key}
            type="button"
            onClick={chip.onRemove}
            className="group flex items-center gap-1.5 rounded-full border border-gold-500/25 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-700 transition-colors hover:border-gold-500/40 hover:bg-gold-500/15 dark:text-gold-400/95 dark:hover:bg-gold-500/12"
          >
            {chip.label}
            <X size={11} className="opacity-50 group-hover:opacity-100" />
          </button>
        ) : (
          <span
            key={chip.key}
            className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.04]"
          >
            {chip.label}
          </span>
        ),
      )}
      {removable && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="ml-1 text-xs text-muted-foreground transition-colors hover:text-gold-600 dark:hover:text-gold-400"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}

export function FilterDivider() {
  return <div className="my-4 h-px bg-gradient-to-r from-transparent via-border to-transparent dark:via-white/[0.06]" />;
}

export function FilterClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-gold-600 dark:hover:bg-white/[0.05] dark:hover:text-gold-400"
    >
      <X size={12} />
      Limpiar
    </button>
  );
}
