import { addDestination, refreshFare } from "@/lib/store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const iata = String(body.iata ?? "").trim().toUpperCase();
  const label = String(body.label ?? "").trim().slice(0, 40) || iata;
  if (!/^[A-Z]{3}$/.test(iata)) {
    return Response.json({ error: "IATA code must be 3 letters" }, { status: 400 });
  }
  if (!(await addDestination(iata, label))) {
    return Response.json({ error: `${iata} is already on the list` }, { status: 409 });
  }
  try {
    return Response.json({ iata, label, fare: await refreshFare(iata) }, { status: 201 });
  } catch (err) {
    return Response.json({ iata, label, fare: null, warning: String(err) }, { status: 201 });
  }
}
