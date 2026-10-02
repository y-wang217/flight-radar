import type { Fare, SearchWindow } from "../types";
import { travelpayouts } from "./travelpayouts";

export interface FareProvider {
  getLowestFare(origin: string, dest: string, window: SearchWindow): Promise<Fare | null>;
}

// Swap the provider here (e.g. SerpApi Google Flights) without touching callers.
export const provider: FareProvider = travelpayouts;
