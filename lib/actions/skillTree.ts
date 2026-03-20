"use server";

import { auth } from "../auth";
import { prisma } from "../prisma";
import { getAppConfig } from "../config";

const HAND_TO_PROGRESS: Record<string, string> = {
  "hand-vs-hand": "hand-vs-hand",
  preflop: "hand-vs-range",
  flop: "hand-vs-range-flop",
  turn: "hand-vs-range-turn",
  river: "hand-vs-range-river",
  "pot-odds": "pot-odds",
  "combined-pot-odds": "combined-pot-odds",
};

// Returns the highest unlocked difficulty per progress-module.
// Key = module name (e.g. "hand-vs-range"), value = highest unlocked difficulty (2, 3 or 4).
// A module not present in the result has only Beginner unlocked (the default).
export async function getSkillTreeProgress(): Promise<Record<string, number>> {
  const session = await auth();
  if (!session?.user?.id) return {};

  const rows = await prisma.userProgress.findMany({
    where: { userId: session.user.id },
    select: { module: true, difficulty: true },
  });

  const result: Record<string, number> = {};
  for (const row of rows) {
    if (!result[row.module] || row.difficulty > result[row.module]) {
      result[row.module] = row.difficulty;
    }
  }
  return result;
}

// Returns progressModule names where the user has passed the highest difficulty
// accessible to their role (registered: difficulty 2, premium: difficulty 4).
export async function getCompletedModules(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const isPremium = !!(session.user as any).isPremium;
  const maxDifficulty = isPremium ? 4 : 2;

  const { progressWindowSize, unlockThreshold } = await getAppConfig();

  const results = await Promise.all(
    Object.entries(HAND_TO_PROGRESS).map(async ([handModule, progressModule]) => {
      const hands = await prisma.trainingHand.findMany({
        where: { userId, module: handModule, difficulty: maxDifficulty, pointsScored: { not: null } },
        orderBy: { createdAt: "desc" },
        take: progressWindowSize,
        select: { pointsScored: true },
      });
      if (hands.length < progressWindowSize) return null;
      const total = hands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
      return total >= unlockThreshold ? progressModule : null;
    })
  );

  return results.filter((m): m is string => m !== null);
}

// Returns per-module, per-difficulty rolling-window scores in a single efficient batch.
// scores["hand-vs-range"][2] = { count: 45, total: 112 }
export async function getSkillCardProgress(): Promise<{
  scores: Record<string, Record<number, { count: number; total: number }>>;
  windowSize: number;
  unlockThreshold: number;
  maxPoints: number;
}> {
  const { progressWindowSize, unlockThreshold, maxProgressPoints } = await getAppConfig();

  const session = await auth();
  if (!session?.user?.id) {
    return { scores: {}, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints };
  }

  const userId = session.user.id;

  // One query per module in parallel — bounded by windowSize*4 rows each
  const results = await Promise.all(
    Object.entries(HAND_TO_PROGRESS).map(async ([handModule, progressModule]) => {
      const hands = await prisma.trainingHand.findMany({
        where: { userId, module: handModule, pointsScored: { not: null } },
        orderBy: { createdAt: "desc" },
        take: progressWindowSize * 4, // max windowSize rows per difficulty × 4 difficulties
        select: { difficulty: true, pointsScored: true },
      });
      return { progressModule, hands };
    })
  );

  const scores: Record<string, Record<number, { count: number; total: number }>> = {};

  for (const { progressModule, hands } of results) {
    scores[progressModule] = {};
    const seen: Record<number, number> = {}; // difficulty → count already added

    for (const hand of hands) {
      const diff = hand.difficulty;
      if ((seen[diff] ?? 0) >= progressWindowSize) continue;
      if (!scores[progressModule][diff]) scores[progressModule][diff] = { count: 0, total: 0 };
      scores[progressModule][diff].count++;
      scores[progressModule][diff].total += hand.pointsScored!;
      seen[diff] = (seen[diff] ?? 0) + 1;
    }
  }

  return { scores, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints };
}
