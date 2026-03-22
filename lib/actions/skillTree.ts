"use server";

import { cookies } from "next/headers";
import { auth } from "../auth";
import { prisma } from "../prisma";
import { getAppConfig } from "../config";

/** Returns userId (preferred) or guestId from cookie. */
async function getIdentity() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : ((await cookies()).get("guestId")?.value ?? null);
  return { userId, guestId, session };
}

const HAND_TO_PROGRESS: Record<string, string> = {
  "hand-vs-hand": "hand-vs-hand",
  preflop: "hand-vs-range",
  flop: "hand-vs-range-flop",
  turn: "hand-vs-range-turn",
  river: "hand-vs-range-river",
  "pot-odds": "pot-odds",
  "combined-pot-odds": "combined-pot-odds",
};

// Modules stored in RangeTrainingRound (separate table)
const RANGE_MODULES: Record<string, string> = {
  "preflop-ranges": "preflop-ranges",
};

// Returns the highest unlocked difficulty per progress-module.
// Key = module name (e.g. "hand-vs-range"), value = highest unlocked difficulty (2, 3 or 4).
// A module not present in the result has only Beginner unlocked (the default).
export async function getSkillTreeProgress(): Promise<Record<string, number>> {
  const { userId, guestId } = await getIdentity();

  // Authenticated user — read from UserProgress table
  if (userId) {
    const rows = await prisma.userProgress.findMany({
      where: { userId },
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

  // Guest — derive from TrainingHand + RangeTrainingRound data
  if (!guestId) return {};

  const { progressWindowSize, unlockThreshold } = await getAppConfig();
  const result: Record<string, number> = {};

  await Promise.all([
    ...Object.entries(HAND_TO_PROGRESS).map(async ([handModule, progressModule]) => {
      const hands = await prisma.trainingHand.findMany({
        where: { guestId, module: handModule, difficulty: 2, pointsScored: { not: null } },
        orderBy: { createdAt: "desc" },
        take: progressWindowSize,
        select: { pointsScored: true },
      });
      if (hands.length < progressWindowSize) return;
      const total = hands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
      if (total >= unlockThreshold) {
        result[progressModule] = 3;
      }
    }),
    ...Object.entries(RANGE_MODULES).map(async ([module, progressModule]) => {
      const rounds = await prisma.rangeTrainingRound.findMany({
        where: { guestId, module, difficulty: 2, pointsScored: { not: null } },
        orderBy: { createdAt: "desc" },
        take: progressWindowSize,
        select: { pointsScored: true },
      });
      if (rounds.length < progressWindowSize) return;
      const total = rounds.reduce((sum, r) => sum + (r.pointsScored ?? 0), 0);
      if (total >= unlockThreshold) {
        result[progressModule] = 3;
      }
    }),
  ]);

  return result;
}

// Returns progressModule names where the user has passed the highest difficulty
// accessible to their role (registered: difficulty 2, premium: difficulty 4, guest: difficulty 2).
export async function getCompletedModules(): Promise<string[]> {
  const { userId, guestId, session } = await getIdentity();
  if (!userId && !guestId) return [];

  const isPremium = !!(session?.user as any)?.isPremium;
  const maxDifficulty = isPremium ? 4 : 2;
  const ownerFilter = userId ? { userId } : { guestId };

  const { progressWindowSize, unlockThreshold } = await getAppConfig();

  const results = await Promise.all([
    ...Object.entries(HAND_TO_PROGRESS).map(async ([handModule, progressModule]) => {
      const hands = await prisma.trainingHand.findMany({
        where: { ...ownerFilter, module: handModule, difficulty: maxDifficulty, pointsScored: { not: null } },
        orderBy: { createdAt: "desc" },
        take: progressWindowSize,
        select: { pointsScored: true },
      });
      if (hands.length < progressWindowSize) return null;
      const total = hands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
      return total >= unlockThreshold ? progressModule : null;
    }),
    ...Object.entries(RANGE_MODULES).map(async ([module, progressModule]) => {
      const rounds = await prisma.rangeTrainingRound.findMany({
        where: { ...ownerFilter, module, difficulty: maxDifficulty, pointsScored: { not: null } },
        orderBy: { createdAt: "desc" },
        take: progressWindowSize,
        select: { pointsScored: true },
      });
      if (rounds.length < progressWindowSize) return null;
      const total = rounds.reduce((sum, r) => sum + (r.pointsScored ?? 0), 0);
      return total >= unlockThreshold ? progressModule : null;
    }),
  ]);

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

  const { userId, guestId } = await getIdentity();
  if (!userId && !guestId) {
    return { scores: {}, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints };
  }

  const ownerFilter = userId ? { userId } : { guestId };

  // One query per module in parallel — bounded by windowSize*4 rows each
  const [trainingResults, rangeResults] = await Promise.all([
    Promise.all(
      Object.entries(HAND_TO_PROGRESS).map(async ([handModule, progressModule]) => {
        const hands = await prisma.trainingHand.findMany({
          where: { ...ownerFilter, module: handModule, pointsScored: { not: null } },
          orderBy: { createdAt: "desc" },
          take: progressWindowSize * 4,
          select: { difficulty: true, pointsScored: true },
        });
        return { progressModule, hands };
      })
    ),
    Promise.all(
      Object.entries(RANGE_MODULES).map(async ([module, progressModule]) => {
        const rounds = await prisma.rangeTrainingRound.findMany({
          where: { ...ownerFilter, module, pointsScored: { not: null } },
          orderBy: { createdAt: "desc" },
          take: progressWindowSize * 4,
          select: { difficulty: true, pointsScored: true },
        });
        return { progressModule, hands: rounds };
      })
    ),
  ]);

  const scores: Record<string, Record<number, { count: number; total: number }>> = {};

  for (const { progressModule, hands } of [...trainingResults, ...rangeResults]) {
    scores[progressModule] = {};
    const seen: Record<number, number> = {};

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
