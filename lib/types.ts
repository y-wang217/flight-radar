export type Destination = { iata: string; label: string; addedAt: string };

export type Fare = {
  price: number;
  currency: string;
  departDate: string; // YYYY-MM-DD, local to the departure airport
  returnDate: string;
  originAirport: string;
  airline: string; // IATA airline code
  stops: number; // max stops on either leg
  link: string;
  checkedAt: string; // ISO timestamp
};

// Inclusive departure date range.
export type DepartureWindow = { from: string; to: string };

export type StayKey = "short" | "medium" | "long";
export type Stay = { key: StayKey; label: string; minNights: number; maxNights: number }; // nights inclusive

// Cheapest fare per stay bucket; null when nothing in the cache fits.
export type FareSet = Record<StayKey, Fare | null>;
