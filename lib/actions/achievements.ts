"use server";

import { prisma } from "../prisma";
import { getAppConfig } from "../config";
import {
  ACHIEVEMENT_CONFIG,
  AchievementKey,
  GROUP1_HAND_MODULES,
  GROUP1_PROGRESS_MODULES,
  GROUP2_MODULES,
  STREAK_THRESHOLDS,
} from "../achievementConfig";

async function checkGroup1FirstHand(userId: string): Promise<boolean> {
  const counts = await Promise.all(
    GROUP1_HAND_MODULES.map((mod) =>
      prisma.trainingHand.count({
        where: { userId, module: mod, pointsScored: { equals: 3 } },
      })
    )
  );
  return counts.every((c) => c > 0);
}

async function checkGroup1LevelUnlocked(userId: string, difficulty: number): Promise<boolean> {
  // "Level X absolviert" = UserProgress entry for difficulty X+1 exists in all 4 modules
  const records = await prisma.userProgress.findMany({
    where: {
      userId,
      module: { in: [...GROUP1_PROGRESS_MODULES] },
      difficulty: difficulty + 1,
    },
    select: { module: true },
  });
  const unlockedModules = new Set(records.map((r) => r.module));
  return GROUP1_PROGRESS_MODULES.every((m) => unlockedModules.has(m));
}

async function checkGroup1Expert(userId: string): Promise<boolean> {
  // Expert = difficulty 4 window score >= unlockThreshold in all 4 modules
  const { progressWindowSize, unlockThreshold } = await getAppConfig();

  const results = await Promise.all(
    GROUP1_HAND_MODULES.map(async (mod) => {
      const hands = await prisma.trainingHand.findMany({
        where: { userId, module: mod, difficulty: 4, pointsScored: { not: null } },
        orderBy: { createdAt: "desc" },
        take: progressWindowSize,
        select: { pointsScored: true },
      });
      if (hands.length < progressWindowSize) return false;
      const total = hands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
      return total >= unlockThreshold;
    })
  );
  return results.every(Boolean);
}

async function checkGroup2FirstHand(userId: string): Promise<boolean> {
  const counts = await Promise.all(
    GROUP2_MODULES.map((mod) =>
      prisma.trainingHand.count({
        where: { userId, module: mod, pointsScored: { equals: 3 } },
      })
    )
  );
  return counts.every((c) => c > 0);
}

async function checkGroup2LevelUnlocked(userId: string, difficulty: number): Promise<boolean> {
  const records = await prisma.userProgress.findMany({
    where: {
      userId,
      module: { in: [...GROUP2_MODULES] },
      difficulty: difficulty + 1,
    },
    select: { module: true },
  });
  const unlockedModules = new Set(records.map((r) => r.module));
  return GROUP2_MODULES.every((m) => unlockedModules.has(m));
}

async function checkGroup2Expert(userId: string): Promise<boolean> {
  const { progressWindowSize, unlockThreshold } = await getAppConfig();

  const results = await Promise.all(
    GROUP2_MODULES.map(async (mod) => {
      const hands = await prisma.trainingHand.findMany({
        where: { userId, module: mod, difficulty: 4, pointsScored: { not: null } },
        orderBy: { createdAt: "desc" },
        take: progressWindowSize,
        select: { pointsScored: true },
      });
      if (hands.length < progressWindowSize) return false;
      const total = hands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
      return total >= unlockThreshold;
    })
  );
  return results.every(Boolean);
}

async function getCurrentStreak(userId: string): Promise<number> {
  const rows = await prisma.$queryRaw<{ day: unknown }[]>`
    SELECT DISTINCT DATE(createdAt) AS day
    FROM TrainingHand
    WHERE userId = ${userId}
      AND pointsScored >= 3
    ORDER BY day DESC
    LIMIT 1826
  `;
  if (rows.length === 0) return 0;

  const normalize = (val: unknown): string =>
    val instanceof Date ? val.toISOString().slice(0, 10) : String(val).slice(0, 10);
  const toStr = (d: Date) => d.toISOString().slice(0, 10);
  const now = new Date();
  const todayStr = toStr(now);
  const yest = new Date(now);
  yest.setUTCDate(yest.getUTCDate() - 1);

  const dates = rows.map((r) => normalize(r.day));
  if (dates[0] !== todayStr && dates[0] !== toStr(yest)) return 0;

  let streak = 0;
  const start = new Date(dates[0] + "T00:00:00Z");
  for (const dateStr of dates) {
    const expected = new Date(start);
    expected.setUTCDate(expected.getUTCDate() - streak);
    if (dateStr === toStr(expected)) streak++;
    else break;
  }
  return streak;
}

