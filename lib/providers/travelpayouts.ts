import { CURRENCY, MARKET } from "../config";
import { addDays, daysBetween, monthsBetween } from "../dates";
import type { DepartureWindow, Fare, FareSet, Stay } from "../types";
import type { FareProvider } from "./index";

// Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API
const API = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";

export type Ticket = {
  origin_airport: string;
  destination_airport: string;
  price: number;
  airline: string;
  departure_at: string; // ISO with the airport's local offset
  return_at?: string;
  transfers: number;
  return_transfers?: number;
};

// One call per (departure month, return month) pair; the API caches by month,
// so we ask for whole months and filter to the exact window and stay ourselves.
export async function fetchPrices(origin: string, dest: string, departMonth: string, returnMonth: string) {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) throw new Error("TRAVELPAYOUTS_TOKEN is not set");
  const params = new URLSearchParams({
    origin,
    destination: dest,
    departure_at: departMonth,
    return_at: returnMonth,
    one_way: "false",
    direct: "false",
    unique: "false",
    sorting: "price",
    currency: CURRENCY,
    market: MARKET,
    limit: "1000",
  });
  const res = await fetch(`${API}?${params}`, { headers: { "X-Access-Token": token }, cache: "no-store" });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new Error(`Travelpayouts ${res.status}: ${JSON.stringify(body)?.slice(0, 200)}`);
  }
  return body as { success: true; currency: string; data: Ticket[] };
}

// Covers every return date any stay bucket could need, so all buckets share one set of calls.
export function monthPairs(w: DepartureWindow, stays: readonly Stay[]): [string, string][] {
  const minNights = Math.min(...stays.map((s) => s.minNights));
  const maxNights = Math.max(...stays.map((s) => s.maxNights));
  const departs = monthsBetween(w.from, w.to);
  const returns = monthsBetween(addDays(w.from, minNights), addDays(w.to, maxNights));
  return departs.flatMap((d) => returns.filter((r) => r >= d).map((r): [string, string] => [d, r]));
}

export function searchLink(origin: string, dest: string, depart: string, ret: string): string {
  const ddmm = (date: string) => date.slice(8, 10) + date.slice(5, 7);
  const url = `https://www.aviasales.com/search/${origin}${ddmm(depart)}${dest}${ddmm(ret)}1`;
  const marker = process.env.TRAVELPAYOUTS_MARKER;
  return marker ? `${url}?marker=${encodeURIComponent(marker)}` : url;
}

export function toFare(t: Ticket, dest: string, currency: string): Fare {
  const departDate = t.departure_at.slice(0, 10);
  const returnDate = t.return_at!.slice(0, 10);
  return {
    price: t.price,
    currency: currency.toUpperCase(),
    departDate,
    returnDate,
    originAirport: t.origin_airport,
    airline: t.airline,
    stops: Math.max(t.transfers ?? 0, t.return_transfers ?? 0),
    link: searchLink(t.origin_airport, dest, departDate, returnDate),
    checkedAt: new Date().toISOString(),
  };
}

// The stay bucket a ticket belongs to, or why it's dropped. The only filter between
// the API response and the table, so check-fare can report where tickets go.
export type Drop = "one-way" | "outside window" | "no bucket";
export function classify(t: Ticket, w: DepartureWindow, stays: readonly Stay[]): Stay["key"] | Drop {
  if (!t.return_at) return "one-way";
  const depart = t.departure_at.slice(0, 10);
  if (depart < w.from || depart > w.to) return "outside window";
  const nights = daysBetween(depart, t.return_at.slice(0, 10));
  return stays.find((s) => nights >= s.minNights && nights <= s.maxNights)?.key ?? "no bucket";
}

export const travelpayouts: FareProvider = {
  async getLowestFares(origin, dest, w, stays) {
    const pairs = monthPairs(w, stays);
    const responses = await Promise.all(pairs.map(([d, r]) => fetchPrices(origin, dest, d, r)));
    const best = new Map<Stay["key"], Ticket>();
    for (const t of responses.flatMap((r) => r.data)) {
      const key = classify(t, w, stays);
      const stay = stays.find((s) => s.key === key);
      if (stay && (!best.has(stay.key) || t.price < best.get(stay.key)!.price)) best.set(stay.key, t);
    }
    const fares = {} as FareSet;
    for (const s of stays) {
      const t = best.get(s.key);
      fares[s.key] = t ? toFare(t, dest, responses[0].currency) : null;
    }
    return fares;
  },
};
