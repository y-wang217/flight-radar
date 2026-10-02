import { removeDestination } from "@/lib/store";

export async function DELETE(_req: Request, { params }: { params: Promise<{ iata: string }> }) {
  const { iata } = await params;
  await removeDestination(iata.toUpperCase());
  return new Response(null, { status: 204 });
}
