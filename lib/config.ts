import type { Stay } from "./types";

// Every tunable number lives here.
export const ORIGIN = "YTO"; // Toronto, all airports (YYZ + YTZ)
export const WINDOW_DAYS = 14; // departures from today to today + WINDOW_DAYS
// Trip-length buckets, one column each. Every bucket shares the same departure window.
export const STAYS: readonly Stay[] = [
  { key: "short", label: "Short", minNights: 2, maxNights: 5 },
  { key: "medium", label: "Medium", minNights: 6, maxNights: 14 },
  { key: "long", label: "Long", minNights: 15, maxNights: 30 },
];
export const CURRENCY = "cad";
export const MARKET = "ca"; // Travelpayouts price cache is per market; unset falls back to "ru"
export const CRON_HOUR_UTC = 11; // must match the schedule in vercel.json
export const TIME_ZONE = "America/Toronto"; // defines "today"

export const SEED_DESTINATIONS = [
  { iata: "JFK", label: "New York" },
  { iata: "YUL", label: "Montreal" },
  { iata: "YVR", label: "Vancouver" },
  { iata: "LAX", label: "Los Angeles" },
  { iata: "MEX", label: "Mexico City" },
  { iata: "NRT", label: "Tokyo" },
];
