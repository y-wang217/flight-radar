import type { DepartureWindow, FareSet, Stay } from "../types";
import { travelpayouts } from "./travelpayouts";

export interface FareProvider {
  getLowestFares(origin: string, dest: string, window: DepartureWindow, stays: readonly Stay[]): Promise<FareSet>;
}

// Swap the provider here (e.g. SerpApi Google Flights) without touching callers.
export const provider: FareProvider = travelpayouts;
