import { MAX_NIGHTS, MIN_NIGHTS, TIME_ZONE, WINDOW_DAYS } from "./config";
import type { SearchWindow } from "./types";

// All dates are plain YYYY-MM-DD strings; arithmetic is done in UTC to avoid DST drift.
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

export function searchWindow(): SearchWindow {
  const from = today();
  return { from, to: addDays(from, WINDOW_DAYS), minNights: MIN_NIGHTS, maxNights: MAX_NIGHTS };
}

// "Oct 9"
export function shortDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}
