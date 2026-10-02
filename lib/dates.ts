import { TIME_ZONE, WINDOW_DAYS } from "./config";
import type { DepartureWindow } from "./types";

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

export function departureWindow(): DepartureWindow {
  const from = today();
  return { from, to: addDays(from, WINDOW_DAYS) };
}

// Every YYYY-MM from the month of `from` to the month of `to`, inclusive.
export function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  for (let m = from.slice(0, 7); m <= to.slice(0, 7); m = addDays(`${m}-01`, 32).slice(0, 7)) months.push(m);
  return months;
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
