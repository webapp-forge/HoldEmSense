"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setFourColorDeck(enabled: boolean) {
  const cookieStore = await cookies();
  cookieStore.set("fourColorDeck", enabled ? "1" : "0", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

export async function getFourColorDeck(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("fourColorDeck")?.value === "1";
}
