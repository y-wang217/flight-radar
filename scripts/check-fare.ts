// Usage: npm run check-fare JFK  — prints the raw API responses and the parsed Fare.
import { ORIGIN } from "../lib/config";
import { searchWindow } from "../lib/dates";
import { fetchPrices, monthPairs, travelpayouts } from "../lib/providers/travelpayouts";

const dest = (process.argv[2] ?? "JFK").toUpperCase();
const w = searchWindow();
console.log("window:", w);
for (const [d, r] of monthPairs(w)) {
  console.log(`\nraw ${ORIGIN}->${dest} depart=${d} return=${r}:`);
  console.log(JSON.stringify(await fetchPrices(ORIGIN, dest, d, r), null, 2));
}
console.log("\nparsed Fare:", await travelpayouts.getLowestFare(ORIGIN, dest, w));
