"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { refreshNow } from "./actions";

export function RefreshButton() {
  return (
    <form action={refreshNow}>
      <RefreshSubmit />
    </form>
  );
}

function RefreshSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "Refreshing…" : "Refresh now"}
    </button>
  );
}

export function RemoveButton({ iata }: { iata: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    await fetch(`/api/destinations/${iata}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <button
      onClick={remove}
      disabled={busy}
      aria-label={`Remove ${iata}`}
      className="px-3 py-4 text-lg text-zinc-600 hover:text-zinc-200 disabled:opacity-30"
    >
      ×
    </button>
  );
}

export function AddForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add(form: FormData) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/destinations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iata: form.get("iata"), label: form.get("label") }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(body.error ?? "Could not add");
    if (body.warning) setError(`Added, but the fare lookup failed: ${body.warning}`);
    router.refresh();
  }

  return (
    <form action={add} className="mt-6">
      <div className="flex gap-2">
        <input
          name="iata"
          required
          maxLength={3}
          placeholder="IATA"
          autoCapitalize="characters"
          className="w-20 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 uppercase placeholder:normal-case"
        />
        <input
          name="label"
          placeholder="Label (e.g. Lisbon)"
          className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
        />
        <button disabled={busy} className="rounded-md bg-zinc-100 px-4 py-2 font-medium text-zinc-900 disabled:opacity-50">
          {busy ? "…" : "Add"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </form>
  );
}
