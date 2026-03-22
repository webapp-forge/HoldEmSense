"use server";

import { prisma } from "../prisma";
import { ACHIEVEMENT_CONFIG, AchievementKey } from "../achievementConfig";

export type ChipData = {
  key: string;
  color: string;
  value: number;
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  score: number;
  handsPlayed: number;
  chips: ChipData[];
};

async function computeLeaderboard(
  dateFilter?: { gte: Date; lt: Date }
): Promise<LeaderboardEntry[]> {
  const DIFFICULTY_WEIGHT: Record<number, number> = { 1: 1, 2: 1.5, 3: 2, 4: 2.5 };

  const hands = await prisma.trainingHand.findMany({
    where: {
      userId: { not: null },
      pointsScored: { not: null },
      user: { deletedAt: null },
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    },
    select: {
      userId: true,
      difficulty: true,
      pointsScored: true,
      user: { select: { username: true } },
    },
  });

  const userMap = new Map<string, { score: number; handsPlayed: number; username: string }>();

  for (const hand of hands) {
    const uid = hand.userId!;
    const weight = DIFFICULTY_WEIGHT[hand.difficulty] ?? 1;
    const existing = userMap.get(uid) ?? { score: 0, handsPlayed: 0, username: hand.user?.username ?? "Unknown" };
    existing.score += hand.pointsScored! * weight;
    existing.handsPlayed++;
    userMap.set(uid, existing);
  }

  const scores = Array.from(userMap.entries()).map(([uid, data]) => ({
    userId: uid,
    score: Math.round(data.score),
    handsPlayed: data.handsPlayed,
    username: data.username,
  }));

  scores.sort((a, b) => b.score - a.score);

  const top20 = scores.slice(0, 20);
  const topUserIds = top20.map((e) => e.userId);

  const achievements = await prisma.achievement.findMany({
    where: { userId: { in: topUserIds } },
    select: { userId: true, key: true },
    orderBy: { earnedAt: "asc" },
  });

  const chipMap = new Map<string, ChipData[]>();
  for (const a of achievements) {
    const config = ACHIEVEMENT_CONFIG[a.key as AchievementKey];
    if (!config) continue;
    const arr = chipMap.get(a.userId) ?? [];
    arr.push({ key: a.key, color: config.color, value: config.value });
    chipMap.set(a.userId, arr);
  }

  return top20.map((entry, i) => ({
    rank: i + 1,
    username: entry.username,
    score: entry.score,
    handsPlayed: entry.handsPlayed,
    chips: chipMap.get(entry.userId) ?? [],
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
