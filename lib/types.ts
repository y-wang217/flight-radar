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

// Inclusive departure date range plus allowed trip lengths.
export type SearchWindow = { from: string; to: string; minNights: number; maxNights: number };
