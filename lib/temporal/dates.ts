import "./polyfill";
import { Temporal } from "@js-temporal/polyfill";

const LOCALE = "es";

export function formatRelativeDate(isoDate: string): string {
  const date = Temporal.PlainDate.from(isoDate.slice(0, 10));
  const today = Temporal.Now.plainDateISO();
  const diff = date.until(today, { largestUnit: "day" }).days;

  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7) return `Hace ${diff} días`;
  if (diff < 30) {
    const weeks = Math.floor(diff / 7);
    return weeks === 1 ? "Hace 1 semana" : `Hace ${weeks} semanas`;
  }

  return date.toLocaleString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function getCurrentYear(): number {
  return Temporal.Now.plainDateISO().year;
}
