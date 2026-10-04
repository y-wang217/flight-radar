// Price history kept in SQLite (sql.js) inside this browser, persisted to IndexedDB.
// Rows are only recorded when the page is opened here, so days you don't visit are gaps
// and each browser has its own history. Browser-only: import from client components.
import initSqlJs, { type Database } from "sql.js";
import { localDay } from "./dates";
import type { StayKey } from "./types";

// One row per destination, stay bucket and day; a later check the same day replaces it.
export type PricePoint = {
  iata: string;
  stay: StayKey;
  day: string; // YYYY-MM-DD in Toronto
  price: number;
  departDate: string;
  returnDate: string;
  checkedAt: string;
};
export type Snapshot = Omit<PricePoint, "day">[];

const SCHEMA = `CREATE TABLE IF NOT EXISTS prices (
  iata TEXT NOT NULL, stay TEXT NOT NULL, day TEXT NOT NULL, price REAL NOT NULL,
  depart_date TEXT NOT NULL, return_date TEXT NOT NULL, checked_at TEXT NOT NULL,
  PRIMARY KEY (iata, stay, day))`;
const UPSERT = `INSERT INTO prices VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (iata, stay, day) DO UPDATE SET price = excluded.price, depart_date = excluded.depart_date,
  return_date = excluded.return_date, checked_at = excluded.checked_at
  WHERE excluded.checked_at > prices.checked_at`;
const IDB_NAME = "flight-radar";
const IDB_KEY = "history.sqlite";

// IndexedDB holds the exported database file. Failures (private mode etc.) fall back to memory.
function idb<T>(mode: IDBTransactionMode, op: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(IDB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore("files");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const req = op(open.result.transaction("files", mode).objectStore("files"));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    };
  });
}

let dbPromise: Promise<Database> | undefined;
function openDb(): Promise<Database> {
  return (dbPromise ??= (async () => {
    // public/sql-wasm-browser.wasm is copied from node_modules by the postinstall script.
    const SQL = await initSqlJs({ locateFile: (f) => `/${f}` });
    const saved = await idb<Uint8Array | undefined>("readonly", (s) => s.get(IDB_KEY)).catch(() => undefined);
    const db = new SQL.Database(saved);
    db.run(SCHEMA);
    return db;
  })());
}

// Records the fares currently on the page, then returns the full history, newest day first.
export async function recordAndLoad(snapshot: Snapshot): Promise<PricePoint[]> {
  const db = await openDb();
  const stmt = db.prepare(UPSERT);
  for (const f of snapshot) {
    stmt.run([f.iata, f.stay, localDay(f.checkedAt), f.price, f.departDate, f.returnDate, f.checkedAt]);
  }
  stmt.free();
  await idb("readwrite", (s) => s.put(db.export(), IDB_KEY)).catch(() => {});

  const [res] = db.exec("SELECT iata, stay, day, price, depart_date, return_date, checked_at FROM prices ORDER BY day DESC");
  return (res?.values ?? []).map(([iata, stay, day, price, departDate, returnDate, checkedAt]) => ({
    iata, stay, day, price, departDate, returnDate, checkedAt,
  }) as PricePoint);
}
