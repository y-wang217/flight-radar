import { CURRENCY, MARKET } from "../config";
import { addDays, daysBetween } from "../dates";
import type { Fare, SearchWindow } from "../types";
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
// so we ask for whole months and filter to the exact window ourselves.
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

export function monthPairs(w: SearchWindow): [string, string][] {
  const months = (from: string, to: string) => [...new Set([from.slice(0, 7), to.slice(0, 7)])];
  const departs = months(w.from, w.to);
  const returns = months(addDays(w.from, w.minNights), addDays(w.to, w.maxNights));
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

export const travelpayouts: FareProvider = {
  async getLowestFare(origin, dest, w) {
    const responses = await Promise.all(monthPairs(w).map(([d, r]) => fetchPrices(origin, dest, d, r)));
    let best: Ticket | null = null;
    for (const t of responses.flatMap((r) => r.data)) {
      if (!t.return_at) continue;
      const depart = t.departure_at.slice(0, 10);
      const nights = daysBetween(depart, t.return_at.slice(0, 10));
      const fits = depart >= w.from && depart <= w.to && nights >= w.minNights && nights <= w.maxNights;
      if (fits && (!best || t.price < best.price)) best = t;
    }
    return best ? toFare(best, dest, responses[0].currency) : null;
  },
};
