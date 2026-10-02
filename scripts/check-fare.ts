// Usage: npm run check-fare JFK  — prints the raw API responses and the parsed fare per stay bucket.
import { ORIGIN, STAYS } from "../lib/config";
import { departureWindow } from "../lib/dates";
import { fetchPrices, monthPairs, travelpayouts } from "../lib/providers/travelpayouts";

const dest = (process.argv[2] ?? "JFK").toUpperCase();
const w = departureWindow();
console.log("window:", w);
for (const [d, r] of monthPairs(w, STAYS)) {
  console.log(`\nraw ${ORIGIN}->${dest} depart=${d} return=${r}:`);
  console.log(JSON.stringify(await fetchPrices(ORIGIN, dest, d, r), null, 2));
}
console.log("\nparsed fares:", await travelpayouts.getLowestFares(ORIGIN, dest, w, STAYS));
