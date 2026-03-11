"use server";

import { prisma } from "../prisma";
import { auth } from "../auth";
import { getAppConfig, CONFIG_DEFAULTS, type ConfigKey } from "../config";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) throw new Error("Unauthorized");
}

export async function getVillainConfig() {
  await requireAdmin();
  return getAppConfig();
}

export async function saveVillainConfig(key: ConfigKey, value: number) {
  await requireAdmin();

  if (value <= 0) throw new Error("Value must be positive");

  await prisma.appConfig.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });

  revalidatePath("/villain");
}

export async function resetVillainConfig(key: ConfigKey) {
  await requireAdmin();

  await prisma.appConfig.deleteMany({ where: { key } });
  revalidatePath("/villain");
}
