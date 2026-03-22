"use server";

import { prisma } from "../prisma";
import { auth } from "../auth";
import { cookies } from "next/headers";
import { getAppConfig } from "../config";
import { generateRangeRound } from "../ranges/handSelection";
import { checkAndGrantAchievements } from "./achievements";
import { revalidatePath } from "next/cache";

const MODULE = "preflop-ranges";

function scoreRange(correctCount: number): number {
  if (correctCount === 8) return 3;
  if (correctCount === 7) return 2;
  if (correctCount === 6) return 1;
  return 0;
}

async function checkAndUnlockRange(userId: string, difficulty: number): Promise<number | null> {
  if (difficulty >= 4) return null;

  if (difficulty >= 2) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPremium: true } });
    if (!user?.isPremium) return null;
  }

  const { progressWindowSize, unlockThreshold } = await getAppConfig();

  const rounds = await prisma.rangeTrainingRound.findMany({
    where: { userId, difficulty, module: MODULE, pointsScored: { not: null } },
    orderBy: { createdAt: "desc" },
    take: progressWindowSize,
    select: { pointsScored: true },
  });

  if (rounds.length < progressWindowSize) return null;

  const total = rounds.reduce((sum, r) => sum + (r.pointsScored ?? 0), 0);
  if (total < unlockThreshold) return null;

  const nextDifficulty = difficulty + 1;
  try {
    await prisma.userProgress.create({
      data: { userId, module: MODULE, difficulty: nextDifficulty },
    });
  } catch {
    // Already unlocked
  }
  return nextDifficulty;
}

export async function getOrCreateRangeRound(difficulty: number) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : ((await cookies()).get("guestId")?.value ?? null);

  if (!userId && !guestId) return null;

  // Check for existing unanswered round
  const ownerFilter = userId ? { userId } : { guestId };
  const existing = await prisma.rangeTrainingRound.findFirst({
    where: { ...ownerFilter, module: MODULE, userAnswers: null },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const handTypes = existing.handTypes.split(",");
    return {
      roundId: existing.id,
      position: existing.position,
      handTypes,
      difficulty: existing.difficulty,
    };
  }

  // Generate new round
  const round = generateRangeRound(difficulty);

  const created = await prisma.rangeTrainingRound.create({
    data: {
      userId,
      guestId,
      module: MODULE,
      difficulty,
      position: round.position,
      handTypes: round.handTypes.join(","),
      correctAnswers: round.correctAnswers.map((a) => (a ? "1" : "0")).join(","),
    },
  });

  return {
    roundId: created.id,
    position: round.position,
    handTypes: round.handTypes,
    difficulty,
  };
}

export async function submitRangeAnswers(roundId: string, answers: boolean[]) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : ((await cookies()).get("guestId")?.value ?? null);

  const round = await prisma.rangeTrainingRound.findUnique({ where: { id: roundId } });
  if (!round) return null;

  // Verify ownership
  if (userId && round.userId !== userId) return null;
  if (!userId && guestId && round.guestId !== guestId) return null;

  // Already answered
  if (round.userAnswers) {
    const correctAnswers = round.correctAnswers.split(",").map((a) => a === "1");
    return {
      correctAnswers,
      pointsScored: round.pointsScored ?? 0,
      correctCount: correctAnswers.filter((a, i) => a === (round.userAnswers!.split(",")[i] === "1")).length,
    };
  }

  const correctAnswers = round.correctAnswers.split(",").map((a) => a === "1");
  const correctCount = answers.filter((a, i) => a === correctAnswers[i]).length;
  const points = scoreRange(correctCount);

  const userAnswersStr = answers.map((a) => (a ? "1" : "0")).join(",");

  await prisma.rangeTrainingRound.update({
    where: { id: roundId },
    data: { userAnswers: userAnswersStr, pointsScored: points },
  });

  const { progressWindowSize, unlockThreshold, maxProgressPoints } = await getAppConfig();

  // Guest progress
  if (!userId) {
    const guestRounds = await prisma.rangeTrainingRound.findMany({
      where: { guestId, difficulty: round.difficulty, module: MODULE, pointsScored: { not: null } },
      orderBy: { createdAt: "desc" },
      take: progressWindowSize,
      select: { pointsScored: true },
    });
    const guestTotal = guestRounds.reduce((sum, r) => sum + (r.pointsScored ?? 0), 0);
    return {
      correctAnswers,
      pointsScored: points,
      correctCount,
      unlockedDifficulty: null,
      progress: { count: guestRounds.length, total: guestTotal, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints },
    };
  }

  const unlockedDifficulty = await checkAndUnlockRange(userId, round.difficulty);
  const newAchievements = await checkAndGrantAchievements(userId);

  if (points >= 3) revalidatePath("/", "layout");

  const recentRounds = await prisma.rangeTrainingRound.findMany({
    where: { userId, difficulty: round.difficulty, module: MODULE, pointsScored: { not: null } },
    orderBy: { createdAt: "desc" },
    take: progressWindowSize,
    select: { pointsScored: true },
  });
  const progressTotal = recentRounds.reduce((sum, r) => sum + (r.pointsScored ?? 0), 0);

  return {
    correctAnswers,
    pointsScored: points,
    correctCount,
    unlockedDifficulty,
    newAchievements,
    progress: { count: recentRounds.length, total: progressTotal, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints },
  };
}

export async function getRangeProgress(difficulty: number) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : ((await cookies()).get("guestId")?.value ?? null);

  const { progressWindowSize, unlockThreshold, maxProgressPoints } = await getAppConfig();

  if (!userId && !guestId) return { count: 0, total: 0, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints };

  const where = userId
    ? { userId, difficulty, module: MODULE, pointsScored: { not: null } }
    : { guestId, difficulty, module: MODULE, pointsScored: { not: null } };

  const rounds = await prisma.rangeTrainingRound.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: progressWindowSize,
    select: { pointsScored: true },
  });

  const total = rounds.reduce((sum, r) => sum + (r.pointsScored ?? 0), 0);

  if (userId && rounds.length >= progressWindowSize && total >= unlockThreshold) {
    await checkAndUnlockRange(userId, difficulty);
  }

  return { count: rounds.length, total, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints };
}

export async function getUnlockedRangeDifficulties(): Promise<number[]> {
  const session = await auth();
  if (!session?.user?.id) return [1];

  const isPremium = !!(session.user as any).isPremium;
  const maxDifficulty = isPremium ? 4 : 2;

  const progress = await prisma.userProgress.findMany({
    where: { userId: session.user.id, module: MODULE },
    select: { difficulty: true },
  });

  const unlocked = new Set([1, ...progress.map((p) => p.difficulty)]);
  return Array.from(unlocked)
    .filter((d) => d <= maxDifficulty)
    .sort((a, b) => a - b);
}