async function checkLeakFirstTrained(userId: string): Promise<boolean> {
  // "Richtig gelöst auf stage 1" = hand advanced past stage 1 (now at stage 2, 3, or 4)
  const count = await prisma.trainingHand.count({
    where: { userId, repetitionStage: { gte: 2 } },
  });
  return count > 0;
}

async function checkLeaksFixed(userId: string, threshold: number): Promise<boolean> {
  const count = await prisma.trainingHand.count({
    where: { userId, repetitionStage: 4 },
  });
  return count >= threshold;
}

async function isAlreadyEarned(userId: string, key: AchievementKey): Promise<boolean> {
  const existing = await prisma.achievement.findUnique({
    where: { userId_key: { userId, key } },
  });
  return !!existing;
}

async function grant(userId: string, key: AchievementKey): Promise<void> {
  await prisma.achievement.create({ data: { userId, key } }).catch(() => {
    // Already exists — ignore
  });
}

export async function checkAndGrantAchievements(userId: string): Promise<AchievementKey[]> {
  const streak = await getCurrentStreak(userId);

  const checks: { key: AchievementKey; check: () => Promise<boolean> }[] = [
    { key: "group1_first_hand",   check: () => checkGroup1FirstHand(userId) },
    { key: "group1_beginner",     check: () => checkGroup1LevelUnlocked(userId, 1) },
    { key: "group1_intermediate", check: () => checkGroup1LevelUnlocked(userId, 2) },
    { key: "group1_advanced",     check: () => checkGroup1LevelUnlocked(userId, 3) },
    { key: "group1_expert",       check: () => checkGroup1Expert(userId) },
    { key: "group2_first_hand",   check: () => checkGroup2FirstHand(userId) },
    { key: "group2_beginner",     check: () => checkGroup2LevelUnlocked(userId, 1) },
    { key: "group2_intermediate", check: () => checkGroup2LevelUnlocked(userId, 2) },
    { key: "group2_advanced",     check: () => checkGroup2LevelUnlocked(userId, 3) },
    { key: "group2_expert",       check: () => checkGroup2Expert(userId) },
    ...STREAK_THRESHOLDS.map(({ key, days }) => ({
      key,
      check: async () => streak >= days,
    })),
    { key: "leak_first_trained" as AchievementKey, check: () => checkLeakFirstTrained(userId) },
    { key: "leak_first_fixed"   as AchievementKey, check: () => checkLeaksFixed(userId, 1) },
    { key: "leak_10_fixed"      as AchievementKey, check: () => checkLeaksFixed(userId, 10) },
    { key: "leak_100_fixed"     as AchievementKey, check: () => checkLeaksFixed(userId, 100) },
    { key: "leak_500_fixed"     as AchievementKey, check: () => checkLeaksFixed(userId, 500) },
    { key: "leak_1000_fixed"    as AchievementKey, check: () => checkLeaksFixed(userId, 1000) },
    { key: "leak_5000_fixed"    as AchievementKey, check: () => checkLeaksFixed(userId, 5000) },
  ];

  const newlyEarned: AchievementKey[] = [];

  for (const { key, check } of checks) {
    if (await isAlreadyEarned(userId, key)) continue;
    if (await check()) {
      await grant(userId, key);
      newlyEarned.push(key);
    }
  }

  return newlyEarned;
}

export async function getUserAchievements(userId: string): Promise<AchievementKey[]> {
  const rows = await prisma.achievement.findMany({
    where: { userId },
    select: { key: true },
    orderBy: { earnedAt: "asc" },
  });
  return rows.map((r) => r.key as AchievementKey);
}
