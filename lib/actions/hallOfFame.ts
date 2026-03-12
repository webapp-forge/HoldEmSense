"use server";

import { prisma } from "../prisma";

export type LeaderboardEntry = {
  rank: number;
  username: string;
  score: number;
  handsPlayed: number;
};

async function computeLeaderboard(
  dateFilter?: { gte: Date; lt: Date }
): Promise<LeaderboardEntry[]> {
  const hands = await prisma.trainingHand.findMany({
    where: {
      userId: { not: null },
      pointsScored: { not: null },
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    },
    select: {
      userId: true,
      module: true,
      difficulty: true,
      pointsScored: true,
      user: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by userId -> (module:difficulty) -> take last 100 -> sum
  const userComboMap = new Map<string, Map<string, { count: number; sum: number }>>();
  const usernames = new Map<string, string>();

  for (const hand of hands) {
    const uid = hand.userId!;
    if (!userComboMap.has(uid)) {
      userComboMap.set(uid, new Map());
      usernames.set(uid, hand.user?.username ?? "Unknown");
    }
    const comboKey = `${hand.module}:${hand.difficulty}`;
    const comboMap = userComboMap.get(uid)!;
    const existing = comboMap.get(comboKey) ?? { count: 0, sum: 0 };
    if (existing.count < 100) {
      existing.sum += hand.pointsScored!;
      existing.count++;
      comboMap.set(comboKey, existing);
    }
  }

  const scores: { userId: string; score: number; handsPlayed: number }[] = [];
  for (const [uid, comboMap] of userComboMap.entries()) {
    const score = Array.from(comboMap.values()).reduce((s, c) => s + c.sum, 0);
    const handsPlayed = Array.from(comboMap.values()).reduce((s, c) => s + c.count, 0);
    scores.push({ userId: uid, score, handsPlayed });
  }

  scores.sort((a, b) => b.score - a.score);

  return scores.slice(0, 20).map((entry, i) => ({
    rank: i + 1,
    username: usernames.get(entry.userId) ?? "Unknown",
    score: entry.score,
    handsPlayed: entry.handsPlayed,
  }));
}

export async function getHallOfFameMonth(year: number, month: number): Promise<LeaderboardEntry[]> {
  const seasonStart = new Date(year, month - 1, 1);
  const seasonEnd = new Date(year, month, 1);
  return computeLeaderboard({ gte: seasonStart, lt: seasonEnd });
}

export async function getHallOfFameAllTime(): Promise<LeaderboardEntry[]> {
  return computeLeaderboard();
}
