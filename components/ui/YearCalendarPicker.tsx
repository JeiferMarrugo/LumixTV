"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"] as const;

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

interface YearCalendarPickerProps {
  value: number | null;
  onChange: (year: number | null) => void;
  minYear?: number;
  maxYear?: number;
  placeholder?: string;
  className?: string;
}

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  inCurrentMonth: boolean;
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    days.push({ date, month: prevMonth, year: prevYear, inCurrentMonth: false });
  }

  for (let date = 1; date <= daysInMonth; date++) {
    days.push({ date, month, year, inCurrentMonth: true });
  }

  let date = 1;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  while (days.length % 7 !== 0) {
    days.push({ date, month: nextMonth, year: nextYear, inCurrentMonth: false });
    date++;
  }

  return days;
}

export function YearCalendarPicker({
  value,
  onChange,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  placeholder = "Cualquier año",
  className,
}: YearCalendarPickerProps) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewYear, setViewYear] = useState(value ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [pickedDay, setPickedDay] = useState<number | null>(
    value === now.getFullYear() ? now.getDate() : 1,
  );
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const days = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (value) {
      setViewYear(value);
      setViewMonth(0);
      setPickedDay(1);
    }
  }, [value]);

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = window.innerWidth - width - 12;
    }
    left = Math.max(12, left);

    setPanelStyle({
      top: rect.bottom + 8,
      left,
      width,
    });
  };

  useEffect(() => {
    if (!open) return;

    updatePanelPosition();

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        document.getElementById("year-calendar-panel")?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function handleReposition() {
      updatePanelPosition();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    const nextYear = next.getFullYear();
    if (nextYear < minYear || nextYear > maxYear) return;
    setViewYear(nextYear);
    setViewMonth(next.getMonth());
  }

  function handleDaySelect(day: CalendarDay) {
    if (day.year < minYear || day.year > maxYear) return;
    setViewYear(day.year);
    setViewMonth(day.month);
    setPickedDay(day.date);
    onChange(day.year);
    setOpen(false);
  }

  function clearSelection() {
    onChange(null);
    setOpen(false);
  }

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        requestAnimationFrame(updatePanelPosition);
      }
      return next;
    });
  }

  const label = value ? String(value) : placeholder;

  const panel = open && mounted ? (
    <div
      id="year-calendar-panel"
      role="dialog"
      aria-label="Seleccionar año"
      style={{
        top: panelStyle.top,
        left: panelStyle.left,
        width: panelStyle.width,
      }}
      className="fixed z-[200] rounded-2xl border border-gold-500/20 bg-surface-raised p-4 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-md"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex items-center gap-1 text-left font-semibold text-gold-400 transition-opacity hover:text-gold-300"
        >
          {MONTHS[viewMonth]} {viewYear}
          <ChevronDown size={16} className="opacity-70" />
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            disabled={viewYear <= minYear && viewMonth === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gold-400 transition-colors hover:bg-gold-500/10 disabled:opacity-30"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={viewYear >= maxYear && viewMonth === 11}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gold-400 transition-colors hover:bg-gold-500/10 disabled:opacity-30"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1 text-center text-[10px] font-semibold tracking-wide text-zinc-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected =
            value === day.year &&
            pickedDay === day.date &&
            day.inCurrentMonth &&
            viewMonth === day.month &&
            viewYear === day.year;
          const isMuted = !day.inCurrentMonth;

          return (
            <button
              key={`${day.year}-${day.month}-${day.date}`}
              type="button"
              onClick={() => handleDaySelect(day)}
              disabled={day.year < minYear || day.year > maxYear}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all",
                isSelected
                  ? "bg-gold-500 text-black shadow-sm shadow-gold-500/30"
                  : isMuted
                    ? "text-zinc-600 hover:bg-white/5"
                    : "text-zinc-200 hover:bg-gold-500/10 hover:text-gold-400",
                (day.year < minYear || day.year > maxYear) && "cursor-not-allowed opacity-30",
              )}
            >
              {day.date}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-sm font-medium text-zinc-300">
          {value ? `Año ${value}` : "Sin filtro de año"}
        </span>
        {value && (
          <button
            type="button"
            onClick={clearSelection}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/5 hover:text-gold-400"
          >
            <X size={12} />
            Quitar
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-black/35 px-3.5 text-sm text-zinc-300 outline-none transition-all duration-200 hover:border-gold-500/25",
          open
            ? "border-gold-500/35 shadow-[0_0_0_3px_rgba(212,160,23,0.08)]"
            : "",
        )}
      >
        <span className={cn(!value && "text-zinc-500")}>{label}</span>
        <Calendar size={15} className={cn("shrink-0", open ? "text-gold-400" : "text-zinc-500")} />
      </button>

      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
