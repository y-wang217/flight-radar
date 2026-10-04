import { STAYS } from "@/lib/config";
import { daysBetween, shortDate, timeAgo } from "@/lib/dates";
import { getDestinations, getFares, getLastChecked } from "@/lib/store";
import type { Snapshot } from "@/lib/history";
import type { Fare, FareSet, StayKey } from "@/lib/types";
import { AddForm, Countdown, RefreshButton, RemoveButton } from "./controls";
import { HistoryProvider, RowHistory, Trend } from "./history";

export const dynamic = "force-dynamic";

const cheapest = (fares: FareSet | null) =>
  Math.min(...STAYS.map((s) => fares?.[s.key]?.price ?? Infinity));

export default async function Home() {
  const destinations = await getDestinations();
  const [fares, lastChecked] = await Promise.all([getFares(destinations.map((d) => d.iata)), getLastChecked()]);
  const rows = destinations
    .map((d, i) => ({ d, fares: fares[i] }))
    .sort((a, b) => cheapest(a.fares) - cheapest(b.fares));
  // What this browser records into its local price history.
  const snapshot: Snapshot = rows.flatMap(({ d, fares }) =>
    STAYS.flatMap((s) => {
      const f = fares?.[s.key];
      return f ? [{ iata: d.iata, stay: s.key, price: f.price, departDate: f.departDate, returnDate: f.returnDate, checkedAt: f.checkedAt }] : [];
    }),
  );

  return (
    <HistoryProvider snapshot={snapshot}>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">Flight Radar</p>
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Toronto → anywhere</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {lastChecked ? `last checked ${timeAgo(lastChecked)}` : "not checked yet"}
            </p>
            <Countdown />
          </div>
          <RefreshButton />
        </header>

        <div className="grid grid-cols-3 gap-2 pb-2">
          {STAYS.map((s) => (
            <p key={s.key} className="px-2 text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-zinc-300">{s.label}</span>
              <br />
              {s.minNights}–{s.maxNights} nights
            </p>
          ))}
        </div>

        <ul className="divide-y divide-zinc-800 border-y border-zinc-800">
          {rows.map(({ d, fares }) => (
            <li key={d.iata} className="py-3">
              <div className="flex items-center justify-between">
                <p className="truncate font-medium">
                  {d.label} <span className="text-zinc-500">{d.iata}</span>
                </p>
                <RemoveButton iata={d.iata} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {STAYS.map((s) => (
                  <Cell key={s.key} iata={d.iata} stay={s.key} fare={fares?.[s.key] ?? null} />
                ))}
              </div>
              <RowHistory iata={d.iata} />
            </li>
          ))}
          {rows.length === 0 && <li className="py-6 text-center text-zinc-500">No destinations yet.</li>}
        </ul>

        <AddForm />
      </main>
    </HistoryProvider>
  );
}

function Cell({ iata, stay, fare }: { iata: string; stay: StayKey; fare: Fare | null }) {
  if (!fare) {
    return <p className="rounded-md px-2 py-2 text-sm text-zinc-600">No fare found</p>;
  }
  const nights = daysBetween(fare.departDate, fare.returnDate);
  const stops = fare.stops === 0 ? "nonstop" : `${fare.stops} stop${fare.stops > 1 ? "s" : ""}`;
  return (
    <a
      href={fare.link}
      target="_blank"
      rel="noopener noreferrer"
      className="min-w-0 rounded-md px-2 py-2 hover:bg-zinc-900"
    >
      <p className="text-xl font-semibold tabular-nums">
        ${Math.round(fare.price).toLocaleString("en-US")}
        <span className="ml-1 text-xs font-normal text-zinc-500">{fare.currency}</span>
      </p>
      <p className="truncate text-xs text-zinc-300">
        {shortDate(fare.departDate)} → {shortDate(fare.returnDate)}
      </p>
      <p className="truncate text-xs text-zinc-500">
        {nights}n · {stops}
      </p>
      <p className="truncate text-xs text-zinc-500">
        {fare.originAirport} · {fare.airline}
      </p>
      <Trend iata={iata} stay={stay} fare={fare} />
    </a>
  );
}
