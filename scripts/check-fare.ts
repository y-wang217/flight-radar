// Usage: npm run check-fare JFK [--raw]
// Shows where every cached ticket goes: dropped (and why) or into a stay bucket.
// --raw also prints the full API responses.
import { ORIGIN, STAYS } from "../lib/config";
import { daysBetween, departureWindow } from "../lib/dates";
import { classify, fetchPrices, monthPairs, travelpayouts, type Ticket } from "../lib/providers/travelpayouts";

const dest = (process.argv[2] ?? "JFK").toUpperCase();
const raw = process.argv.includes("--raw");
const w = departureWindow();
console.log("window:", w, "stays:", STAYS.map((s) => `${s.key} ${s.minNights}-${s.maxNights}n`).join(", "));

const tickets: Ticket[] = [];
for (const [d, r] of monthPairs(w, STAYS)) {
  const res = await fetchPrices(ORIGIN, dest, d, r);
  console.log(`\n${ORIGIN}->${dest} depart=${d} return=${r}: ${res.data.length} tickets`);
  if (raw) console.log(JSON.stringify(res, null, 2));
  tickets.push(...res.data);
}

const outcome = (t: Ticket) => classify(t, w, STAYS);
const count = new Map<string, number>();
for (const t of tickets) count.set(outcome(t), (count.get(outcome(t)) ?? 0) + 1);
console.log(`\nfunnel (${tickets.length} tickets total):`);
console.table(Object.fromEntries(["one-way", "outside window", "no bucket", ...STAYS.map((s) => s.key)].map((k) => [k, count.get(k) ?? 0])));

// Every ticket that departs inside the window, so you can see which date/stay combos the cache holds.
const inWindow = tickets
  .filter((t) => t.return_at && outcome(t) !== "outside window")
  .map((t) => ({
    depart: t.departure_at.slice(0, 10),
    return: t.return_at!.slice(0, 10),
    nights: daysBetween(t.departure_at.slice(0, 10), t.return_at!.slice(0, 10)),
    price: t.price,
    bucket: outcome(t),
  }))
  .sort((a, b) => a.depart.localeCompare(b.depart) || a.nights - b.nights);
console.log("\ntickets departing in the window:");
console.table(inWindow);

console.log("\nparsed fares:", await travelpayouts.getLowestFares(ORIGIN, dest, w, STAYS));
