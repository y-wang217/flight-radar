import { Redis } from "@upstash/redis";
import { ORIGIN } from "./config";
import { searchWindow } from "./dates";
import { provider } from "./providers";
import type { Destination, Fare } from "./types";

// Created lazily so builds don't need Redis env vars.
let client: Redis | undefined;
const redis = () => (client ??= Redis.fromEnv());

export async function getDestinations(): Promise<Destination[]> {
  return (await redis().get<Destination[]>("destinations")) ?? [];
}

export async function getFares(iatas: string[]): Promise<(Fare | null)[]> {
  if (iatas.length === 0) return [];
  return redis().mget<(Fare | null)[]>(...iatas.map((i) => `fare:${i}`));
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
  await redis().del(`fare:${iata}`);
}

// No fare found clears the old one; an API error throws and leaves it alone.
export async function refreshFare(iata: string): Promise<Fare | null> {
  const fare = await provider.getLowestFare(ORIGIN, iata, searchWindow());
  if (fare) await redis().set(`fare:${iata}`, fare);
  else await redis().del(`fare:${iata}`);
  return fare;
}

export async function refreshAll() {
  const list = await getDestinations();
  const results = await Promise.allSettled(list.map((d) => refreshFare(d.iata)));
  await redis().set("lastCheckedAt", new Date().toISOString());
  return list.map((d, i) => {
    const r = results[i];
    return r.status === "fulfilled" ? { iata: d.iata, price: r.value?.price ?? null } : { iata: d.iata, error: String(r.reason) };
  });
}
