"use server";

import { revalidatePath } from "next/cache";
import { refreshAll } from "@/lib/store";

export async function refreshNow() {
  await refreshAll();
  revalidatePath("/");
}
