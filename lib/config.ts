// Every tunable number lives here.
export const ORIGIN = "YTO"; // Toronto, all airports (YYZ + YTZ)
export const WINDOW_DAYS = 14; // departures from today to today + WINDOW_DAYS
export const MIN_NIGHTS = 2;
export const MAX_NIGHTS = 5;
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
