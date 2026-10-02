import { Redis } from "@upstash/redis";
import { ORIGIN, STAYS } from "./config";
import { departureWindow } from "./dates";
import { provider } from "./providers";
import type { Destination, FareSet } from "./types";

// Created lazily so builds don't need Redis env vars.
let client: Redis | undefined;
const redis = () => (client ??= Redis.fromEnv());

export async function getDestinations(): Promise<Destination[]> {
  return (await redis().get<Destination[]>("destinations")) ?? [];
}

export async function getFares(iatas: string[]): Promise<(FareSet | null)[]> {
  if (iatas.length === 0) return [];
  return redis().mget<(FareSet | null)[]>(...iatas.map((i) => `fares:${i}`));
}

export async function getLastChecked(): Promise<string | null> {
  return redis().get<string>("lastCheckedAt");
}

// Returns false if the destination already exists.
export async function addDestination(iata: string, label: string): Promise<boolean> {
  const list = await getDestinations();
  if (list.some((d) => d.iata === iata)) return false;
  await redis().set("destinations", [...list, { iata, label, addedAt: new Date().toISOString() }]);
  return true;
}

export async function removeDestination(iata: string): Promise<void> {
  const list = await getDestinations();
  await redis().set("destinations", list.filter((d) => d.iata !== iata));
  await redis().del(`fares:${iata}`, `fare:${iata}`); // fare: is the pre-bucket key
}

// A bucket with no fare found is stored as null, clearing the old one; an API error
// throws and leaves the whole set alone.
export async function refreshFare(iata: string): Promise<FareSet> {
  const fares = await provider.getLowestFares(ORIGIN, iata, departureWindow(), STAYS);
  await redis().set(`fares:${iata}`, fares);
  return fares;
}

export async function refreshAll() {
  const list = await getDestinations();
  const results = await Promise.allSettled(list.map((d) => refreshFare(d.iata)));
  await redis().set("lastCheckedAt", new Date().toISOString());
  return list.map((d, i) => {
    const r = results[i];
    if (r.status === "rejected") return { iata: d.iata, error: String(r.reason) };
    return { iata: d.iata, ...Object.fromEntries(STAYS.map((s) => [s.key, r.value[s.key]?.price ?? null])) };
  });
}
