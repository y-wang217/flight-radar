"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { STAYS } from "@/lib/config";
import { localDay, shortDate } from "@/lib/dates";
import { recordAndLoad, type PricePoint, type Snapshot } from "@/lib/history";
import type { Fare, StayKey } from "@/lib/types";

// iata -> that destination's history, newest day first. null until the database loads.
const History = createContext<Map<string, PricePoint[]> | null>(null);

export function HistoryProvider({ snapshot, children }: { snapshot: Snapshot; children: React.ReactNode }) {
  const [history, setHistory] = useState<Map<string, PricePoint[]> | null>(null);
  const key = JSON.stringify(snapshot); // re-record after a refresh brings new fares
  useEffect(() => {
    let live = true;
    recordAndLoad(JSON.parse(key)).then(
      (points) => {
        if (!live) return;
        const byIata = new Map<string, PricePoint[]>();
        for (const p of points) byIata.set(p.iata, [...(byIata.get(p.iata) ?? []), p]);
        setHistory(byIata);
      },
      (err) => console.error("price history unavailable:", err),
    );
    return () => {
      live = false;
    };
  }, [key]);
  return <History.Provider value={history}>{children}</History.Provider>;
}

const money = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;

// "↓ $62 vs Oct 2" against the most recent earlier day this browser saw.
export function Trend({ iata, stay, fare }: { iata: string; stay: StayKey; fare: Fare }) {
  const points = useContext(History)?.get(iata)?.filter((p) => p.stay === stay && p.day < localDay(fare.checkedAt));
  if (!points?.length) return null;
  const prev = points[0];
  const diff = fare.price - prev.price;
  const lowest = fare.price < Math.min(...points.map((p) => p.price));
  if (Math.round(diff) === 0) return <p className="text-xs text-zinc-500">same as {shortDate(prev.day)}</p>;
  return (
    <p className={`text-xs font-medium ${diff < 0 ? "text-emerald-400" : "text-rose-400"}`}>
      {diff < 0 ? "↓" : "↑"} {money(diff)} vs {shortDate(prev.day)}
      {lowest && " · lowest yet"}
    </p>
  );
}

// Collapsible day-by-day table of the cheapest price per bucket.
export function RowHistory({ iata }: { iata: string }) {
  const [open, setOpen] = useState(false);
  const points = useContext(History)?.get(iata) ?? [];
  const days = [...new Set(points.map((p) => p.day))];
  if (days.length < 2) return null; // nothing to compare yet
  const price = (day: string, stay: StayKey) => points.find((p) => p.day === day && p.stay === stay);

  return (
    <div className="mt-1 px-2">
      <button onClick={() => setOpen(!open)} className="text-xs text-zinc-500 hover:text-zinc-200">
        {open ? "▾" : "▸"} history ({days.length} days)
      </button>
      {open && (
        <table className="mt-1 w-full text-xs tabular-nums">
          <thead className="text-zinc-500">
            <tr>
              <th className="py-1 text-left font-normal">Day</th>
              {STAYS.map((s) => (
                <th key={s.key} className="py-1 text-right font-normal">{s.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day, i) => (
              <tr key={day} className="border-t border-zinc-900">
                <td className="py-1 text-zinc-400">{shortDate(day)}</td>
                {STAYS.map((s) => {
                  const p = price(day, s.key);
                  const before = days.slice(i + 1).map((d) => price(d, s.key)).find(Boolean);
                  const color = !p || !before || p.price === before.price ? "text-zinc-300" : p.price < before.price ? "text-emerald-400" : "text-rose-400";
                  return (
                    <td key={s.key} className={`py-1 text-right ${color}`} title={p && `${shortDate(p.departDate)} → ${shortDate(p.returnDate)}`}>
                      {p ? money(p.price) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
