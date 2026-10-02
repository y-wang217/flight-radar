// Adds the seed destinations (skipping any already present), then refreshes all fares.
import { SEED_DESTINATIONS } from "../lib/config";
import { addDestination, refreshAll } from "../lib/store";

for (const { iata, label } of SEED_DESTINATIONS) {
  console.log((await addDestination(iata, label)) ? `added ${iata}` : `exists ${iata}`);
}
console.table(await refreshAll());
