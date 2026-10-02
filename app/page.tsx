import { daysBetween, shortDate, timeAgo } from "@/lib/dates";
import { getDestinations, getFares, getLastChecked } from "@/lib/store";
import type { Destination, Fare } from "@/lib/types";
import { AddForm, Countdown, RefreshButton, RemoveButton } from "./controls";

export const dynamic = "force-dynamic";

export default async function Home() {
  const destinations = await getDestinations();
  const [fares, lastChecked] = await Promise.all([getFares(destinations.map((d) => d.iata)), getLastChecked()]);
  const rows = destinations
    .map((d, i) => ({ d, fare: fares[i] }))
    .sort((a, b) => (a.fare?.price ?? Infinity) - (b.fare?.price ?? Infinity));

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
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

      <ul className="divide-y divide-zinc-800 border-y border-zinc-800">
        {rows.map(({ d, fare }) => (
          <li key={d.iata} className="flex items-center">
            <Row d={d} fare={fare} />
            <RemoveButton iata={d.iata} />
          </li>
        ))}
        {rows.length === 0 && <li className="py-6 text-center text-zinc-500">No destinations yet.</li>}
      </ul>

      <AddForm />
    </main>
  );
}

function Row({ d, fare }: { d: Destination; fare: Fare | null }) {
  const city = (
    <p className="truncate font-medium">
      {d.label} <span className="text-zinc-500">{d.iata}</span>
    </p>
  );
  if (!fare) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 py-4 pl-1">
        {city}
        <span className="text-sm text-zinc-500">No fare found</span>
      </div>
    );
  }
  const nights = daysBetween(fare.departDate, fare.returnDate);
  const stops = fare.stops === 0 ? "nonstop" : `${fare.stops} stop${fare.stops > 1 ? "s" : ""}`;
  return (
    <a
      href={fare.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-0 flex-1 items-center justify-between gap-3 py-4 pl-1 hover:bg-zinc-900"
    >
      <div className="min-w-0">
        {city}
        <p className="text-sm text-zinc-300">
          {shortDate(fare.departDate)} → {shortDate(fare.returnDate)} · {nights} night{nights === 1 ? "" : "s"}
        </p>
        <p className="text-xs text-zinc-500">
          {fare.originAirport} · {fare.airline} · {stops}
        </p>
      </div>
      <p className="shrink-0 text-2xl font-semibold tabular-nums">
        ${Math.round(fare.price).toLocaleString("en-US")}
        <span className="ml-1 text-xs font-normal text-zinc-500">{fare.currency}</span>
      </p>
    </a>
  );
}
