import { prisma } from "./prisma";

export const CONFIG_DEFAULTS = {
  progressWindowSize: 100,
  unlockThreshold: 250,
  maxProgressPoints: 300,
  leakBaseMinutes: 60,
} as const;

export type ConfigKey = keyof typeof CONFIG_DEFAULTS;

export async function getAppConfig(): Promise<typeof CONFIG_DEFAULTS> {
  const rows = await prisma.appConfig.findMany();
  const result = { ...CONFIG_DEFAULTS };
  for (const row of rows) {
    if (row.key in CONFIG_DEFAULTS) {
      (result as Record<string, number>)[row.key] = Number(row.value);
    }
  }
  return result;
}
